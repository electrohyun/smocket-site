'use client';

import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

/* 3, 2, 1, start (기획 v2 §3). It runs once the round is already set up — the
 * clients connected, joined, the word delivered — so the record is full of the
 * initialisation before the count begins: the countdown is the game's start, not
 * the demo's. When it reaches zero it hands over, and the caller begins the round
 * proper (the drawing, or the replay). */

export default function Countdown({
  onDone,
  endsAt,
}: {
  onDone?: () => void;
  endsAt?: number;
}) {
  const [n, setN] = useState(() => endsAt === undefined ? 3 : Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    if (endsAt === undefined) return;
    const update = () => setN(Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  useEffect(() => {
    if (endsAt !== undefined) return;
    if (n === 0) {
      const timer = window.setTimeout(() => onDone?.(), 600);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setN((value) => value - 1), 800);
    return () => window.clearTimeout(timer);
  }, [endsAt, n, onDone]);

  return (
    <div className={styles.overlay} role="timer" aria-live="assertive" aria-label={n === 0 ? 'Round starting' : `Round starts in ${n} ${n === 1 ? 'second' : 'seconds'}`}>
      <span key={n} className={styles.num}>
        {n === 0 ? 'start' : n}
      </span>
    </div>
  );
}
