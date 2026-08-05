'use client';

import { useEffect, useState } from 'react';
import styles from './ReadingProgress.module.css';

const STACK = [
  { at: 0, emoji: '🍪', label: 'graham' },
  { at: 0.34, emoji: '🍫', label: 'chocolate' },
  { at: 0.67, emoji: '🍡', label: 'marshmallow' },
  { at: 1, emoji: '🍪', label: 'graham' },
];

export default function ReadingProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const pct = Math.round(p * 100);
  const done = p > 0.995;

  return (
    <div
      className={styles.wrap}
      data-done={done}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className={styles.gauge}>
        <span className={styles.percent} style={{ bottom: `calc(${p} * (100% - 14px))` }}>
          {pct}%
        </span>

        <div className={styles.tube}>
          <div className={styles.fill} style={{ height: `${pct}%` }} />
        </div>
        <div
          className={styles.rocket}
          style={{ bottom: `calc(${p} * (100% - 24px))` }}
          aria-hidden="true"
        >
          <img src="/rocket.webp" alt="" width={24} height={24} />
        </div>

        {STACK.map((s, i) => {
          const passed = p >= s.at - 0.001;
          return (
            <span
              key={i}
              className={`${styles.mark} ${passed ? styles.passed : ''}`}
              style={{ bottom: `calc(${s.at} * (100% - 16px))` }}
              aria-hidden="true"
            >
              <span className={styles.ring} />
              {s.emoji}
            </span>
          );
        })}

        {done && (
          <span className={styles.spark} aria-hidden="true">
            ✨
          </span>
        )}

        {done && (
          <div className={styles.finale}>
            <span className={styles.toast}>S’more complete!</span>
            <img className={styles.cat} src="/cat.webp" alt="" width={34} height={34} />
          </div>
        )}
      </div>
    </div>
  );
}
