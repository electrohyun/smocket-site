'use client';

import { useEffect, useState } from 'react';
import styles from './ReadingProgress.module.css';

// 읽기 진행도 = 스크롤. 로켓이 스모어 스택(🍪 그레이엄 · 🍫 초콜릿 · 🍡 마시멜로 · 🍪 그레이엄)을
// 아래에서 위로 통과한다. 재료를 지날 때마다 팝 + 링 파동으로 쾌감을 준다.
const STACK = [
  { at: 0, emoji: '🍪', label: 'graham' }, // 발사대 (바닥)
  { at: 0.34, emoji: '🍫', label: 'chocolate' },
  { at: 0.67, emoji: '🍡', label: 'marshmallow' },
  { at: 1, emoji: '🍪', label: 'graham' }, // 목표 (꼭대기)
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
        {/* 왼쪽: 로켓과 함께 올라가는 % */}
        <span className={styles.percent} style={{ bottom: `calc(${p} * (100% - 14px))` }}>
          {pct}%
        </span>

        {/* 가운데: 연료 튜브 + 로켓 */}
        <div className={styles.tube}>
          <div className={styles.fill} style={{ height: `${pct}%` }} />
        </div>
        <div
          className={styles.rocket}
          style={{ bottom: `calc(${p} * (100% - 24px))` }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 투명 로켓 */}
          <img src="/rocket.webp" alt="" width={24} height={24} />
        </div>

        {/* 오른쪽: 스모어 체크포인트 스택 */}
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
      </div>
    </div>
  );
}
