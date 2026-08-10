import Link from 'next/link';
import { demo } from '@/content/landing';
import DemoPreview from './DemoPreview';
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

        {/* The frame used to be the door — the whole thing was the link, on the
            reasoning that someone who has just watched the round end is already
            pointing at the picture. It cannot be now: it holds a button, a button
            inside an anchor is not valid HTML, and a reader who means to replay
            and lands on /demo instead has been tricked by their own click. The
            frame is the thing to watch and the line under it is the way in. */}
        <div className={styles.entry}>
          <DemoPreview />
          <div className={styles.foot}>
            <span className={styles.note}>{demo.preview.note}</span>
            <Link href={demo.href} className={styles.cta}>
              {demo.cta}
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
