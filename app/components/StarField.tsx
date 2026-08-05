import styles from './StarField.module.css';

// 레퍼런스처럼 히어로 배경 전체에 크게 퍼진 성좌 네트워크 (아주 옅게).
// 오른쪽/위가 조금 더 촘촘(로켓 뒤). 좌표계 1200x680, 결정값.
const NODES: [number, number][] = [
  [120, 120], [260, 60], [420, 140], [300, 240], [150, 340], [80, 520],
  [260, 470], [430, 360], [640, 90], [760, 200], [900, 120], [1040, 220],
  [980, 360], [1120, 420], [820, 360], [700, 300], [560, 220], [880, 520],
  [1050, 540], [680, 470],
];
const LINKS: [number, number, number, number][] = [
  [120, 120, 260, 60], [260, 60, 420, 140], [420, 140, 300, 240], [300, 240, 150, 340],
  [150, 340, 80, 520], [80, 520, 260, 470], [260, 470, 430, 360], [430, 360, 300, 240],
  [640, 90, 760, 200], [760, 200, 900, 120], [900, 120, 1040, 220], [1040, 220, 980, 360],
  [980, 360, 1120, 420], [820, 360, 980, 360], [700, 300, 820, 360], [560, 220, 700, 300],
  [640, 90, 560, 220], [880, 520, 1050, 540], [820, 360, 880, 520], [680, 470, 820, 360],
];
const SPARKS: [number, number, number][] = [
  [500, 110, 11], [1000, 120, 13], [600, 420, 9], [180, 240, 8], [1120, 300, 10],
];

const spark = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy - s} Q ${cx} ${cy} ${cx + s} ${cy} Q ${cx} ${cy} ${cx} ${cy + s} Q ${cx} ${cy} ${cx - s} ${cy} Q ${cx} ${cy} ${cx} ${cy - s} Z`;

export default function StarField() {
  return (
    <svg
      className={styles.field}
      viewBox="0 0 1200 680"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {LINKS.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.link} />
      ))}
      {NODES.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i % 4 === 0 ? 3.4 : 2.2}
          className={`${styles.node} ${i % 3 === 0 ? styles.twinkle : ''}`}
          style={{ animationDelay: `${(i % 6) * 0.7}s` }}
        />
      ))}
      {SPARKS.map(([cx, cy, s], i) => (
        <path
          key={i}
          d={spark(cx, cy, s)}
          className={`${styles.spark} ${styles.twinkle}`}
          style={{ animationDelay: `${i * 0.9}s` }}
        />
      ))}
    </svg>
  );
}
