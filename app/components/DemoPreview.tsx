'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { demo } from '@/content/landing';
import IconButton from './IconButton';
import { RepeatIcon } from './icons';
import Canvas, { type CanvasHandle } from '../demo/components/Canvas';
import TracePanel from '../demo/components/TracePanel';
import { Bots } from '../demo/lib/bots';
import type { Label } from '../demo/lib/game';
import { play, type Playback } from '../demo/lib/playback';
import type { RecordedSession } from '../demo/lib/record';
import type { Round } from '../demo/lib/room';
import type { StrokePayload } from '../demo/lib/stroke';
import styles from './DemoPreview.module.css';

/* The landing's window into /demo: a real round, playing itself.
 *
 * This is the observer's viewpoint with nobody sitting in it. A round is built,
 * the recording is emitted into it as A's strokes, and everything on screen is
 * something B was *delivered* — the picture from `stroke`, the guesses from
 * `chat`, the win from the `correct` addressed to B alone. The record beside it
 * is the adapter's own account of those deliveries, not a caption written about
 * them. That is the whole reason this runs a round rather than replaying a
 * drawing: a record of routing that never happened would be the one dishonest
 * thing on a page arguing fidelity.
 *
 * What is recorded is the drawing, and only the drawing. The routing is live
 * every time — the socket ids differ on every visit and on every replay, which
 * is the plainest evidence that nothing here is a tape of a screen.
 *
 * smocket therefore does reach the landing, which 기획 §8's bundle split had kept
 * it from. It reaches it in a chunk that loads when the frame nears the viewport
 * and not before: the landing's initial payload carries neither the library nor
 * the 24KB recording, and a reader who never scrolls this far pays nothing.
 */

/* Real time. The recording is 17.8 seconds and it used to be played at double
   speed, on the reasoning that a frame someone is scrolling past cannot ask for
   eighteen seconds. It cannot — but a replay button can give them back, and
   between a strange tempo nobody asked for and a round anyone can restart, the
   round wins. It is also the last speed claim the caption has to keep true. */
const MAX_LINES = 4;

/** The seat the frame watches from. A is drawing; C is the other guesser. */
const VIEW: Label = 'B';

const NO_SEGMENTS = () => {};

interface Line {
  key: number;
  from: Label;
  text: string;
  /** The guess that ended the round, which is the only one that gets a mark. */
  won: boolean;
}

export default function DemoPreview() {
  const [lines, setLines] = useState<Line[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  /* 0 until the frame is first seen, then the number of the round on screen.
     Replaying is incrementing it: the effect below tears the old round down and
     builds a new one, and `Canvas` is keyed on it so each round gets a surface
     with nothing on it — the component keeps every stroke it has ever drawn, to
     repaint through a resize, and a second round on the same one would begin
     with the first round's giraffe already finished. */
  const [runs, setRuns] = useState(0);

  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const roundRef = useRef<Round | null>(null);
  const botsRef = useRef<Bots | null>(null);
  const playbackRef = useRef<Playback | null>(null);
  const strokesRef = useRef(0);
  const keyRef = useRef(0);
  /** Milliseconds into the round, which is what the script's beats are timed on. */
  const clockRef = useRef<() => number>(() => 0);

  const say = useCallback((from: Label, text: string, won = false) => {
    keyRef.current += 1;
    const line = { key: keyRef.current, from, text, won };
    setLines((prev) => [...prev, line].slice(-MAX_LINES));
  }, []);

  /* A recorded segment into the round as A's, and its finished strokes to the
     script. Nothing here paints: the picture arrives through B's `stroke`
     handler, because `socket.to(room)` put it there.
   *
   * This is the only thing that advances the script. The demo also runs a timer,
   * because a live round can sit with nothing drawn and still needs a voice in
   * it; a recording always draws all 27 strokes, so the timer would only add a
   * way for the two to come apart. And they do come apart: `play` runs on
   * requestAnimationFrame, which a background tab stops, while an interval keeps
   * going — that is a guess about a drawing arriving before the drawing does. */
  const commit = useCallback((segment: StrokePayload) => {
    roundRef.current?.stroke(segment);
    if (segment.end) {
      strokesRef.current += 1;
      botsRef.current?.advance(strokesRef.current, clockRef.current());
    }
  }, []);

  /* Started on approach, and after that only by the button. Restarting it on
     every scroll-by would make the answer something the reader has to catch
     rather than something they can look back at — and something they can ask
     for again. */
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setRuns((previous) => (previous === 0 ? 1 : previous));
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    observer.observe(shell);

    return () => observer.disconnect();
  }, []);

  // One round per value of `runs`. The cleanup is what makes replaying safe: the
  // previous round is disposed before the next is built, so two rounds never
  // share the canvas, the script, or the record.
  useEffect(() => {
    if (runs === 0) return;

    let live = true;
    let started: Round | null = null;

    const start = async () => {
      // Cleared here rather than on the click, so the frame resets at the same
      // moment for a first round and a fifth.
      strokesRef.current = 0;
      setLines([]);
      setRound(null);

      // The weight of this component — the library and the recording — asked for
      // at the last useful moment and in parallel. Only the first round pays for
      // it; a replay finds both already imported.
      const [{ createRound }, seedModule] = await Promise.all([
        import('../demo/lib/room'),
        import('../demo/lib/seed.json'),
      ]);
      if (!live) return;
      const seed = seedModule.default as RecordedSession;

      const next = await createRound();
      if (!live) {
        next.dispose();
        return;
      }
      started = next;
      roundRef.current = next;

      next.on(VIEW, 'stroke', ((segment: StrokePayload) =>
        canvasRef.current?.draw(segment)) as (...args: never[]) => void);
      next.on(VIEW, 'chat', ((message: { from: Label; text: string }) =>
        say(message.from, message.text)) as (...args: never[]) => void);
      // Addressed to the winner alone. B receiving it and C never is a targeted
      // emit made visible, and the word comes out of that payload rather than off
      // the round — what the frame shows is what only B was told.
      next.on(VIEW, 'correct', ((result: { word: string }) =>
        say(VIEW, result.word, true)) as (...args: never[]) => void);
      // The room is told the round is over, which is what arms the reaction to it.
      next.on(VIEW, 'announce', (() =>
        botsRef.current?.markWon(clockRef.current())) as (...args: never[]) => void);

      // Nobody is playing, so the bots speak for both guessers. Their guess goes
      // through the round's ack path, exactly as a person's would.
      botsRef.current = new Bots(
        {
          chat: (from, text) => next.chat(from, text),
          guess: (from, text) => void next.guess(from, text),
        },
        // `now: 0` so the script's one time-based beat is read as milliseconds
        // into this round rather than against the epoch.
        { now: 0 },
      );

      setRound(next);
      // Delivered to A alone; B never sees it, and the record shows it masked.
      // This fills the record before a single stroke goes out.
      next.word();

      // Motion is the point of this frame, so when it is unwelcome the frame
      // becomes what it was standing in for: the finished picture and the record
      // that produced it, both arrived at through the same deliveries.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        clockRef.current = () => seed.duration;
        for (const event of seed.events) commit(event.args[0] as StrokePayload);
        return;
      }

      const startedAt = Date.now();
      clockRef.current = () => Date.now() - startedAt;
      playbackRef.current = play(seed, commit);
    };

    void start();

    return () => {
      live = false;
      playbackRef.current?.stop();
      playbackRef.current = null;
      started?.dispose();
      roundRef.current = null;
      botsRef.current = null;
    };
  }, [runs, commit, say]);

  return (
    /* The shell exists to be the container the frame is measured against: a
       container query styles a container's descendants and never the container
       itself, so the frame cannot ask its own width what shape to be. */
    <div ref={shellRef} className={styles.shell}>
      <div className={styles.frame}>
        <div className={styles.picture} role="img" aria-label={demo.preview.alt}>
          <Canvas key={runs} ref={canvasRef} onSegment={NO_SEGMENTS} disabled />
        </div>

        {/* Nothing to play again until something has played.
         *
         * The glyph carries it alone, so the name lives in `aria-label` — an icon
         * button without one is announced as "button" and nothing else.
         *
         * The repeat loop: two lines squared off into a ring, each ending in an
         * arrowhead. Drawn rather than typed, so it takes the button's colour and
         * keeps its weight — the emoji renders in its own colours on every
         * platform, and this one sits on a night ground. */}
        {runs > 0 && (
          <IconButton
            className={styles.replay}
            icon={RepeatIcon}
            title={demo.preview.replay}
            onClick={() => setRuns((previous) => previous + 1)}
          />
        )}

        {/* The record owns its side of the frame outright. It shared a column
            with the guesses, taking whatever height they left — so every line
            that arrived took a line off the record, which is the one thing on
            screen a reader may be in the middle of reading. The guesses moved to
            the other side instead, and nothing now changes this box's size.

            The word stays masked. The round reveals it to the room at the end,
            but the line that matters here is the one emit that never left A. */}
        {round && <TracePanel store={round.trace} maskWord />}

        {/* The picture's empty left band: the drawing starts at 0.295 of the
            width, so this is the same free strip the record has on the right. */}
        <div className={styles.feed}>
          {lines.map((line) => (
            <p key={line.key} className={styles.line} data-socket={line.from} data-won={line.won}>
              <span className={styles.who}>{line.from}</span>
              {line.text}
              {line.won && <span className={styles.mark}>✓</span>}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
