'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bots } from '../lib/bots';
import { play, type Playback } from '../lib/playback';
import type { RecordedSession } from '../lib/record';
import { createRound, type Label, type Round } from '../lib/room';
import type { StrokePayload } from '../lib/stroke';
import seedJson from '../lib/seed.json';
import Canvas, { type CanvasHandle } from './Canvas';
import Character from './Character';
import Countdown from './Countdown';
import TracePanel from './TracePanel';
import styles from './ObserverView.module.css';

/* The observer's viewpoint (기획 §2-1). The user is B, a guesser; A is not on
 * screen, because A is the one drawing and this is the receiving side. What A
 * draws was recorded, so the replay engine emits it into the round; B receives it
 * the way any room member does and paints it — this is where the strokes that
 * were only arriving in stage 3 first become a picture.
 *
 * B and C reach the screen as characters, and only through what B is actually
 * delivered: strokes to the canvas, chat to the bubbles, `correct` to B's own
 * desk. B is never sent the word, so the observer does not know it — the game's
 * secret, kept by the same routing the record shows masked.
 *
 * Nothing stops when the round is won. The user guesses, the win lands on B, and
 * the replay flows on with the bots still reacting (기획 4단계 §1) — a decided round
 * that keeps playing, not a frozen one. */

const SEED = seedJson as RecordedSession;
const USER: Label = 'B';
const BUBBLE_MS = 3400;
const TIMEOUT_MS = 999_000;
const NO_SEGMENTS = () => {};

interface Ended {
  winner: Label | null;
  word: string;
}

export default function ObserverView({
  revealed = false,
  delayMs = 0,
}: {
  revealed?: boolean;
  delayMs?: number;
}) {
  const [round, setRound] = useState<Round | null>(null);
  const [bubbles, setBubbles] = useState<Partial<Record<Label, string>>>({});
  const [ended, setEnded] = useState<Ended | null>(null);
  const [wonByUser, setWonByUser] = useState(false);
  const [input, setInput] = useState('');
  // False until the 3-2-1 finishes; the replay and the bots wait behind it.
  const [active, setActive] = useState(false);
  const begin = useCallback(() => setActive(true), []);

  const roundRef = useRef<Round | null>(null);
  const botsRef = useRef<Bots | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const playbackRef = useRef<Playback | null>(null);
  const strokesRef = useRef(0);
  const bubbleTimers = useRef<Partial<Record<Label, number>>>({});

  const showBubble = useCallback((from: Label, text: string) => {
    setBubbles((prev) => ({ ...prev, [from]: text }));
    window.clearTimeout(bubbleTimers.current[from]);
    bubbleTimers.current[from] = window.setTimeout(
      () => setBubbles((prev) => ({ ...prev, [from]: undefined })),
      BUBBLE_MS,
    );
  }, []);

  // A's recorded strokes, emitted into the round (which excludes A) so B receives
  // and renders them, and counted so the bots advance as in a live round.
  const commit = useCallback((segment: StrokePayload) => {
    roundRef.current?.stroke(segment);
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

      next.on(USER, 'stroke', ((segment: StrokePayload) =>
        canvasRef.current?.draw(segment)) as (...args: never[]) => void);
      next.on(USER, 'chat', ((message: { from: Label; text: string }) =>
        showBubble(message.from, message.text)) as (...args: never[]) => void);
      // Targeted to the winner alone: B receiving it, and C never, is a targeted
      // emit made visible.
      next.on(USER, 'correct', (() => setWonByUser(true)) as (...args: never[]) => void);
      next.on(USER, 'announce', ((result: Ended) => {
        setEnded(result);
        botsRef.current?.markWon();
      }) as (...args: never[]) => void);

      // The user is B, so the bots play only C; the winning guess is the user's.
      botsRef.current = new Bots(
        {
          chat: (from, text) => next.chat(from, text),
          guess: (from, text) => void next.guess(from, text),
        },
        { controls: ['C'] },
      );

      setRound(next);
      // Delivered to A alone; B does not receive it, and the record shows it masked.
      // This fills the record before the countdown; the replay itself waits for it.
      next.word();
    });

    return () => {
      live = false;
      playbackRef.current?.stop();
      playbackRef.current = null;
      started?.dispose();
      roundRef.current = null;
      botsRef.current = null;
    };
  }, [commit, showBubble]);

  // The replay waits behind the countdown, then re-emits A's strokes into the round
  // through `commit`, exactly as a live drawer would (기획 3단계 §1).
  useEffect(() => {
    if (!active || !round) return;
    playbackRef.current = play(SEED, commit);
    return () => {
      playbackRef.current?.stop();
      playbackRef.current = null;
    };
  }, [active, round, commit]);

  // Time-based bot beats need a heartbeat. It is not gated on the win: the
  // observer plays on past it (기획 4단계 §1).
  useEffect(() => {
    if (!round || !active) return;
    const timer = window.setInterval(() => botsRef.current?.advance(strokesRef.current), 500);
    return () => window.clearInterval(timer);
  }, [round, active]);

  // The only automatic end when the user never guesses: reveal the word to the
  // room through the server, so the record shows it (기획 4단계 §3).
  useEffect(() => {
    if (!round || !active || ended) return;
    const timer = window.setTimeout(() => round.reveal(), TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [round, active, ended]);

  // The slider's delay, applied to what B receives. It is smocket's own per-socket
  // delay (room.setDelay → DelayingAdapter), so the drawing and the chat reach B
  // late while the record shows the delayed schedule — order kept (기획 5단계 §3).
  useEffect(() => {
    roundRef.current?.setDelay('B', delayMs);
  }, [delayMs, round]);

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const text = input.trim();
      if (!text || !roundRef.current) return;
      // Everything typed is a guess: the user cannot judge it (the word is hidden),
      // so the server does, echoing a wrong one back to the room as chat.
      void roundRef.current.guess(USER, text);
      setInput('');
    },
    [input],
  );

  return (
    <div className={styles.stage}>
      <section className={styles.board}>
        <div className={styles.surface}>
          <Canvas ref={canvasRef} onSegment={NO_SEGMENTS} disabled />
          {round && !active && <Countdown onDone={begin} />}
        </div>

        <div className={styles.players}>
          <Character label="B" role="you" bubble={bubbles.B ?? null} highlight={wonByUser} />
          <Character label="C" role="bot" bubble={bubbles.C ?? null} />
        </div>

        <form className={styles.chat} onSubmit={submit}>
          <input
            className={styles.input}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              ended ? `Round over · the word was ${ended.word}` : 'Guess from the drawing'
            }
            disabled={ended !== null}
            aria-label="Guess"
          />
          <button type="submit" className={styles.send} disabled={ended !== null}>
            Send
          </button>
        </form>
      </section>

      {round && <TracePanel store={round.trace} maskWord={!revealed} />}
    </div>
  );
}
