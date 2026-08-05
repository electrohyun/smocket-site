'use client';

import { hero } from '@/content/landing';
import RocketScene from './RocketScene';
import StarField from './StarField';
import DriftWords from './DriftWords';
import styles from './Hero.module.css';

// H1에서 h1Accent 부분만 오렌지로 강조.
function Headline() {
  const [lead] = hero.h1.split(hero.h1Accent);
  return (
    <h1 id="hero-title" className={styles.h1}>
      {lead}
      <span className={styles.accent}>{hero.h1Accent}</span>
    </h1>
  );
}

export default function Hero() {
  // 마우스 감지 범위 = 히어로 섹션 전체. 여기서 정한 틸트/패럴랙스 값을
  // CSS 변수로 섹션에 실으면, 로켓(stage)과 성좌가 상속받아 반응한다.
  function onMove(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${px * 15}deg`);
    el.style.setProperty('--rx', `${-py * 15}deg`);
    el.style.setProperty('--mx', `${px * 26}px`);
    el.style.setProperty('--my', `${py * 26}px`);
  }
  function onLeave(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--mx', '0px');
    el.style.setProperty('--my', '0px');
  }

  return (
    <section
      id={hero.id}
      data-section={hero.id}
      aria-labelledby="hero-title"
      className={`section ${styles.hero}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <StarField />
      <DriftWords />

      <div className={`inner ${styles.grid}`}>
        <div className={styles.copy}>
          <header className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 고양이 로고 */}
            <img
              className={styles.mascot}
              src={hero.mascot.src}
              alt={hero.mascot.alt}
              width={48}
              height={48}
            />
            <span className={styles.wordmark}>{hero.wordmark}</span>
          </header>

          <Headline />
          <p className={styles.sub}>{hero.sub}</p>

          <p className={styles.tagline}>
            <span className={styles.spark} aria-hidden="true">
              ✦
            </span>
            {hero.tagline}
          </p>

          <div className={styles.ctas}>
            {hero.ctas.map((cta) => (
              <a
                key={cta.label}
                href={cta.href}
                className={cta.primary ? styles.primary : styles.secondary}
              >
                {cta.label}
              </a>
            ))}
          </div>

          <ul className={styles.chips}>
            {hero.chips.map((chip) => (
              <li key={chip} className={styles.chip}>
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <RocketScene />
      </div>
    </section>
  );
}
