import { adoption } from '@/content/landing';
import CopyButton from './CopyButton';
import styles from './Adoption.module.css';

export default function Adoption() {
  return (
    <section
      id={adoption.id}
      data-section={adoption.id}
      aria-labelledby="adoption-title"
      className="section"
    >
      <div className="inner">
        <p className={styles.kicker}>{adoption.eyebrow}</p>
        <h2 id="adoption-title" className="h2">
          {adoption.title}
        </h2>
        <p className="lead">{adoption.desc}</p>

        <div className={styles.grid}>
          {[adoption.application, adoption.test].map((sample) => (
            <figure key={sample.label} className={styles.sample}>
              <figcaption>{sample.label}</figcaption>
              <div className={styles.codeWrap}>
                <CopyButton text={sample.code} />
                <pre className="code"><code>{sample.code}</code></pre>
              </div>
            </figure>
          ))}
        </div>
        <p className={styles.boundary}>{adoption.boundary}</p>
      </div>
    </section>
  );
}
