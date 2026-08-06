import type { Label } from '../lib/room';
import styles from './Character.module.css';

/* A player at a desk. The figure wears its socket's colour — the same colour that
   socket has in the delivery record — so a glance ties the two together (기획 §9).
   The app area stays otherwise neutral (demo.css): no brand colour here.

   The bubble is what this player was heard to say. A win outlines the figure in
   its own colour: when the `correct` that reached the winner alone lights up one
   desk and not the other, that is a targeted emit made visible (기획 4단계 §5). */

interface Props {
  label: Label;
  role: string;
  bubble: string | null;
  highlight?: boolean;
}

export default function Character({ label, role, bubble, highlight = false }: Props) {
  return (
    <div
      className={`${styles.character}${highlight ? ` ${styles.win}` : ''}`}
      data-socket={label}
    >
      {bubble && <div className={styles.bubble}>{bubble}</div>}
      <svg className={styles.figure} viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="19" r="11" />
        <rect x="15" y="33" width="34" height="26" rx="11" />
      </svg>
      <div className={styles.desk} />
      <p className={styles.name}>
        <span className={styles.dot} />
        {label} · {role}
      </p>
    </div>
  );
}
