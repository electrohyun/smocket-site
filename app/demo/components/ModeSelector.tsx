'use client';

import { MultiTabIcon, SingleTabIcon } from '@/app/components/icons';
import { useRouter } from 'next/navigation';
import styles from './ModeSelector.module.css';

export type DemoMode = 'single' | 'multi';

const MODES = [
  {
    id: 'single' as const,
    label: 'Single tab',
    tooltip: 'You with scripted players',
    href: '/demo/single',
    icon: SingleTabIcon,
  },
  {
    id: 'multi' as const,
    label: 'Multi tab',
    tooltip: 'Play across browser tabs',
    href: '/demo/multi',
    icon: MultiTabIcon,
  },
];

function PersonGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7" r="3" />
      <path d="M5.5 20c.4-5 2.5-7.5 6.5-7.5s6.1 2.5 6.5 7.5" />
    </svg>
  );
}

function BotGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6V3M9.5 3h5" />
      <rect x="4" y="6" width="16" height="14" rx="4" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <path d="M9 16h6" />
    </svg>
  );
}

function TabGlyph({ label }: { label: 'A' | 'B' | 'C' }) {
  return (
    <span className={styles.tabGlyph} data-socket={label} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="M3 8h18" />
      </svg>
      <strong>{label}</strong>
    </span>
  );
}

function Plus() {
  return <span className={styles.plus} aria-hidden="true">+</span>;
}

function ModeTooltip({ mode }: { mode: DemoMode }) {
  return (
    <span id={`demo-mode-tip-${mode}`} className={styles.tooltip} role="tooltip">
      <span className={styles.equation} aria-hidden="true">
        {mode === 'single' ? (
          <>
            <span className={styles.actor} data-socket="A"><PersonGlyph /></span>
            <Plus />
            <span className={styles.actor} data-socket="B"><BotGlyph /></span>
            <Plus />
            <span className={styles.actor} data-socket="C"><BotGlyph /></span>
          </>
        ) : (
          <>
            <TabGlyph label="A" />
            <Plus />
            <TabGlyph label="B" />
            <Plus />
            <TabGlyph label="C" />
          </>
        )}
      </span>
      <span className={styles.tooltipText}>{MODES.find((item) => item.id === mode)!.tooltip}</span>
    </span>
  );
}

export default function ModeSelector({ active, compact = false }: { active: DemoMode; compact?: boolean }) {
  const router = useRouter();
  const selected = MODES.find((mode) => mode.id === active)!;

  if (compact) {
    return (
      <div className={styles.compact} aria-label="Current demo mode">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {selected.icon}
        </svg>
        <span>{selected.label}</span>
      </div>
    );
  }

  return (
    <nav className={styles.selector} aria-label="Demo mode">
      <div className={styles.buttons}>
        {MODES.map((mode) => {
          const pressed = mode.id === active;
          return (
            <button
              key={mode.id}
              type="button"
              className={styles.mode}
              aria-pressed={pressed}
              aria-label={mode.label}
              aria-describedby={`demo-mode-tip-${mode.id}`}
              onClick={() => {
                if (!pressed) router.push(mode.href);
              }}
            >
              <span className={styles.disc}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {mode.icon}
                </svg>
              </span>
              <span className={styles.label}>{mode.label}</span>
              <ModeTooltip mode={mode.id} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
