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

import type { DeliveryLine, InboundLine, ReceivedLine, TraceLine } from './trace';

/** Only the flood folds. Everything else is the game, and the game stays open. */
const FOLDABLE = new Set(['stroke']);

export interface FoldedLine {
  line: TraceLine;
  /** How many consecutive lines this one stands for. 1 when nothing folded. */
  count: number;
}

export function fold(lines: readonly TraceLine[]): FoldedLine[] {
  const out: FoldedLine[] = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    const delivery = lines[index + 1];

    // A real stroke is observed twice: once as client -> server inbound traffic,
    // then as the server broadcast to the other room members. Fold consecutive
    // matching pairs together so the panel keeps both halves of the route without
    // letting them alternate rapidly enough to bury the rest of the game.
    if (isInboundStroke(line) && isDeliveryStroke(delivery)) {
      let latestInbound = line;
      let latestDelivery = delivery;
      let count = 1;
      index += 2;

      while (index + 1 < lines.length) {
        const nextInbound = lines[index];
        const nextDelivery = lines[index + 1];
        if (
          !isInboundStroke(nextInbound) ||
          !isDeliveryStroke(nextDelivery) ||
          !sameInbound(latestInbound, nextInbound) ||
          !sameSockets(latestDelivery, nextDelivery)
        ) {
          break;
        }

        latestInbound = nextInbound;
        latestDelivery = nextDelivery;
        count += 1;
        index += 2;
      }

      out.push(
        { line: latestInbound, count },
        { line: latestDelivery, count },
      );
      continue;
    }

    const previous = out.at(-1);
    if (previous && foldsInto(previous.line, line)) {
      previous.count += 1;
      // Keep the newest, so a folded run reads with the payload most recently sent.
      previous.line = line;
    } else {
      out.push({ line, count: 1 });
    }
    index += 1;
  }

  return out;
}

function foldsInto(previous: TraceLine, next: TraceLine): boolean {
  if (isInboundStroke(previous) && isInboundStroke(next)) {
    return sameInbound(previous, next);
  }
  if (isDeliveryStroke(previous) && isDeliveryStroke(next)) {
    return sameSockets(previous, next);
  }
  if (isReceivedStroke(previous) && isReceivedStroke(next)) {
    return previous.to === next.to;
  }
  return false;
}

function isInboundStroke(line: TraceLine | undefined): line is InboundLine {
  return line?.kind === 'inbound' && FOLDABLE.has(line.event);
}

function isDeliveryStroke(line: TraceLine | undefined): line is DeliveryLine {
  return line?.kind === 'delivery' && FOLDABLE.has(line.event);
}

function isReceivedStroke(line: TraceLine | undefined): line is ReceivedLine {
  return line?.kind === 'received' && FOLDABLE.has(line.event);
}

function sameInbound(a: InboundLine, b: InboundLine): boolean {
  return a.from === b.from && a.event === b.event;
}

function sameSockets(a: DeliveryLine, b: DeliveryLine): boolean {
  return (
    a.from === b.from &&
    a.reached.join() === b.reached.join() &&
    a.excluded.join() === b.excluded.join()
  );
}
