import styles from './StarField.module.css';

export default function StarField() {
  return (
    <div className={styles.field} aria-hidden="true">
      <div className={styles.stream} />
    </div>
  );
}
