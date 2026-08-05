import { demo } from '@/content/landing';
import styles from './Demo.module.css';

export default function Demo() {
  return (
    <section id={demo.id} data-section={demo.id} className="section">
      <div className="inner">
        <h2 className="h2">{demo.title}</h2>
        <p className="lead">{demo.desc}</p>

        {/* 16:9 점선 박스. 3분할 비율만 표시 (지시서 §3-5) — 실제 데모는 별도 작업 */}
        <div className={styles.frame}>
          <div className={styles.layout}>
            <div className={`dashed ${styles.main}`}>drawer</div>
            <div className={styles.side}>
              <div className={`dashed ${styles.watcher}`}>watcher</div>
              <div className={`dashed ${styles.watcher}`}>watcher</div>
              <div className={`dashed ${styles.panel}`}>trace panel</div>
            </div>
          </div>
          <span className={`todo ${styles.tag}`}>{demo.placeholder}</span>
        </div>
      </div>
    </section>
  );
}
