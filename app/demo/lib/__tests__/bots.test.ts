import { describe, expect, it } from 'vitest';
import { Bots } from '../bots';

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
      expect.arrayContaining(['a deer!', 'long neck though']),
    );
  });

  it("the drawer's bots (B and C) fire B's winning guess", () => {
    const actions = spyActions();
    const bots = new Bots(actions, { controls: ['B', 'C'], now: 0 });
    bots.advance(25, 5000);

    expect(actions.guesses).toEqual([['B', 'giraffe']]);
    expect(actions.chats.map(([, text]) => text)).toContain('a train?');
  });

  it('after-correct beats wait for markWon', () => {
    const actions = spyActions();
    const bots = new Bots(actions, { controls: ['C'], now: 0 });
    bots.advance(25, 5000);
    expect(actions.chats.map(([, text]) => text)).not.toContain('how did they even get that');

    bots.markWon(6000);
    expect(actions.chats.map(([, text]) => text)).toContain('how did they even get that');
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
