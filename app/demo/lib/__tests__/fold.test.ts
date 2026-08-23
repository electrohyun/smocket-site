import { expect, it } from 'vitest';
import { fold } from '../fold';
import type { DeliveryLine, InboundLine, ReceivedLine, TraceLine } from '../trace';

/* Folding is the one place the panel is allowed to show fewer lines than the
   record holds, so what it may and may not swallow is worth pinning down. */

const delivery = (
  event: string,
  reached: string[],
  excluded: string[] = [],
  from?: string,
): DeliveryLine => ({
  kind: 'delivery',
  from,
  rooms: [{ kind: 'room', name: 'room-1' }],
  event,
  args: [],
  reached,
  excluded,
});

const counts = (lines: TraceLine[]) => fold(lines).map((f) => [f.line.kind, f.count]);

const inbound = (event: string, from = 'A', args: unknown[] = []): InboundLine => ({
  kind: 'inbound',
  from,
  event,
  args,
});

const received = (event: string, to = 'B', args: unknown[] = []): ReceivedLine => ({
  kind: 'received',
  to,
  event,
  args,
});

it('alternating inbound and delivery strokes become two counted lines', () => {
  const lines = Array.from({ length: 47 }, (_, index) => [
    inbound('stroke', 'A', [{ id: index }]),
    { ...delivery('stroke', ['B', 'C'], ['A'], 'A'), args: [{ id: index }] },
  ]).flat();

  const folded = fold(lines);

  expect(counts(lines)).toEqual([
    ['inbound', 47],
    ['delivery', 47],
  ]);
  expect((folded[0].line as InboundLine).args).toEqual([{ id: 46 }]);
  expect((folded[1].line as DeliveryLine).args).toEqual([{ id: 46 }]);
});

it('a game event splits an alternating stroke run', () => {
  const pair = (): TraceLine[] => [
    inbound('stroke'),
    delivery('stroke', ['B', 'C'], ['A'], 'A'),
  ];

  expect(
    counts([
      ...pair(),
      ...pair(),
      inbound('chat', 'B', ['hello']),
      delivery('chat', ['A', 'B', 'C']),
      ...pair(),
    ]),
  ).toEqual([
    ['inbound', 2],
    ['delivery', 2],
    ['inbound', 1],
    ['delivery', 1],
    ['inbound', 1],
    ['delivery', 1],
  ]);
});

it('a recipient change starts a new inbound and delivery pair', () => {
  expect(
    counts([
      inbound('stroke'),
      delivery('stroke', ['B', 'C'], ['A'], 'A'),
      inbound('stroke'),
      delivery('stroke', ['B'], ['A'], 'A'),
    ]),
  ).toEqual([
    ['inbound', 1],
    ['delivery', 1],
    ['inbound', 1],
    ['delivery', 1],
  ]);
});

it('a run of strokes to the same sockets becomes one line', () => {
  const strokes = Array.from({ length: 47 }, () => delivery('stroke', ['B', 'C'], ['A'], 'A'));

  const folded = fold(strokes);
  expect(folded).toHaveLength(1);
  expect(folded[0].count).toBe(47);
});

it('a page-side run of received strokes folds by recipient', () => {
  const folded = fold([
    received('stroke', 'B', [{ id: 1 }]),
    received('stroke', 'B', [{ id: 2 }]),
    received('stroke', 'C', [{ id: 3 }]),
  ]);

  expect(folded.map((entry) => [entry.line.kind, entry.count])).toEqual([
    ['received', 2],
    ['received', 1],
  ]);
  expect((folded[0].line as ReceivedLine).args).toEqual([{ id: 2 }]);
});

it('the game keeps its own lines, however many arrive in a row', () => {
  const chats = [delivery('chat', ['A', 'B', 'C']), delivery('chat', ['A', 'B', 'C'])];

  expect(fold(chats)).toHaveLength(2);
});

it('a run breaks when the delivery stops reaching the same sockets', () => {
  const folded = fold([
    delivery('stroke', ['B', 'C'], ['A'], 'A'),
    delivery('stroke', ['B', 'C'], ['A'], 'A'),
    // C has gone; a fold that hid this would hide the thing the panel is for.
    delivery('stroke', ['B'], ['A'], 'A'),
  ]);

  expect(folded.map((f) => f.count)).toEqual([2, 1]);
});

it('a run breaks when something else is delivered in the middle', () => {
  expect(
    counts([
      delivery('stroke', ['B', 'C'], ['A'], 'A'),
      delivery('chat', ['A', 'B', 'C']),
      delivery('stroke', ['B', 'C'], ['A'], 'A'),
    ]),
  ).toEqual([
    ['delivery', 1],
    ['delivery', 1],
    ['delivery', 1],
  ]);
});

it('non-stroke lines never fold into one another', () => {
  expect(
    counts([
      { kind: 'membership', op: 'add', socket: 'A', room: 'room-1' },
      { kind: 'membership', op: 'add', socket: 'B', room: 'room-1' },
      { kind: 'ack', to: 'B', value: true },
    ]),
  ).toEqual([
    ['membership', 1],
    ['membership', 1],
    ['ack', 1],
  ]);
});

it('a folded run reports the payload most recently sent', () => {
  const first = { ...delivery('stroke', ['B'], ['A'], 'A'), args: [{ id: 1 }] };
  const last = { ...delivery('stroke', ['B'], ['A'], 'A'), args: [{ id: 9 }] };

  const [folded] = fold([first, last]);
  expect((folded.line as DeliveryLine).args).toEqual([{ id: 9 }]);
});
