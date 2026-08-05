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
  /** Milliseconds since the round began. The replay scheduler reads this. */
  at: number;
  event: string;
  /** The emit's arguments, untouched, so replay re-sends what was sent. */
  args: unknown[];
}

export interface Recording {
  /** The word that round was drawn from. */
  word: string;
  events: RecordedEvent[];
}
