'use client';

import { useEffect, useState } from 'react';
import styles from './ReadingProgress.module.css';

// 읽기 진행도 = 스크롤 위치. 로켓이 🍫(발사대)에서 🍪(목표)까지 튜브를 타고 오른다.
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
      <span className={styles.goal} aria-hidden="true">
        🍪
        {done && <span className={styles.spark}>✨</span>}
      </span>

      <div className={styles.tubeWrap}>
        <div className={styles.tube}>
          <div className={styles.fill} style={{ height: `${pct}%` }} />
        </div>
        <div
          className={styles.rocket}
          style={{ bottom: `calc(${p} * (100% - 26px))` }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 투명 로켓 */}
          <img src="/rocket.webp" alt="" width={26} height={26} />
        </div>
      </div>

      <span className={styles.pad} aria-hidden="true">
        🍫
      </span>
    </div>
  );
}
