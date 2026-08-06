/* The seed is generated art (`scripts/draw-seed.mjs`) and the demo's whole replay
 * rests on it, so it is checked here rather than trusted. `play` takes its clock
 * and scheduler as options precisely so a round can be run without a browser —
 * which is also the only way to see the drawing arrive in a test.
 */

import { describe, expect, it } from 'vitest';
import { play } from '../playback';
import type { RecordedSession } from '../record';
import type { StrokePayload } from '../stroke';
import seedJson from '../seed.json';

const SEED = seedJson as RecordedSession;

/** Runs the whole session on a fake clock and collects what a round would receive. */
function replay(): StrokePayload[] {
  const got: StrokePayload[] = [];
  let clock = 0;
  const queue: Array<() => void> = [];

  play(SEED, (segment) => got.push(segment), {
    now: () => clock,
    schedule: (cb) => {
      queue.push(cb);
      return queue.length;
    },
    cancel: () => {},
  });

  // One frame per 16ms until the session is spent, the way rAF would drive it.
  while (queue.length && clock <= SEED.duration + 100) {
    const frame = queue.shift()!;
    frame();
    clock += 16;
  }
  return got;
}

describe('the recorded giraffe', () => {
  const emitted = replay();
  const strokes = SEED.events.filter((e) => (e.args[0] as StrokePayload).end);

  it('replays every recorded segment, in order', () => {
    expect(emitted).toHaveLength(SEED.events.length);
    expect(emitted.map((s) => s.id)).toEqual(
      SEED.events.map((e) => (e.args[0] as StrokePayload).id),
    );
  });

  it('closes every stroke it opens', () => {
    // A stroke id that never carries `end` leaves the receiving canvas joining it
    // to whatever is drawn next, so the count of ids and of ends must agree.
    const ids = new Set(emitted.map((s) => s.id));
    expect(strokes).toHaveLength(ids.size);
  });

  it('rises one id per stroke, so a dropped segment cannot merge two', () => {
    const ids = [...new Set(emitted.map((s) => s.id))];
    expect(ids).toEqual(ids.map((_, i) => i + 1));
  });

  it('stays inside the canvas', () => {
    const all = emitted.flatMap((s) => s.pts);
    expect(all.every(([x, y]) => x >= 0 && x <= 1 && y >= 0 && y <= 1)).toBe(true);
  });

  it('is the word the round is played for', () => {
    expect(SEED.word).toBe('giraffe');
  });
});
