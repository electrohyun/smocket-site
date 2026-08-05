import { footer } from '@/content/landing';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer id={footer.id} data-section={footer.id} className="section">
      <div className={`inner ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.wordmark}>smocket</span>
          <span className={styles.tagline}>{footer.tagline}</span>
        </div>

        <nav className={styles.links}>
          {footer.links.map((link) =>
            link.href ? (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ) : (
              // npm 링크는 실배포 전 (지시서 §3-8)
              <span key={link.label} className="todo">
                {link.todo}
              </span>
            )
          )}
        </nav>

        <p className={styles.builtBy}>{footer.builtBy}</p>
      </div>
    </footer>
  );
}
