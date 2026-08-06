'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bots } from '../lib/bots';
import { play, type Playback } from '../lib/playback';
import type { RecordedSession } from '../lib/record';
import { Recorder } from '../lib/recorder';
import { createRound, DRAWER, WORD, type Label, type Round } from '../lib/room';
import type { StrokePayload } from '../lib/stroke';
import seedJson from '../lib/seed.json';
import Canvas from './Canvas';
import TracePanel from './TracePanel';
import styles from './DrawerView.module.css';

/* The drawer's viewpoint (기획 §2-2), live or replayed.
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
 * In replay the strokes come from a recorded session instead of the canvas, but
 * they enter through the same `commit` and so run the same server logic; the
 * bots and the trace cannot tell the difference (기획 3단계 §1). The drawer's own
 * canvas stays blank then — A never receives the strokes it emits (except A),
 * and there is no pointer painting them — so what to watch in a replay is the
 * trace, not the picture. The picture is the observer's canvas, stage 4.
 *
 * The round is created in an effect rather than at module scope, both because
 * `new Server(url)` would then run during the prerender and because the round has
 * to be able to end and be remade. Setup and teardown are symmetric, which is
 * what makes both StrictMode's double mount and a "replay again" harmless: the
 * previous round is disposed, and its scheduler stopped, before the next exists. */

interface Message {
  from: Label;
  text: string;
}

interface Ended {
  winner: Label;
  word: string;
}

const SEED = seedJson as RecordedSession;

export default function DrawerView({ replay = false }: { replay?: boolean }) {
  const [round, setRound] = useState<Round | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ended, setEnded] = useState<Ended | null>(null);
  const [runId, setRunId] = useState(0);
  const [copied, setCopied] = useState(false);

  const roundRef = useRef<Round | null>(null);
  const botsRef = useRef<Bots | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const playbackRef = useRef<Playback | null>(null);
  const strokesRef = useRef(0);

  // The one place a segment turns into a socket event: the live canvas feeds it and
  // the replay scheduler feeds it, so both run the identical send. Counting the
  // stroke and recording it here, off the emit rather than off a pointer, is what
  // lets a replayed round advance the bots and be re-recorded exactly as a live one
  // does. Stable (it reads refs), so the canvas and the scheduler share one funnel.
  const commit = useCallback((segment: StrokePayload | null) => {
    if (!segment) return;
    roundRef.current?.stroke(segment);
    recorderRef.current?.stroke(segment);
    if (segment.end) {
      strokesRef.current += 1;
      botsRef.current?.advance(strokesRef.current);
    }
  }, []);

  useEffect(() => {
    let live = true;
    let started: Round | null = null;

    createRound().then((next) => {
      if (!live) {
        next.dispose();
        return;
      }
      started = next;
      roundRef.current = next;

      // A "replay again" reuses this component, so the previous round's word, feed
      // and end banner are cleared as the new round takes hold rather than lingering.
      strokesRef.current = 0;
      setWord(null);
      setMessages([]);
      setEnded(null);

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

      next.on(DRAWER, 'announce', ((result: Ended) => {
        setEnded(result);
        // The win is a beat too: a bot admires the answer once it lands.
        botsRef.current?.markWon();
      }) as (...args: never[]) => void);

      // The user is A, so the bots play B and C — B's scripted guess wins here.
      botsRef.current = new Bots(
        {
          chat: (from, text) => next.chat(from, text),
          guess: (from, text) => void next.guess(from, text),
        },
        { controls: ['B', 'C'] },
      );

      // Round start is the recorder's t0 and the replay's zero alike, so a session
      // records against the same clock it will later play against.
      recorderRef.current = replay ? null : new Recorder(WORD, Date.now());

      setRound(next);
      next.word();

      if (replay) {
        playbackRef.current = play(SEED, commit);
      }
    });

    return () => {
      live = false;
      playbackRef.current?.stop();
      playbackRef.current = null;
      started?.dispose();
      roundRef.current = null;
      botsRef.current = null;
      recorderRef.current = null;
    };
  }, [replay, runId, commit]);

  // Beats that fire on elapsed time need a heartbeat, since a round where nothing
  // is drawn would otherwise stop the clock the stroke count runs on. It stops once
  // the round is won: a decided round has nothing left to advance.
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

  // Dev only: copy the session drawn so far, to be pasted into seed.json (기획 3단계 §5).
  const copySession = useCallback(() => {
    const session = recorderRef.current?.session();
    if (!session) return;
    const json = JSON.stringify(session);
    navigator.clipboard?.writeText(json).catch(() => {});
    console.log(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <div className={styles.stage}>
      <section className={styles.board}>
        <p className={styles.word}>
          <span className={styles.wordLabel}>word</span>
          <span className={styles.wordValue} data-socket="A">
            {word ?? '…'}
          </span>
        </p>
        <div className={styles.surface}>
          <Canvas onSegment={commit} disabled={replay || ended !== null} />
          {ended && (
            <div className={styles.result} role="status">
              <span className={styles.resultName} data-socket={ended.winner}>
                {ended.winner}
              </span>
              {' guessed it — '}
              <span className={styles.resultWord} data-socket="A">
                {ended.word}
              </span>
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <div className={styles.feed} ref={feedRef} aria-label="chat">
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

        <div className={styles.footer}>
          <p className={styles.hint}>
            {replay
              ? 'Replaying — the strokes come from a recording, everything else happens live again. Watch delivery in the record on the right.'
              : ended
                ? 'Round over. The drawing is stroke by stroke, the record delivery by delivery.'
                : 'Draw. The record on the right shows who each stroke reached.'}
          </p>
          {replay ? (
            <button type="button" className={styles.dev} onClick={() => setRunId((n) => n + 1)}>
              replay again
            </button>
          ) : (
            <button type="button" className={styles.dev} onClick={copySession}>
              {copied ? 'copied' : 'copy session'}
            </button>
          )}
        </div>
      </section>

      {round && <TracePanel store={round.trace} />}
    </div>
  );
}
