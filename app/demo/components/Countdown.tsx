'use client';

import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

/* 3, 2, 1, start (기획 v2 §3). It runs once the round is already set up — the
 * clients connected, joined, the word delivered — so the record is full of the
 * initialisation before the count begins: the countdown is the game's start, not
 * the demo's. When it reaches zero it hands over, and the caller begins the round
 * proper (the drawing, or the replay). */

export default function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (n === 0) {
      const timer = window.setTimeout(onDone, 600);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setN((value) => value - 1), 800);
    return () => window.clearTimeout(timer);
  }, [n, onDone]);

  return (
    <div className={styles.overlay} role="status" aria-label="countdown">
      <span key={n} className={styles.num}>
        {n === 0 ? 'start' : n}
      </span>
    </div>
  );
}
