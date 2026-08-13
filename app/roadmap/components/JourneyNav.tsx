'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { deriveJourneyState } from '../lib/journey';
import styles from '../page.module.css';

const stops = [
  { id: 'guarantee', label: 'Guarantee' },
  { id: 'classification', label: 'Classification' },
  { id: 'sequence', label: 'Release path' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'sources', label: 'Sources' },
] as const;

export default function JourneyNav() {
  const [state, setState] = useState({ progress: 0, currentId: stops[0].id as string });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const geometry = Array.from(
        document.querySelectorAll<HTMLElement>('[data-journey-stop]'),
      ).map((element) => ({
        id: element.dataset.journeyStop ?? '',
        top: element.getBoundingClientRect().top + window.scrollY,
      }));

      setState(
        deriveJourneyState(
          window.scrollY,
          window.innerHeight,
          document.documentElement.scrollHeight,
          geometry,
        ),
      );
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const percent = Math.round(state.progress * 100);
  const done = state.progress > 0.995;
  const currentIndex = stops.findIndex((stop) => stop.id === state.currentId);
  const style = { '--journey-progress': state.progress } as CSSProperties;

  return (
    <nav
      className={styles.journeyNav}
      data-done={done}
      aria-label="Roadmap to v1.0.0"
      style={style}
    >
      <div className={styles.journeyNavHeader}>
        <p>ROADMAP</p>
        <span aria-label={`Reading position, ${percent}%`}>{percent}%</span>
      </div>
      <div className={styles.journeyNavTrack} aria-hidden="true">
        <span />
      </div>
      <ol>
        {stops.map((stop, index) => (
          <li key={stop.id}>
            <a
              href={`#${stop.id}`}
              aria-current={state.currentId === stop.id ? 'step' : undefined}
              data-reached={currentIndex >= index}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {stop.label}
            </a>
          </li>
        ))}
      </ol>
      {done && (
        <div className={styles.journeyFinale}>
          <span className={styles.journeySpark} aria-hidden="true">
            ✨
          </span>
          <span className={styles.journeyToast}>Roadmap complete!</span>
          <img className={styles.journeyCat} src="/cat.webp" alt="" width={34} height={34} />
        </div>
      )}
    </nav>
  );
}
