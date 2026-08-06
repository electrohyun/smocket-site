'use client';

import styles from './SituationPanel.module.css';

/* The situation panel (기획 v2 §5). Controls that act on the round, kept off the
 * two views themselves so a view stays about the game and this stays about the
 * knobs. The word toggle and the delay slider are the observer's alone — the
 * drawer has no word to hide and no B on screen to slow — so they are not shown
 * there rather than greyed, because a dead control only asks "why won't this
 * work" (기획 5단계 §2). */

type Viewpoint = 'drawer' | 'observer';

interface Props {
  viewpoint: Viewpoint;
  onSwitch: () => void;
  revealed: boolean;
  onReveal: (value: boolean) => void;
  delayMs: number;
  onDelay: (ms: number) => void;
  muted: boolean;
  onMute: (value: boolean) => void;
}

export default function SituationPanel({
  viewpoint,
  onSwitch,
  revealed,
  onReveal,
  delayMs,
  onDelay,
  muted,
  onMute,
}: Props) {
  const observing = viewpoint === 'observer';

  return (
    <aside className={styles.panel} aria-label="Controls">
      {observing && (
        <>
          <button
            type="button"
            className={`${styles.button}${revealed ? ` ${styles.active}` : ''}`}
            aria-pressed={revealed}
            onClick={() => onReveal(!revealed)}
          >
            {revealed ? 'hide word' : 'reveal word'}
          </button>

          <label className={styles.slider}>
            <span>delay B · {delayMs}ms</span>
            <input
              type="range"
              min={0}
              max={2000}
              step={100}
              value={delayMs}
              onChange={(event) => onDelay(Number(event.target.value))}
              aria-label="Delay B's delivery"
            />
          </label>
        </>
      )}

      <button
        type="button"
        className={styles.button}
        aria-pressed={!muted}
        onClick={() => onMute(!muted)}
      >
        {muted ? 'sound off' : 'sound on'}
      </button>

      <button type="button" className={styles.button} onClick={onSwitch}>
        {viewpoint === 'drawer' ? 'observer →' : '← drawer'}
      </button>
    </aside>
  );
}
