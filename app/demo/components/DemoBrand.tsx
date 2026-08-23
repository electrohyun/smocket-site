import { page } from '@/content/demo';
import styles from '../page.module.css';

export default function DemoBrand() {
  return (
    <header className={styles.brand}>
      <img
        className={styles.mascot}
        src={page.mascot.src}
        alt={page.mascot.alt}
        width={26}
        height={26}
      />
      <span className={styles.wordmark}>{page.wordmark}</span>
    </header>
  );
}
