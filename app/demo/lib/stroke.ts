/* What a stroke looks like on the wire.
 *
 * One event carries a segment, not a whole stroke and not a single point. A
 * whole stroke would put ten events in a drawing and the `stroke ×47` folding
 * rule (기획 §4) would never have anything to fold; a point per event would run
 * at pointer rate, which is more than a recording committed to the repo can
 * carry. Pointer moves are coalesced and sent every `FLUSH_MS`.
 *
 * Coordinates are normalised, because playback happens on the observer's canvas
 * and that canvas is not the drawer's size (기획 §6). Pixels recorded on one
 * would land wrong on the other.
 *
 * There is no timestamp here on purpose. A real socket.io app does not put a
 * wall clock in a stroke, and the demo's claim is that it is sending what a real
 * app sends. The time an event happened is the *recording's* need, so it lives
 * in the recording envelope instead (`record.ts`), which also lets that envelope
 * carry `chat` and `word` without knowing anything about strokes.
 */

/** A point in canvas space, 0..1 on both axes. */
export type Pt = [x: number, y: number];

export interface StrokePayload {
  /**
   * Rises once per pointerdown. This is the only thing telling a receiver that a
   * new stroke began rather than the previous one continuing — a start flag would
   * join two strokes into one the moment its single event went missing, whereas a
   * changed id recovers on the next segment.
   */
  id: number;
  /** The points gathered since the last flush. */
  pts: Pt[];
  /** On the segment that ends the stroke, and only that one. */
  end?: true;
}

/** Pointer moves are gathered this long before going out: ~25 events a second. */
export const FLUSH_MS = 40;

/** Four places is sub-pixel on a 4000px canvas and keeps the recording small. */
const PLACES = 4;

export function normalise(value: number, extent: number): number {
  const clamped = Math.min(1, Math.max(0, extent > 0 ? value / extent : 0));
  return Number(clamped.toFixed(PLACES));
}

export function toPoint(x: number, y: number, rect: { width: number; height: number }): Pt {
  return [normalise(x, rect.width), normalise(y, rect.height)];
}

/** Back to pixels for drawing. The inverse of `toPoint`, on whatever canvas asks. */
export function toPixels(point: Pt, size: { width: number; height: number }): [number, number] {
  return [point[0] * size.width, point[1] * size.height];
}

/**
 * Gathers points and hands them over a segment at a time. It owns no timer and no
 * socket: the caller decides when to flush, which keeps it usable from a pointer
 * handler, from a test, and later from the recorder.
 */
export class SegmentBuffer {
  private id = 0;
  private pts: Pt[] = [];
  private drawing = false;

  begin(point: Pt): void {
    this.id += 1;
    this.drawing = true;
    this.pts = [point];
  }

  push(point: Pt): void {
    if (this.drawing) this.pts.push(point);
  }

  /** The segment so far, or null when there is nothing new to send. */
  take(): StrokePayload | null {
    if (this.pts.length === 0) return null;
    const pts = this.pts;
    this.pts = [];
    return { id: this.id, pts };
  }

  /**
   * The last segment of the stroke. Always returns one, even with no points left
   * over, so the receiver always learns the stroke is closed.
   */
  end(): StrokePayload | null {
    if (!this.drawing) return null;
    this.drawing = false;
    const pts = this.pts;
    this.pts = [];
    return { id: this.id, pts, end: true };
  }

  get active(): boolean {
    return this.drawing;
  }
}
