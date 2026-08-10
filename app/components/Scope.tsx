import { scope } from '@/content/landing';
import styles from './Scope.module.css';

export default function Scope() {
  return (
    <section
      id={scope.id}
      data-section={scope.id}
      aria-labelledby="scope-title"
      className="section"
    >
      <div className="inner">
        <h2 id="scope-title" className="srOnly">
          Scope
        </h2>
        <div className={styles.cols}>
          <div className={styles.col}>
            <h3 className={styles.colTitle}>{scope.doTitle}</h3>
            <ul className={styles.list}>
              {scope.does.map((item) => (
                <li key={item} className={styles.item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h3 className={styles.colTitle}>{scope.cannotTitle}</h3>
            <ul className={styles.list}>
              {scope.cannot.map((item) => (
                <li key={item} className={`${styles.item} ${styles.cannot}`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
