import { quickstart } from '@/content/landing';
import CopyButton from './CopyButton';
import styles from './Quickstart.module.css';

export default function Quickstart() {
  return (
    <section id={quickstart.id} data-section={quickstart.id} className="section">
      <div className="inner">
        <h2 className="h2">{quickstart.title}</h2>

        <ol className={styles.steps}>
          {quickstart.steps.map((step) => (
            <li key={step.n} className={styles.step}>
              <div className={styles.head}>
                <span className={styles.num}>{step.n}</span>
                <span className={styles.title}>{step.title}</span>
              </div>
              <div className={styles.codeWrap}>
                {/* 복사 버튼: 실제 코드 스텝에만. TODO 자리는 복사할 실물이 없음 */}
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
                  <pre className="code">{step.code}</pre>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
