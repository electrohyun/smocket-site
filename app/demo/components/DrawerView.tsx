'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bots } from '../lib/bots';
import { createRound, DRAWER, type Label, type Round } from '../lib/room';
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
 * B and C do reach this screen, but only as what A actually receives: their
 * guesses arrive as `chat` and the win as `announce`, the same way the word
 * arrives as `word`. The feed and the end banner read those deliveries and
 * nothing else — A cannot show what it was not sent, which is the whole claim.
 *
 * The round is created in an effect rather than at module scope, both because
 * `new Server(url)` would then run during the prerender and because the round has
 * to be able to end. Setup and teardown are symmetric, which is what makes the
 * double mount that StrictMode does in development harmless: the first round is
 * disposed before the second exists. */

interface Message {
  from: Label;
  text: string;
}

interface Ended {
  winner: Label;
  word: string;
}

export default function DrawerView() {
  const [round, setRound] = useState<Round | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ended, setEnded] = useState<Ended | null>(null);
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

      // Guesses said out loud reach A as chat, so the feed is A's own inbox, not a
      // window onto B and C. A correct guess never rides `chat` — it goes through
      // the ack — so the feed learns the round was won from `announce` instead.
      next.on(DRAWER, 'chat', ((message: Message) =>
        setMessages((prev) => [...prev, message])) as (...args: never[]) => void);

      next.on(DRAWER, 'announce', ((result: Ended) => setEnded(result)) as (
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
  // drawing would otherwise stop the clock the stroke count runs on. It stops
  // once the round is won: a decided round has nothing left to advance.
  useEffect(() => {
    if (!round || ended) return;
    const timer = window.setInterval(() => botsRef.current?.advance(strokesRef.current), 500);
    return () => window.clearInterval(timer);
  }, [round, ended]);

  // The feed scrolls to its newest line, the way the record does.
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = feedRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, ended]);

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
          <Canvas onSegment={onSegment} onStrokeEnd={onStrokeEnd} disabled={ended !== null} />
          {ended && (
            <div className={styles.result} role="status">
              <span className={styles.resultName} data-socket={ended.winner}>
                {ended.winner}
              </span>
              님이 정답을 맞혔어요 —{' '}
              <span className={styles.resultWord} data-socket="A">
                {ended.word}
              </span>
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <div className={styles.feed} ref={feedRef} aria-label="채팅">
            {messages.map((message, index) => (
              <p key={index} className={styles.message}>
                <span className={styles.messageName} data-socket={message.from}>
                  {message.from}
                </span>
                {message.text}
              </p>
            ))}
          </div>
        )}

        <p className={styles.hint}>
          {ended
            ? '라운드가 끝났습니다. 왼쪽 그림은 획마다, 오른쪽 기록은 배달마다 남았습니다.'
            : '그려 보세요. 오른쪽 기록이 이 획이 누구에게 갔는지 보여줍니다.'}
        </p>
      </section>

      {round && <TracePanel store={round.trace} />}
    </div>
  );
}
