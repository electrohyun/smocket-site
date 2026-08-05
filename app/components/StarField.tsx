import styles from './StarField.module.css';

// 히어로 배경 성좌. 좌하향으로 끊김 없이 흘러(발사되는 상대운동) 로켓이 위-오른쪽으로
// 날아가는 것처럼 보이게 한다. 타일(public/star-tile.svg)을 repeat + background-position
// 애니메이션으로 seamless 스크롤. 바깥 wrapper는 마우스 역-패럴랙스.
export default function StarField() {
  return (
    <div className={styles.field} aria-hidden="true">
      <div className={styles.stream} />
    </div>
  );
}
