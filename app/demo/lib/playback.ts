/* The replay scheduler.
 *
 * It re-emits the recorded strokes through the same channel a live drawer uses, so
 * the game server runs again, the bots react again, and the delivery record fills
 * from the real routing rather than from anything stored. Replay is the same code
 * path as live; the trace is the proof of that, not a separate rendering (기획 3단계 §1).
 *
 * A single loop with a cursor, not a `setTimeout` per event: one clock, so a
 * later speed control (stage 5) is one multiplier and pause is one offset, with
 * nothing to tear down and re-arm. When several events fall inside one frame they
 * all go out — the record is the evidence, and skipping one would be a hole in it.
 *
 * Note the drawer's own canvas stays blank through a replay: `socket.to(room)`
 * excludes the sender, so A never receives the strokes it is emitting, and there
 * is no pointer to paint them locally either. The picture appears on the observer's
 * canvas (stage 4), which paints from the strokes it *receives*. Here, the trace is
 * what to watch — not the canvas.
 */

import type { RecordedSession } from './record';
import type { StrokePayload } from './stroke';

export interface Playback {
  /** Stop the loop. Idempotent; call it from the round's teardown. */
  stop(): void;
}

interface Options {
  onEnd?: () => void;
  /** 1 is real time. Stage 5 varies it; the loop already supports it. */
  speed?: number;
  now?: () => number;
  schedule?: (cb: () => void) => number;
  cancel?: (handle: number) => void;
}

export function play(
  session: RecordedSession,
  emit: (segment: StrokePayload) => void,
  options: Options = {},
): Playback {
  const speed = options.speed ?? 1;
  const now = options.now ?? (() => Date.now());
  const schedule = options.schedule ?? requestAnimationFrame;
  const cancel = options.cancel ?? cancelAnimationFrame;

  const t0 = now();
  let cursor = 0;
  let handle = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    const elapsed = (now() - t0) * speed;

    while (cursor < session.events.length && session.events[cursor].at <= elapsed) {
      const [segment] = session.events[cursor].args as [StrokePayload];
      emit(segment);
      cursor += 1;
    }

    if (cursor < session.events.length || elapsed < session.duration) {
      handle = schedule(tick);
    } else {
      options.onEnd?.();
    }
  };

  handle = schedule(tick);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      cancel(handle);
    },
  };
}
