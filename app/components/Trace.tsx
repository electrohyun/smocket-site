import { trace } from '@/content/landing';
import styles from './Trace.module.css';

export default function Trace() {
  return (
    <section id={trace.id} data-section={trace.id} className="section">
      <div className="inner">
        <h2 className="h2">{trace.title}</h2>
        <p className="lead">{trace.desc}</p>

        {/* 소켓 표기: 라벨 + sid 앞 4자리(흐린 회색) — 지시서 §3-2 */}
        <div className={styles.legend}>
          {trace.sockets.map((s) => (
            <span key={s.label} className={styles.socket}>
              {s.label} <span className={styles.sid}>{s.sid}</span>
            </span>
          ))}
        </div>

        {/* 완전한 정지 상태. 재생 버튼/애니메이션 없음 (지시서 §3-2) */}
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
