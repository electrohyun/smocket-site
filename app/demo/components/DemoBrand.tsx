import { page } from '@/content/demo';
import Link from 'next/link';
import styles from '../page.module.css';

export default function DemoBrand() {
  return (
    <header className={styles.brand}>
      <Link className={styles.homeLink} href="/" aria-label="Smocket home">
        <img
          className={styles.mascot}
          src={page.mascot.src}
          alt=""
          width={26}
          height={26}
        />
        <span className={styles.wordmark}>{page.wordmark}</span>
      </Link>
    </header>
  );
}
