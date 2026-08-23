'use client';

import { MultiTabIcon, SingleTabIcon } from '@/app/components/icons';
import { useRouter } from 'next/navigation';
import styles from './ModeSelector.module.css';

export type DemoMode = 'single' | 'multi';

const MODES = [
  {
    id: 'single' as const,
    label: 'Single tab',
    description: 'Play with scripted players in one page.',
    href: '/demo/single',
    icon: SingleTabIcon,
  },
  {
    id: 'multi' as const,
    label: 'Multi tab',
    description: 'Open real tabs that share one in-browser Smocket server.',
    href: '/demo/multi',
    icon: MultiTabIcon,
  },
];

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
              aria-label={`${mode.label}. ${mode.description}`}
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
            </button>
          );
        })}
      </div>
      <p className={styles.description} aria-live="polite">{selected.description}</p>
    </nav>
  );
}
