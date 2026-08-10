import { features } from '@/content/landing';
import styles from './Features.module.css';

export default function Features() {
  return (
    <section
      id={features.id}
      data-section={features.id}
      aria-labelledby="features-title"
      className="section"
    >
      <div className="inner">
        <h2 id="features-title" className="h2">
          {features.title}
        </h2>
        <ul className={styles.grid}>
          {features.cards.map((card) => (
            <li key={card.title} className={styles.card}>
              <h3 className={styles.title}>{card.title}</h3>
              <p className={styles.body}>{card.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
