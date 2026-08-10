'use client';

/* Day / night / device.
 *
 * The device setting is the default and is the absence of a choice: no
 * `data-theme` on the root, so globals.css's media query decides and a reader
 * with no JavaScript still gets the theme their system asked for. Picking a side
 * writes the attribute, which outranks the media query; picking the device again
 * removes it rather than freezing today's system value into storage.
 *
 * The stored choice is applied by an inline script in the document head
 * (`layout.tsx`), before first paint. This component only renders the control
 * and keeps it in step — if it were the thing applying the theme, the page would
 * paint in the system theme and then correct itself, which is the flash the
 * script exists to prevent.
 */

import { useSyncExternalStore } from 'react';
import styles from './ThemeToggle.module.css';

export type Choice = 'light' | 'dark' | 'device';

/** Read by the inline script in layout.tsx too; the two must not drift. */
export const THEME_KEY = 'smocket-theme';

const CHANGED = 'smocket-theme-change';

function apply(choice: Choice): void {
  const root = document.documentElement;
  if (choice === 'device') delete root.dataset.theme;
  else root.dataset.theme = choice;

  // Private browsing and storage-blocking extensions both throw here, and a
  // theme that cannot be remembered is still a theme that works for this visit.
  try {
    if (choice === 'device') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* not remembered, still applied */
  }

  // `storage` only fires in the *other* tabs, so this tab needs its own nudge.
  window.dispatchEvent(new Event(CHANGED));
}

/* The choice lives in localStorage, which is state outside React, so it is read
   as one rather than copied into a hook on mount. Subscribing to `storage` as
   well as our own event means two open tabs agree without either polling. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readChoice(): Choice {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'device';
  } catch {
    return 'device';
  }
}

/* What the server renders. The server cannot see storage, so it renders the
   default; the *theme* is already correct by hydration either way, because the
   head script set the attribute before any of this ran. */
const readServerChoice = (): Choice => 'device';

const OPTIONS: ReadonlyArray<{ value: Choice; label: string; icon: React.ReactNode }> = [
  {
    value: 'light',
    label: 'Day',
    icon: (
      <>
        <circle cx="8" cy="8" r="3.1" />
        <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.05 3.05l1.13 1.13M11.82 11.82l1.13 1.13M12.95 3.05l-1.13 1.13M4.18 11.82l-1.13 1.13" />
      </>
    ),
  },
  {
    value: 'dark',
    label: 'Night',
    icon: <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />,
  },
  {
    value: 'device',
    label: 'Device',
    icon: (
      <>
        <rect x="1.6" y="2.8" width="12.8" height="8.4" rx="1.2" />
        <path d="M5.6 13.6h4.8" />
      </>
    ),
  },
];

export default function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, readChoice, readServerChoice);

  return (
    <div className={styles.wrap} role="group" aria-label="Colour theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.button}
          aria-pressed={choice === option.value}
          title={option.label}
          onClick={() => apply(option.value)}
        >
          <svg
            className={styles.icon}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {option.icon}
          </svg>
          <span className="srOnly">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
