import { caseStudyCopy } from '../../../content/case-study';
import styles from '../page.module.css';

export default function EvidenceBoundaries() {
  return (
    <section id="boundaries" className={styles.reportSection} aria-labelledby="boundaries-title">
      <div className={styles.sectionHeading}>
        <p>06</p>
        <div><h2 id="boundaries-title">Interpretation &amp; evidence boundaries</h2><p>Three questions require three different limits on what this record can support.</p></div>
      </div>
      <div className={styles.lensList}>
        {caseStudyCopy.evidence.lenses.map((lens) => <article key={lens.title}><h3>{lens.title}</h3><p>{lens.body}</p></article>)}
      </div>
      <div className={styles.findingsGrid}>
        <div>
          <h3>Neutral and unfavorable findings</h3>
          <ul>{caseStudyCopy.ownership.neutralFindings.map((item) => <li key={item}>{item}</li>)}</ul>
          <p className={styles.inferenceNote}><strong>Inference</strong>{caseStudyCopy.ownership.inference.replace('Inference, not a measured future result: ', '')}</p>
        </div>
        <aside className={styles.limitations}>
          <p className={styles.overline}>Limitations</p>
          <h3>{caseStudyCopy.limitations.title}</h3>
          <ul>{caseStudyCopy.limitations.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </aside>
      </div>
    </section>
  );
}
