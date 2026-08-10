'use client';

import type { ReactNode } from 'react';
import styles from './IconButton.module.css';

/* One control, everywhere there is one: the landing's replay button and every
 * knob on /demo. They were a 48px disc on the landing and 0.76rem text pills on
 * the demo, which made the demo's own controls the least visible thing on a page
 * whose subject is what is happening on it.
 *
 * The disc reads from `--code-bg` / `--border` / `--text-dim`, so it is the same
 * surface as the delivery record in both places without either knowing about the
 * other. A toggle that is on wears the accent, which is the demo's existing rule
 * for an engaged control.
 */

interface Props {
  /** The glyph, as children of a 24×24 `<svg>` stroked in `currentColor`. */
  icon: ReactNode;
  /**
   * Shown under the disc. Leave it off for a disc on its own — the landing's
   * replay button, where there is nothing else on screen to confuse it with.
   */
  label?: string;
  /**
   * The accessible name, and the tooltip. It must *contain* `label` when there is
   * one: a visible word that the announced name leaves out is a control a voice
   * user can see and cannot ask for (WCAG 2.5.3). "reveal word" over "word" is
   * the shape to follow.
   */
  title: string;
  /** Set only for toggles. Leave undefined for a button that just does a thing. */
  pressed?: boolean;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}

export default function IconButton({
  icon,
  label,
  title,
  pressed,
  disabled,
  className,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={className ? `${styles.button} ${className}` : styles.button}
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={title}
      title={title}
      disabled={disabled}
    >
      <span className={styles.disc}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </button>
  );
}
