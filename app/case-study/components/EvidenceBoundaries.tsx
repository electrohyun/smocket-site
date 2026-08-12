import { caseStudyCopy } from '../../../content/case-study';
import styles from '../page.module.css';

export default function EvidenceBoundaries() {
  return (
    <>
      <section className="section" aria-labelledby="evidence-title">
        <div className="inner">
          <h2 id="evidence-title" className="h2">
            {caseStudyCopy.evidence.title}
          </h2>
          <div className={styles.lensGrid}>
            {caseStudyCopy.evidence.lenses.map((lens) => (
              <article key={lens.title} className={styles.lensCard}>
                <h3>{lens.title}</h3>
                <p>{lens.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="ownership-title">
        <div className={`inner ${styles.ownershipGrid}`}>
          <div>
            <h2 id="ownership-title" className="h2">
              {caseStudyCopy.ownership.title}
            </h2>
            <ul className={styles.findings}>
              {caseStudyCopy.ownership.neutralFindings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
            <p className={styles.inference}>
              <strong>Inference</strong>
              {caseStudyCopy.ownership.inference.replace('Inference, not a measured future result: ', '')}
            </p>
          </div>

          <aside className={styles.limitations} aria-labelledby="limitations-title">
            <p className={styles.kicker}>Limitations</p>
            <h2 id="limitations-title">{caseStudyCopy.limitations.title}</h2>
            <ul>
              {caseStudyCopy.limitations.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
