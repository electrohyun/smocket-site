import Link from 'next/link';
import { reportNavigation } from '@/content/landing';
import styles from './ReportNav.module.css';

export default function ReportNav() {
  return (
    <nav className={styles.shell} aria-label="Report sections">
      <div className={styles.inner}>
        <Link href="#hero" className={styles.brand} aria-label="Back to the Smocket introduction">
          <img src="/cat.webp" alt="" width={28} height={28} />
          <span>smocket</span>
        </Link>
        <div className={styles.links}>
          {reportNavigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <Link href="/demo" className={styles.showcase}>
          Try it
        </Link>
      </div>
    </nav>
  );
}
