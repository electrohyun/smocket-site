import { quickstart } from '@/content/landing';
import CopyButton from './CopyButton';
import styles from './Quickstart.module.css';

export default function Quickstart() {
  return (
    <section
      id={quickstart.id}
      data-section={quickstart.id}
      aria-labelledby="quickstart-title"
      className="section"
    >
      <div className="inner">
        <h2 id="quickstart-title" className="h2">
          {quickstart.title}
        </h2>

        <ol className={styles.steps}>
          {quickstart.steps.map((step) => (
            <li key={step.n} className={styles.step}>
              <div className={styles.head}>
                <span className={styles.num} aria-hidden="true">
                  {step.n}
                </span>
                <h3 className={styles.title}>{step.title}</h3>
              </div>
              <div className={styles.codeWrap}>
                {!step.isTodo && (
                  <div className={styles.copy}>
                    <CopyButton text={step.code} />
                  </div>
                )}
                {step.isTodo ? (
                  <div className={`dashed ${styles.todoBox}`}>
                    <span className="todo">{step.code}</span>
                  </div>
                ) : (
                  <pre className="code">
                    <code>{step.code}</code>
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
