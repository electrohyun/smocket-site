/* Folding the record for display.
 *
 * A drawing sends strokes about twenty-five times a second, so an unfolded panel
 * is a stroke column with the game buried in it. 기획 §4 collapses a run of the
 * same event into `stroke ×47` and keeps the game's own events — join, word,
 * chat, correct — always open.
 *
 * This is a pure function over the log, called at render. `TraceStore` stays an
 * append-only record of what happened; what a reader is shown is a separate
 * question, and keeping them apart means folding can never lose a line.
 *
 * A run breaks when the reach or the exclusions change, not just when the event
 * name does. Two stroke deliveries that went to different sockets are two
 * different facts, and a fold that hid that would be hiding the one thing the
 * panel exists to show.
 */

import type { DeliveryLine, TraceLine } from './trace';

/** Only the flood folds. Everything else is the game, and the game stays open. */
const FOLDABLE = new Set(['stroke']);

export interface FoldedLine {
  line: TraceLine;
  /** How many consecutive lines this one stands for. 1 when nothing folded. */
  count: number;
}

export function fold(lines: readonly TraceLine[]): FoldedLine[] {
  const out: FoldedLine[] = [];

  for (const line of lines) {
    const previous = out.at(-1);
    if (previous && foldsInto(previous.line, line)) {
      previous.count += 1;
      // Keep the newest, so a folded run reads with the payload most recently sent.
      previous.line = line;
      continue;
    }
    out.push({ line, count: 1 });
  }

  return out;
}

function foldsInto(previous: TraceLine, next: TraceLine): boolean {
  if (previous.kind !== 'delivery' || next.kind !== 'delivery') return false;
  if (previous.event !== next.event || !FOLDABLE.has(next.event)) return false;
  return sameSockets(previous, next);
}

function sameSockets(a: DeliveryLine, b: DeliveryLine): boolean {
  return (
    a.from === b.from &&
    a.reached.join() === b.reached.join() &&
    a.excluded.join() === b.excluded.join()
  );
}
