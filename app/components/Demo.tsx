import Link from 'next/link';
import { demo } from '@/content/landing';
import styles from './Demo.module.css';

export default function Demo() {
  return (
    <section
      id={demo.id}
      data-section={demo.id}
      aria-labelledby="demo-title"
      className="section"
    >
      <div className="inner">
        <h2 id="demo-title" className="h2">
          {demo.title}
        </h2>
        <p className="lead">{demo.desc}</p>

        <Link href={demo.href} className={styles.entry}>
          <span className={`dashed ${styles.shot}`}>
            <span className="todo">{demo.shotTodo}</span>
          </span>
          <span className={`todo ${styles.label}`}>{demo.linkTodo}</span>
        </Link>
      </div>
    </section>
  );
}
