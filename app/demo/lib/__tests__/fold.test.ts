import { expect, it } from 'vitest';
import { fold } from '../fold';
import type { DeliveryLine, TraceLine } from '../trace';

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

it('a run of strokes to the same sockets becomes one line', () => {
  const strokes = Array.from({ length: 47 }, () => delivery('stroke', ['B', 'C'], ['A'], 'A'));

  const folded = fold(strokes);
  expect(folded).toHaveLength(1);
  expect(folded[0].count).toBe(47);
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

it('lines that are not deliveries never fold into one another', () => {
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
