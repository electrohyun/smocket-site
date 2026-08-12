import { footer } from '../../content/landing';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer id={footer.id} data-section={footer.id} className="section">
      <div className={`inner ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.wordmark}>smocket</span>
          <span className={styles.tagline}>{footer.tagline}</span>
        </div>

        <nav className={styles.links} aria-label="Footer">
          {footer.links.map((link) =>
            link.href ? (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ) : (
              <span key={link.label} className="todo">
                {link.todo}
              </span>
            )
          )}
        </nav>

        <address className={styles.builtBy}>{footer.builtBy}</address>
      </div>
    </footer>
  );
}
