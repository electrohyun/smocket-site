import { describe, expect, it } from 'vitest';
import { Bots, SCRIPT } from '../bots';
import seedJson from '../seed.json';
import type { RecordedSession } from '../record';
import type { StrokePayload } from '../stroke';

function spyActions() {
  const chats: Array<[string, string]> = [];
  const guesses: Array<[string, string]> = [];
  return {
    chat: (from: string, text: string) => chats.push([from, text]),
    guess: (from: string, text: string) => guesses.push([from, text]),
    chats,
    guesses,
  };
}

describe('Bots controls', () => {
  it("the observer's bots (C only) never speak for B", () => {
    const actions = spyActions();
    const bots = new Bots(actions, { controls: ['C'], now: 0 });
    // Past every stroke and time threshold in the script.
    bots.advance(25, 5000);

    expect(actions.chats.map(([from]) => from)).not.toContain('B');
    expect(actions.guesses).toHaveLength(0); // the winning guess is B's, so the user's
    expect(actions.chats.map(([, text]) => text)).toEqual(
      expect.arrayContaining(['a horse?', 'a deer!', "those aren't antlers"]),
    );
  });

  it("the drawer's bots (B and C) fire B's winning guess", () => {
    const actions = spyActions();
    const bots = new Bots(actions, { controls: ['B', 'C'], now: 0 });
    bots.advance(25, 5000);

    expect(actions.guesses).toEqual([['B', 'giraffe']]);
    expect(actions.chats.map(([, text]) => text)).toContain('long neck for a deer');
  });

  it('after-correct beats wait for markWon', () => {
    const actions = spyActions();
    const bots = new Bots(actions, { controls: ['C'], now: 0 });
    bots.advance(25, 5000);
    expect(actions.chats.map(([, text]) => text)).not.toContain('the spots gave it away');

    bots.markWon(6000);
    expect(actions.chats.map(([, text]) => text)).toContain('the spots gave it away');
  });

  it('a beat fires at most once across advances', () => {
    const actions = spyActions();
    const bots = new Bots(actions, { controls: ['C'], now: 0 });
    bots.advance(25, 5000);
    bots.advance(26, 6000);
    const deer = actions.chats.filter(([, text]) => text === 'a deer!');
    expect(deer).toHaveLength(1);
  });
});

/* The script fires on stroke counts and the replay is what supplies them, so the
   two are one thing that can be broken from either side: redraw the seed shorter
   and the round is never won, because the guess beat is simply never reached. */
describe('the script and the seed agree', () => {
  const seed = seedJson as RecordedSession;
  const strokes = seed.events.filter((e) => (e.args[0] as StrokePayload).end).length;

  it('the seed draws enough strokes to reach every beat', () => {
    const needed = Math.max(
      ...SCRIPT.map((beat) => beat.afterStrokes ?? 0),
    );
    expect(strokes).toBeGreaterThanOrEqual(needed);
  });

  it('the winning guess lands while the drawing is still going', () => {
    const winning = SCRIPT.find((beat) => beat.guess !== undefined);
    expect(winning?.afterStrokes).toBeDefined();
    expect(winning!.afterStrokes!).toBeLessThanOrEqual(strokes);
  });
});
