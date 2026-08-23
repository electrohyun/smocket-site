import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => import('smocket-client'));
import { Bots } from '../bots';
import { play } from '../playback';
import { createRound, WORD, type Label, type Round } from '../room';
import seedJson from '../seed.json';
import type { RecordedSession } from '../record';
import {
  formatCall,
  formatReach,
  type DeliveryLine,
  type InboundLine,
  type TraceLine,
} from '../trace';
import type { StrokePayload } from '../stroke';

/* The landing's preview, without the canvas.
 *
 * `DemoPreview` runs a real round with nobody sitting in it: the recording goes
 * in as A's strokes, the bots speak for both guessers, and everything the frame
 * shows is something B was delivered. So what is pinned here is the empty seat —
 * that the round still reaches its win, that the win reaches B and only B, and
 * that the record the frame displays is the routing's own account of it.
 *
 * The scheduler is driven by hand rather than by requestAnimationFrame — which is
 * also the difference that made the browser check misleading: a hidden tab stops
 * rAF, so the replay stops with it. Nothing else may keep running when it does,
 * which is why the script is advanced by strokes alone.
 */

const SEED = seedJson as RecordedSession;
const VIEW: Label = 'B';

interface Said {
  from: Label;
  text: string;
  won: boolean;
}

let round: Round;

afterEach(() => round?.dispose());

/** Runs the whole recording through the preview's wiring and returns what it saw. */
async function playPreview(): Promise<{
  said: Said[];
  strokes: number;
  received: number;
  lines: readonly TraceLine[];
}> {
  round = await createRound();

  const said: Said[] = [];
  let received = 0;
  let strokes = 0;
  let clock = 0;

  round.on(VIEW, 'stroke', (() => {
    received += 1;
  }) as (...args: never[]) => void);
  round.on(VIEW, 'chat', ((message: { from: Label; text: string }) => {
    said.push({ from: message.from, text: message.text, won: false });
  }) as (...args: never[]) => void);
  round.on(VIEW, 'correct', ((result: { word: string }) => {
    said.push({ from: VIEW, text: result.word, won: true });
  }) as (...args: never[]) => void);
  round.on(VIEW, 'announce', (() => bots.markWon(clock)) as (...args: never[]) => void);

  const bots = new Bots(
    {
      chat: (from, text) => round.chat(from, text),
      guess: (from, text) => void round.guess(from, text),
    },
    { now: 0 },
  );

  round.word();

  const STEP = 16; // a frame's worth of the round, which now runs at real time
  const pending: Array<() => void> = [];

  const playback = play(
    SEED,
    (segment: StrokePayload) => {
      round.stroke(segment);
      if (segment.end) {
        strokes += 1;
        bots.advance(strokes, clock);
      }
    },
    {
      now: () => clock,
      schedule: (cb) => pending.push(cb),
      cancel: () => {},
    },
  );

  // Step the clock until the recording is spent, with a bound so a broken seed
  // fails the test rather than hanging it.
  for (let step = 0; pending.length > 0 && step < 10_000; step += 1) {
    const next = pending.shift()!;
    clock += STEP;
    next();
  }
  playback.stop();
  /* smocket hands each delivery over on a microtask, and a handler that emits
     queues the next one behind it — so the round is a chain, not a batch, and a
     single `await Promise.resolve()` moves it forward by exactly one delivery.
     Yielding to the macrotask queue lets the whole chain run, the ack and the
     announce that follows the winning guess included. */
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { said, strokes, received, lines: round.trace.lines() };
}

describe('the landing preview plays a real round out', () => {
  it('delivers every recorded stroke to the seat the frame watches from', async () => {
    const { strokes, received } = await playPreview();
    const recorded = SEED.events.filter((e) => (e.args[0] as StrokePayload).end).length;

    expect(strokes).toBe(recorded);
    // Nothing is painted locally here: the picture is what arrived.
    expect(received).toBe(SEED.events.length);
  });

  it('lets the bots speak for both guessers, since neither seat is taken', async () => {
    const { said, lines } = await playPreview();
    expect(new Set(said.map((line) => line.from))).toEqual(new Set(['B', 'C']));

    const botTraffic = lines
      .filter(
        (line): line is InboundLine =>
          line.kind === 'inbound' && (line.event === 'chat' || line.event === 'guess'),
      )
      .map((line) => ({ from: line.from, event: line.event, text: line.args[0] }));
    expect(botTraffic).toEqual([
      { from: 'C', event: 'chat', text: 'a horse?' },
      { from: 'C', event: 'chat', text: 'a deer!' },
      { from: 'B', event: 'chat', text: 'long neck for a deer' },
      { from: 'C', event: 'chat', text: "those aren't antlers" },
      { from: 'B', event: 'guess', text: WORD },
      { from: 'C', event: 'chat', text: 'the spots gave it away' },
    ]);
  });

  it('reaches the win, and marks the line the server addressed to B alone', async () => {
    const { said, lines } = await playPreview();

    expect(said.filter((line) => line.won)).toEqual([{ from: 'B', text: WORD, won: true }]);

    const correct = lines.filter(
      (line): line is DeliveryLine => line.kind === 'delivery' && line.event === 'correct',
    );
    expect(correct).toHaveLength(1);
    expect(correct[0].reached).toEqual(['B']);
  });

  /* Nothing arms this but the server's `announce`, so if the round did not
     actually finish through the ack path the reaction would never arrive — and
     the frame would settle on the answer with nobody responding to it. */
  it("ends on C's reaction to the win", async () => {
    const { said } = await playPreview();
    expect(said.at(-1)).toEqual({ from: 'C', text: 'the spots gave it away', won: false });
  });

  it('says every beat once, in the order the drawing earns them', async () => {
    const { said } = await playPreview();
    expect(said.map((line) => line.text)).toEqual([
      'a horse?',
      'a deer!',
      'long neck for a deer',
      "those aren't antlers",
      WORD,
      'the spots gave it away',
    ]);
  });

  /* The record is the reason this runs a round at all, so it is checked to be the
     routing's account and not a caption: the strokes excluded their sender, and
     the word never left A. */
  it('produces a delivery record of the round it just played', async () => {
    const { lines } = await playPreview();
    const deliveries = lines.filter((line): line is DeliveryLine => line.kind === 'delivery');

    const stroke = deliveries.find((line) => line.event === 'stroke')!;
    expect(formatCall(stroke)).toBe("socket_A.to('room-1').emit('stroke', {…})");
    expect(formatReach(stroke)).toBe('→ B, C  (except A)');

    const word = deliveries.find((line) => line.event === 'word')!;
    expect(word.reached).toEqual(['A']);
    // What the frame renders: the secret kept by routing, shown as kept.
    expect(formatCall(word, { maskWord: true })).toBe("io.to(sid_A).emit('word', '****')");

    expect(deliveries.some((line) => line.mismatch)).toBe(false);
  });
});
