import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => import('smocket-client'));
import {
  formatAck,
  formatCall,
  formatMembership,
  formatReach,
  type AckLine,
  type DeliveryLine,
  type MembershipLine,
  type TraceLine,
} from '../trace';
import { createRound, ROOM, WORD, type Round } from '../room';

/* The delivery record is what this demo sells, so it is the thing under test.
   Each case drives a real smocket broadcast and reads the line back: the reach
   lists come from the adapter's routing decision, the event names and payloads
   from the recipients' outgoing catch-alls, the room lines from add/del, and the
   ack from the game code (계획서 §1). Nothing here asserts against a string the
   demo made up about itself. */

let round: Round;

beforeEach(async () => {
  round = await createRound();
  return () => round.dispose();
});

const lines = (): readonly TraceLine[] => round.trace.lines();

const deliveries = (event: string): DeliveryLine[] =>
  lines().filter((line): line is DeliveryLine => line.kind === 'delivery' && line.event === event);

const only = <T>(found: T[]): T => {
  expect(found).toHaveLength(1);
  return found[0];
};

it('a stroke reaches the room and is kept from the drawer', async () => {
  round.stroke({ id: 1, pts: [[0.1, 0.2]] });

  await expect.poll(() => deliveries('stroke')).toHaveLength(1);

  const stroke = only(deliveries('stroke'));
  expect(formatCall(stroke)).toBe("socket_A.to('room-1').emit('stroke', {…})");
  expect(formatReach(stroke)).toBe('→ B, C  (except A)');
  expect(stroke.reached).toEqual(['B', 'C']);
  expect(stroke.excluded).toEqual(['A']);

  const inbound = lines().filter(
    (line) => line.kind === 'inbound' && line.event === 'stroke',
  );
  expect(inbound).toHaveLength(1);
  expect(inbound[0]).toMatchObject({ from: 'A', args: [{ id: 1, pts: [[0.1, 0.2]] }] });
});

it('the word reaches the drawer alone', async () => {
  round.word();

  await expect.poll(() => deliveries('word')).toHaveLength(1);

  const word = only(deliveries('word'));
  expect(formatCall(word)).toBe(`io.to(sid_A).emit('word', '${WORD}')`);
  expect(formatReach(word)).toBe('→ A');
  expect(formatCall(word, { maskWord: true })).toBe("io.to(sid_A).emit('word', '****')");
});

it('a chat reaches the whole room, sender included', async () => {
  round.chat('B', 'hello');

  await expect.poll(() => deliveries('chat')).toHaveLength(1);

  const chat = only(deliveries('chat'));
  expect(formatCall(chat)).toBe("io.to('room-1').emit('chat', {…})");
  expect(formatReach(chat)).toBe('→ A, B, C');
  expect(chat.excluded).toEqual([]);
});

it('joining the room is recorded, and the id-room bookkeeping is not', () => {
  const joins = lines().filter(
    (line): line is MembershipLine => line.kind === 'membership' && line.op === 'add',
  );

  expect(joins.map(formatMembership)).toEqual([
    `A joined ${ROOM}`,
    `B joined ${ROOM}`,
    `C joined ${ROOM}`,
  ]);
});

it('leaving the room is recorded through the same hook', () => {
  round.dispose();

  return expect
    .poll(() =>
      lines()
        .filter((line): line is MembershipLine => line.kind === 'membership' && line.op === 'del')
        .map(formatMembership),
    )
    .toEqual([`A left ${ROOM}`, `B left ${ROOM}`, `C left ${ROOM}`]);
});

it('a correct guess is acked, and the ack reads apart from the deliveries', async () => {
  await expect(round.guess('B', WORD)).resolves.toBe(true);

  const ack = only(lines().filter((line): line is AckLine => line.kind === 'ack'));
  expect(formatAck(ack)).toBe('← ack B true');

  // The ack is the game code's own record, so the thing that matters is that it
  // never passes for a routed delivery: no arrow, no reach list, no line kind in
  // common (계획서 §1-2).
  expect(formatAck(ack).startsWith('←')).toBe(true);
  expect(
    lines()
      .filter((line) => line.kind === 'delivery')
      .map(formatReach)
      .join(),
  ).not.toContain('←');

  // A correct guess also delivers the other two of the three (기획 §3-4).
  expect(formatReach(only(deliveries('correct')))).toBe('→ B');
  expect(formatReach(only(deliveries('announce')))).toBe('→ A, B, C');
});

it('a wrong guess is acked false and announces nothing', async () => {
  await expect(round.guess('C', 'zebra')).resolves.toBe(false);

  expect(formatAck(only(lines().filter((line): line is AckLine => line.kind === 'ack')))).toBe(
    '← ack C false',
  );
  expect(deliveries('announce')).toHaveLength(0);
});

it('what the user fires is recorded too', async () => {
  await round.guess('B', 'giraffe');

  const inbound = lines().filter(
    (line) => line.kind === 'inbound' && line.event === 'guess',
  );
  expect(inbound).toHaveLength(1);
});

it('no line claims a call the adapter did not route', async () => {
  round.word();
  round.stroke({ id: 1, pts: [[0.1, 0.2]] });
  round.chat('B', 'hello');

  await expect
    .poll(() => lines().filter((line) => line.kind === 'delivery'))
    .toHaveLength(3);

  const drifted = lines().filter((line) => line.kind === 'delivery' && line.mismatch);
  expect(drifted).toEqual([]);
});

it('the snapshot changes identity when a line is added, and only then', () => {
  // The panel subscribes through `useSyncExternalStore`, which compares snapshots
  // by identity: a log returned as the same mutated array reads as "nothing
  // happened" and the panel stops repainting after its first frame. Every
  // assertion in this file reads `lines()` directly and so cannot see that, which
  // is how it reached a browser before it was caught.
  const before = lines();
  expect(lines()).toBe(before);

  round.chat('B', 'hello');

  const after = lines();
  expect(after).not.toBe(before);
  expect(lines()).toBe(after);
});

/* The two cases below are what keeps the one above from passing on a detector
   that never fires. The call form is the one part of a line the game code
   asserts rather than smocket observing it, so the check that catches a drifting
   assertion has to be shown working. */

it('a declared room the adapter was never asked about is flagged', () => {
  round.trace.deliver({ to: ['room-2'] }, () =>
    round.io!.to(ROOM).emit('chat', { from: 'B', text: 'hi' }),
  );

  expect(only(deliveries('chat')).mismatch).toBe('declared to [room-2], routed [room-1]');
});

it('a declared sender the routing never excluded is flagged', () => {
  round.trace.deliver({ from: 'B', to: [ROOM] }, () =>
    round.io!.to(ROOM).emit('chat', { from: 'B', text: 'hi' }),
  );

  expect(only(deliveries('chat')).mismatch).toBe('declared from [B], excluded []');
});
