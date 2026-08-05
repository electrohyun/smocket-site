import { pain } from '@/content/landing';
import styles from './Pain.module.css';

export default function Pain() {
  return (
    <section
      id={pain.id}
      data-section={pain.id}
      aria-labelledby="pain-title"
      className="section"
    >
      <div className="inner">
        <h2 id="pain-title" className="h2">
          {pain.title}
        </h2>

        <div className={styles.cols}>
          {/* Before: 손으로 짠 mock */}
          <figure className={styles.col}>
            <figcaption className={styles.label}>{pain.before.label}</figcaption>
            {pain.before.code ? (
              <pre className="code">
                <code>{pain.before.code}</code>
              </pre>
            ) : (
              <div className={`dashed ${styles.emptyCode}`}>
                <span className="todo">{pain.before.todo}</span>
              </div>
            )}
          </figure>

          {/* After: smocket */}
          <figure className={styles.col}>
            <figcaption className={styles.label}>{pain.after.label}</figcaption>
            <pre className="code">
              <code>{pain.after.code}</code>
            </pre>
          </figure>
        </div>

        <p className={styles.caption}>{pain.caption}</p>
      </div>
    </section>
  );
}
