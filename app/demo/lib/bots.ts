/* The reacting players.
 *
 * The system knows the word, so a script holds whatever the user draws: the
 * guesses are wrong until the script says otherwise, and nothing here looks at the
 * drawing. No randomness — a demo that reads differently on every visit cannot be
 * filmed, and a fixed script is also a fixed recording (기획 §6).
 *
 * Which players the bots stand in for depends on the viewpoint. In the drawer's
 * view the user is A, so the bots play B and C, and B's scripted guess is what wins
 * the round. In the observer's view the user is B, so the bots play only C and the
 * user is the one who guesses — a bot must never sit in the user's seat and take
 * the `correct` that is the user's to receive. `controls` draws that line; the
 * winning guess beat simply does not fire when its player is the user.
 */

import { WORD, type Label } from './room';

export interface Beat {
  /** Fires once this many strokes have been drawn. */
  afterStrokes?: number;
  /** Fires once this many milliseconds have passed. */
  afterMs?: number;
  /** Fires once the round has been won — a late reaction to the answer. */
  afterCorrect?: boolean;
  from: Label;
  /** Chat is a wrong answer said out loud; a guess goes through the ack path. */
  say?: string;
  guess?: string;
}

export const SCRIPT: readonly Beat[] = [
  { afterStrokes: 3, from: 'B', say: 'a train?' },
  { afterMs: 4000, from: 'C', say: 'a deer!' },
  { afterStrokes: 12, from: 'C', say: 'long neck though' },
  { afterStrokes: 20, from: 'B', guess: WORD },
  { afterCorrect: true, from: 'C', say: 'how did they even get that' },
];

export interface BotActions {
  chat(from: Label, text: string): void;
  guess(from: Label, text: string): void;
}

export interface BotOptions {
  /** The labels the bots play. A beat whose `from` is not among them never fires. */
  controls?: readonly Label[];
  script?: readonly Beat[];
  now?: number;
}

/**
 * Runs the script against a round. Every trigger is checked on each advance, so a
 * beat fires on whichever of its conditions is met first and never twice, and only
 * for a player the bots actually control.
 */
export class Bots {
  private readonly fired = new Set<Beat>();
  private readonly script: readonly Beat[];
  private readonly controls: readonly Label[] | null;
  private readonly startedAt: number;
  private strokes = 0;
  private won = false;

  constructor(
    private readonly actions: BotActions,
    options: BotOptions = {},
  ) {
    this.script = options.script ?? SCRIPT;
    this.controls = options.controls ?? null;
    this.startedAt = options.now ?? Date.now();
  }

  /** Call when a stroke ends, and on a tick, so time-based beats fire while idle. */
  advance(strokes: number, now: number = Date.now()): void {
    this.strokes = strokes;
    const elapsed = now - this.startedAt;

    for (const beat of this.script) {
      if (this.fired.has(beat)) continue;
      // Not our player to speak for — the user sits here.
      if (this.controls && !this.controls.includes(beat.from)) continue;

      const byStrokes = beat.afterStrokes !== undefined && this.strokes >= beat.afterStrokes;
      const byTime = beat.afterMs !== undefined && elapsed >= beat.afterMs;
      const byCorrect = beat.afterCorrect === true && this.won;
      if (!byStrokes && !byTime && !byCorrect) continue;

      this.fired.add(beat);
      if (beat.say !== undefined) this.actions.chat(beat.from, beat.say);
      if (beat.guess !== undefined) this.actions.guess(beat.from, beat.guess);
    }
  }

  /** The round was won; arm the after-correct reactions. */
  markWon(now: number = Date.now()): void {
    this.won = true;
    this.advance(this.strokes, now);
  }
}
