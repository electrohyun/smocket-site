import { trace } from '@/content/landing';
import EventCall from './EventCall';
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
            <li key={s.label} className={styles.socket} data-socket={s.label}>
              {s.label}
            </li>
          ))}
        </ul>

        <div className={styles.record}>
          {trace.blocks.map((b) => (
            <div key={b.call} className={styles.block}>
              <div className={styles.call}>
                <EventCall code={b.call} />
              </div>
              <div className={styles.reach}>
                <span aria-hidden="true">→ </span>
                {b.reached.map((label, index) => (
                  <span key={label}>
                    {index > 0 && ', '}
                    <span className={styles.socket} data-socket={label}>
                      {label}
                    </span>
                  </span>
                ))}
                {b.excluded.length > 0 && (
                  <span className={styles.except}>
                    {'  (except '}
                    {b.excluded.map((label, index) => (
                      <span key={label}>
                        {index > 0 && ', '}
                        <span className={styles.socket} data-socket={label}>
                          {label}
                        </span>
                      </span>
                    ))}
                    {')'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
