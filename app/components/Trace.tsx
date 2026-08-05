import { trace } from '@/content/landing';
import styles from './Trace.module.css';

export default function Trace() {
  return (
    <section
      id={trace.id}
      data-section={trace.id}
      aria-labelledby="trace-title"
      className="section"
    >
      <div className="inner">
        <h2 id="trace-title" className="h2">
          {trace.title}
        </h2>
        <p className="lead">{trace.desc}</p>

        <ul className={styles.legend}>
          {trace.sockets.map((s) => (
            <li key={s.label} className={styles.socket}>
              {s.label} <span className={styles.sid}>{s.sid}</span>
            </li>
          ))}
        </ul>

        <div className={styles.record}>
          {trace.blocks.map((b) => (
            <div key={b.call} className={styles.block}>
              <div className={styles.call}>{b.call}</div>
              <div className={styles.reach}>{b.reach}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
