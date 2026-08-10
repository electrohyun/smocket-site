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

/* The situation panel (기획 v2 §5). Controls that act on the round, kept off the
 * two views themselves so a view stays about the game and this stays about the
 * knobs. The word toggle and the delay slider are the observer's alone — the
 * drawer has no word to hide and no B on screen to slow — so they are not shown
 * there rather than greyed, because a dead control only asks "why won't this
 * work" (기획 5단계 §2).
 *
 * They are discs now rather than the small text pills they were. On a page whose
 * subject is what is happening on it, the things that change what happens were
 * the least visible marks on screen. `IconButton` is the landing's replay button,
 * the same component, so a control looks like a control on both pages.
 *
 * The eye only ever means the word. The viewpoint button shows where it goes, and
 * where it goes from the observer is the pen — so an eye and a viewpoint eye are
 * never on screen together. */

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
          <IconButton
            icon={revealed ? EyeIcon : EyeOffIcon}
            label="word"
            title={revealed ? 'hide the word' : 'reveal the word'}
            pressed={revealed}
            onClick={() => onReveal(!revealed)}
          />

          {/* The one control that is not a button, and stays one: what it is for
              is watching order hold as the delay grows, and a stepped button
              would only ever show the steps someone chose in advance. Sized to
              the discs so the labels sit on one line. */}
          <div className={styles.control}>
            <div className={`${styles.pill}${delayMs > 0 ? ` ${styles.on}` : ''}`}>
              <svg
                className={styles.pillIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
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
            <span className={styles.label}>delay B</span>
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
