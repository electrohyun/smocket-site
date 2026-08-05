import { pain } from '@/content/landing';
import styles from './Pain.module.css';

export default function Pain() {
  return (
    <section id={pain.id} data-section={pain.id} className="section">
      <div className="inner">
        <h2 className="h2">{pain.title}</h2>

        <div className={styles.cols}>
          {/* Before: 손으로 짠 mock */}
          <div className={styles.col}>
            <div className={styles.label}>{pain.before.label}</div>
            {pain.before.code ? (
              <pre className="code">{pain.before.code}</pre>
            ) : (
              <div className={`dashed ${styles.emptyCode}`}>
                <span className="todo">{pain.before.todo}</span>
              </div>
            )}
          </div>

          {/* After: smocket */}
          <div className={styles.col}>
            <div className={styles.label}>{pain.after.label}</div>
            <pre className="code">{pain.after.code}</pre>
          </div>
        </div>

        <p className={styles.caption}>{pain.caption}</p>
      </div>
    </section>
  );
}
