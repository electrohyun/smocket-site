'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bots } from '../lib/bots';
import { createRound, DRAWER, type Round } from '../lib/room';
import type { StrokePayload } from '../lib/stroke';
import Canvas from './Canvas';
import TracePanel from './TracePanel';
import styles from './DrawerView.module.css';

/* The drawer's viewpoint (기획 §2-2).
 *
 * The user is A. What they draw goes out as a socket event and the panel on the
 * right shows where it landed. B and C have no screen here on purpose: the two
 * viewpoints split the job, and this one owns sending. Proof of arrival is the
 * record, not a second canvas.
 *
 * The round is created in an effect rather than at module scope, both because
 * `new Server(url)` would then run during the prerender and because the round has
 * to be able to end. Setup and teardown are symmetric, which is what makes the
 * double mount that StrictMode does in development harmless: the first round is
 * disposed before the second exists. */

export default function DrawerView() {
  const [round, setRound] = useState<Round | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const botsRef = useRef<Bots | null>(null);
  const strokesRef = useRef(0);

  useEffect(() => {
    let live = true;
    let started: Round | null = null;

    createRound().then((next) => {
      if (!live) {
        next.dispose();
        return;
      }
      started = next;

      // The drawer learns the word by receiving it, the same way the panel learns
      // it was delivered. Nothing reads it out of the round's own state.
      next.on(DRAWER, 'word', ((incoming: string) => setWord(incoming)) as (
        ...args: never[]
      ) => void);

      botsRef.current = new Bots({
        chat: (from, text) => next.chat(from, text),
        guess: (from, text) => void next.guess(from, text),
      });

      setRound(next);
      next.word();
    });

    return () => {
      live = false;
      started?.dispose();
      botsRef.current = null;
    };
  }, []);

  // Beats that fire on elapsed time need a heartbeat, since a user who stops
  // drawing would otherwise stop the clock the stroke count runs on.
  useEffect(() => {
    if (!round) return;
    const timer = window.setInterval(() => botsRef.current?.advance(strokesRef.current), 500);
    return () => window.clearInterval(timer);
  }, [round]);

  const onSegment = useCallback(
    (segment: StrokePayload | null) => {
      if (segment) round?.stroke(segment);
    },
    [round],
  );

  const onStrokeEnd = useCallback((total: number) => {
    strokesRef.current = total;
    botsRef.current?.advance(total);
  }, []);

  return (
    <div className={styles.stage}>
      <section className={styles.board}>
        <p className={styles.word}>
          <span className={styles.wordLabel}>제시어</span>
          <span className={styles.wordValue} data-socket="A">
            {word ?? '…'}
          </span>
        </p>
        <div className={styles.surface}>
          <Canvas onSegment={onSegment} onStrokeEnd={onStrokeEnd} />
        </div>
        <p className={styles.hint}>
          그려 보세요. 오른쪽 기록이 이 획이 누구에게 갔는지 보여줍니다.
        </p>
      </section>

      {round && <TracePanel store={round.trace} />}
    </div>
  );
}
