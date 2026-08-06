import { useEffect } from 'react';
import type { Label } from '../lib/room';
import Fireworks from './Fireworks';
import styles from './Fanfare.module.css';

/* The win, said out loud to the one who won it.
 *
 * A correct guess never rides `chat` — that is what keeps it from spoiling the
 * round for everyone else — so the guesser's own words are the one thing that
 * never comes back as a bubble. B's desk lights up, but an outline is a quiet
 * answer to having just solved it, and quieter still when B is the delayed
 * socket and it arrives late behind a bot's reaction.
 *
 * So this is fed by `correct`, the emit addressed to the winner alone: what it
 * shows is what only B received, which is the same claim the outline makes,
 * made loudly. It announces and then leaves — no buttons, nothing to dismiss,
 * `pointer-events: none` — because the round carries on underneath it and a
 * board that had to be closed would be in the way of watching that happen.
 */

/** Long enough to read twice, short enough not to sit on the drawing. */
const SHOWN_MS = 2800;

interface Props {
  word: string;
  /** The winner, whose colour the board and its fireworks are lit in. */
  socket: Label;
  /** Whose win this is, in the voice of the viewpoint reading it. */
  eyebrow: string;
  /** Called once the board has said its piece; the parent unmounts it. */
  onDone: () => void;
}

export default function Fanfare({ word, socket, eyebrow, onDone }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, SHOWN_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    // `status` rather than `alert`: it is good news arriving, not an error, and
    // polite means it waits for a screen reader to finish its sentence.
    // `data-socket` on the wrap, not the board: the fireworks read --socket from
    // here too, so the burst is lit in the same colour as the word inside it.
    <div className={styles.wrap} role="status" aria-live="polite" data-socket={socket}>
      {/* Behind the board, so the words stay the readable thing. */}
      <Fireworks />
      <div className={styles.board}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <p className={styles.word}>{word}</p>
      </div>
    </div>
  );
}
