'use client';

import IconButton from '@/app/components/IconButton';
import {
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  SoundOffIcon,
  SoundOnIcon,
} from '@/app/components/icons';
import styles from './SituationPanel.module.css';

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
    <aside className={styles.panel} aria-label="Single tab controls">
      {observing && (
        <>
          <IconButton
            icon={revealed ? EyeIcon : EyeOffIcon}
            label="word"
            title={revealed ? 'hide the word' : 'reveal the word'}
            pressed={revealed}
            onClick={() => onReveal(!revealed)}
          />

          <div className={styles.control}>
            <div className={`${styles.pill}${delayMs > 0 ? ` ${styles.on}` : ''}`}>
              <svg className={styles.pillIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ClockIcon}
              </svg>
              <input
                className={styles.range}
                type="range"
                min={0}
                max={2000}
                step={100}
                value={delayMs}
                onChange={(event) => onDelay(Number(event.target.value))}
                aria-label="Delay B's delivery, in milliseconds"
              />
              <span className={styles.value}>{delayMs}ms</span>
            </div>
            <span className={styles.label}>
              <span className={styles.adapter}>DelayingAdapter</span> · B
            </span>
          </div>
        </>
      )}

      <IconButton
        icon={muted ? SoundOffIcon : SoundOnIcon}
        label="sound"
        title={muted ? 'turn the sound on' : 'turn the sound off'}
        pressed={!muted}
        onClick={() => onMute(!muted)}
      />

      <IconButton
        icon={observing ? PencilIcon : EyeIcon}
        label={observing ? 'drawer' : 'observer'}
        title={observing ? 'switch to the drawer' : 'switch to the observer'}
        onClick={onSwitch}
      />
    </aside>
  );
}
