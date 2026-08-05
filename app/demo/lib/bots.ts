/* B and C, reacting.
 *
 * The drawer's viewpoint shows only the drawer's screen (기획 §2-2), so the other
 * two players exist as chat and as names in the delivery record. The system knows
 * the word, so a script holds whatever the user draws: the guesses are wrong until
 * the script says they are not, and nothing here looks at the drawing.
 *
 * No randomness. A demo that reads differently on every visit cannot be filmed,
 * and a fixed script is also a fixed recording (기획 §6).
 */

import { WORD, type Label } from './room';

export interface Beat {
  /** Fires once this many strokes have been drawn. */
  afterStrokes?: number;
  /** Fires once this many milliseconds have passed. */
  afterMs?: number;
  from: Label;
  /** Chat is a wrong answer said out loud; a guess goes through the ack path. */
  say?: string;
  guess?: string;
}

export const SCRIPT: readonly Beat[] = [
  { afterStrokes: 3, from: 'B', say: '기차?' },
  { afterMs: 4000, from: 'C', say: '사슴!' },
  { afterStrokes: 12, from: 'C', say: '목이 기네' },
  { afterStrokes: 20, from: 'B', guess: WORD },
];

export interface BotActions {
  chat(from: Label, text: string): void;
  guess(from: Label, text: string): void;
}

/**
 * Runs the script against a round. Both triggers are checked on every advance, so
 * a beat fires on whichever of its conditions is met first and never twice.
 */
export class Bots {
  private readonly fired = new Set<Beat>();
  private strokes = 0;
  private readonly startedAt: number;

  constructor(
    private readonly actions: BotActions,
    private readonly script: readonly Beat[] = SCRIPT,
    now: number = Date.now(),
  ) {
    this.startedAt = now;
  }

  /** Call when a stroke ends, and on a tick, so time-based beats fire while idle. */
  advance(strokes: number, now: number = Date.now()): void {
    this.strokes = strokes;
    const elapsed = now - this.startedAt;

    for (const beat of this.script) {
      if (this.fired.has(beat)) continue;
      const byStrokes = beat.afterStrokes !== undefined && this.strokes >= beat.afterStrokes;
      const byTime = beat.afterMs !== undefined && elapsed >= beat.afterMs;
      if (!byStrokes && !byTime) continue;

      this.fired.add(beat);
      if (beat.say !== undefined) this.actions.chat(beat.from, beat.say);
      if (beat.guess !== undefined) this.actions.guess(beat.from, beat.guess);
    }
  }

  get done(): boolean {
    return this.fired.size === this.script.length;
  }
}
