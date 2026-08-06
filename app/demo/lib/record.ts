/* The recording envelope.
 *
 * Stage 3 records a round and replays it as the observer's engine (기획 §6). The
 * type is settled here, with stage 2, because the wire payloads have to be shaped
 * so that recording them event by event is possible at all — the format is not
 * allowed to be frames or pixels.
 *
 * The envelope, not the payload, carries the clock. That keeps `StrokePayload`
 * honest to what a real app sends (see `stroke.ts`) and makes this able to hold a
 * `chat` or a `word` without a stroke-shaped field in sight.
 */

export interface RecordedEvent {
  /**
   * Milliseconds since the round began — round start, which is `setRound` and the
   * first `word` delivery, not a countdown (there is none yet; that is stage 5).
   * The replay scheduler reads this.
   */
  at: number;
  event: string;
  /** The emit's arguments, untouched, so replay re-sends what was sent. */
  args: unknown[];
}

export interface RecordedSession {
  /**
   * Bumped when the shape changes, so an old seed is refused outright rather than
   * replayed into something subtly wrong. Nothing reads it yet; it is here for the
   * first time the format moves.
   */
  version: 1;
  /**
   * The word that round was drawn from. Replay starts a real round from it, and the
   * bots' answer is checked against it, so a seed and its script cannot drift.
   */
  word: string;
  /** Total length in ms, last event plus a tail, so replay ends where the round did. */
  duration: number;
  /** In `at` order. Only `stroke` for now; the envelope could carry more. */
  events: RecordedEvent[];
}
