import { pain } from '@/content/landing';
import SocketCode from './SocketCode';
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
          <figure className={styles.col}>
            <figcaption className={styles.heading}>
              <span className={styles.headingCopy}>
                <span className={styles.label}>{pain.before.label}</span>
                <span className={`${styles.status} ${styles.limited}`}>
                  <span aria-hidden="true">×</span>
                  {pain.before.status}
                </span>
              </span>
              <SocketChips labels={['A']} />
            </figcaption>
            {pain.before.code ? (
              <pre className="code">
                <code>
                  <SocketCode code={pain.before.code} />
                </code>
              </pre>
            ) : (
              <div className={`dashed ${styles.emptyCode}`}>
                <span className="todo">{pain.before.todo}</span>
              </div>
            )}
          </figure>

          <figure className={styles.col}>
            <figcaption className={styles.heading}>
              <span className={styles.headingCopy}>
                <span className={styles.label}>{pain.after.label}</span>
                <span className={`${styles.status} ${styles.ready}`}>
                  <span aria-hidden="true">✓</span>
                  {pain.after.status}
                </span>
              </span>
              <SocketChips labels={['A', 'B', 'C']} />
            </figcaption>
            <pre className="code">
              <code>
                <SocketCode code={pain.after.code} />
              </code>
            </pre>
          </figure>
        </div>

        <p className={styles.caption}>{pain.caption}</p>
      </div>
    </section>
  );
}

function SocketChips({ labels }: { labels: string[] }) {
  return (
    <span className={styles.chips} aria-label={`Sockets ${labels.join(', ')}`}>
      {labels.map((label) => (
        <span key={label} className={styles.chip} data-socket={label}>
          {label}
        </span>
      ))}
    </span>
  );
}
