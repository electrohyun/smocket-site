import { MultiTabIcon } from '@/app/components/icons';
import styles from '@/app/demo/components/ModeSelector.module.css';

export default function PreviewTargetBadge() {
  return (
    <div className={styles.compact} aria-label="Current preview target">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {MultiTabIcon}
      </svg>
      <span>MOCK · SHARED WORKER</span>
    </div>
  );
}
