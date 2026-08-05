import { hero } from '@/content/landing';
import styles from './RocketScene.module.css';

const { visual } = hero;

// 스모어 배기 부스러기: [left%, top%, size, color, delay]
const TRAIL: [number, number, number, string, number][] = [
  [36, 66, 11, 'var(--tw)', 0], [31, 74, 7, 'var(--tc)', 0.4], [41, 77, 6, 'var(--tg)', 0.9],
  [27, 82, 8, 'var(--tw)', 1.3], [37, 86, 5, 'var(--accent)', 0.7], [22, 90, 6, 'var(--tc)', 1.8],
  [45, 92, 5, 'var(--tg)', 2.2], [31, 96, 4, 'var(--accent)', 1.5], [17, 99, 5, 'var(--tw)', 1.1],
];

// 틸트/패럴랙스 값(--rx/--ry/--mx/--my)은 히어로 섹션 전체에서 상속받는다.
export default function RocketScene() {
  return (
    <figure className={styles.figure}>
      <div className={styles.scene}>
        <div className={styles.stage}>
          <div className={styles.aura} />

          {/* 배기 부스러기 */}
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

          {/* 로켓 궤도를 도는 작은 별 */}
          <div className={styles.orbit}>
            <span className={styles.orbitStar} />
          </div>

          {/* 로켓: 축 방향으로 앞뒤·위아래 미끄러지는 비행 드리프트 + 마우스 패럴랙스 + 3D pop */}
          <div className={styles.float}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 투명 로켓 */}
            <img className={styles.rocket} src={visual.rocket.src} alt={visual.rocket.alt} />
          </div>
        </div>
      </div>

      <figcaption className={styles.caption}>{visual.caption}</figcaption>
    </figure>
  );
}
