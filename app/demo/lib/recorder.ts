/* The recorder. A development tool, so it can be plain.
 *
 * It watches the one thing replay cannot reconstruct: the drawer's strokes. The
 * word, the bot chat, the answer check, the announce all happen again on replay
 * because the server logic runs live and the bot script is deterministic, so the
 * recording holds strokes and nothing else (기획 3단계 §1).
 *
 * It records where the stroke is emitted, not where the pointer moved — the same
 * seam the bots count on — so what it captures is exactly what a replay re-emits.
 */

import type { RecordedEvent, RecordedSession } from './record';
import type { StrokePayload } from './stroke';

export class Recorder {
  private readonly events: RecordedEvent[] = [];

  /** `t0` is round start, so every `at` is measured from the same zero replay uses. */
  constructor(
    private readonly word: string,
    private readonly t0: number,
  ) {}

  stroke(segment: StrokePayload, now: number = Date.now()): void {
    this.events.push({ at: now - this.t0, event: 'stroke', args: [segment] });
  }

  get count(): number {
    return this.events.length;
  }

  /**
   * The session so far. `duration` runs a little past the last event so a replay
   * holds on the finished picture instead of cutting the instant the last stroke
   * lands.
   */
  session(now: number = Date.now(), tail = 800): RecordedSession {
    const last = this.events.length ? this.events[this.events.length - 1].at : 0;
    return {
      version: 1,
      word: this.word,
      duration: Math.max(now - this.t0, last) + tail,
      events: this.events,
    };
  }
}
