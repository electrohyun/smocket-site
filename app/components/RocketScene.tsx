import { hero } from '@/content/landing';
import styles from './RocketScene.module.css';

const { visual } = hero;

const TRAIL: [number, number, number, string, number][] = [
  [36, 66, 11, 'var(--tw)', 0], [31, 74, 7, 'var(--tc)', 0.4], [41, 77, 6, 'var(--tg)', 0.9],
  [27, 82, 8, 'var(--tw)', 1.3], [37, 86, 5, 'var(--accent)', 0.7], [22, 90, 6, 'var(--tc)', 1.8],
  [45, 92, 5, 'var(--tg)', 2.2], [31, 96, 4, 'var(--accent)', 1.5], [17, 99, 5, 'var(--tw)', 1.1],
];

export default function RocketScene() {
  return (
    <figure className={styles.figure}>
      <div className={styles.scene}>
        <div className={styles.stage}>
          <div className={styles.aura} />

          <div className={styles.trail}>
            {TRAIL.map(([left, top, size, color, delay], i) => (
              <span
                key={i}
                className={styles.crumb}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: size,
                  height: size,
                  background: color,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>

          <div className={styles.orbit}>
            <span className={styles.orbitStar} />
          </div>

          <div className={styles.floatZ}>
            <div className={styles.floatY}>
              <div className={styles.floatX}>
                <img className={styles.rocket} src={visual.rocket.src} alt={visual.rocket.alt} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <figcaption className={styles.caption}>{visual.caption}</figcaption>
    </figure>
  );
}
