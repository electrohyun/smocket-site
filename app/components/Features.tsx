import { features } from '@/content/landing';
import styles from './Features.module.css';

export default function Features() {
  return (
    <section id={features.id} data-section={features.id} className="section">
      <div className="inner">
        {/* 카드 4개, 2×2. 아이콘 없음 (지시서 §3-4) */}
        <div className={styles.grid}>
          {features.cards.map((card) => (
            <div key={card.title} className={styles.card}>
              <h3 className={styles.title}>{card.title}</h3>
              <p className={styles.body}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
