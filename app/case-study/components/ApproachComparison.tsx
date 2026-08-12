import { caseStudyCopy } from '../../../content/case-study';
import type { CaseStudyModel } from '../lib/model';
import styles from '../page.module.css';

export default function ApproachComparison({ model }: { model: CaseStudyModel }) {
  return (
    <section className="section" aria-labelledby="approaches-title">
      <div className="inner">
        <h2 id="approaches-title" className="h2">
          {caseStudyCopy.approaches.title}
        </h2>
        <p className="lead">{caseStudyCopy.approaches.lead}</p>

        <div className={styles.targetGrid}>
          {model.targets.map((target, index) => (
            <article key={target.id} className={styles.targetCard}>
              <div className={styles.cardHead}>
                <span className={styles.targetNumber}>0{index + 1}</span>
                <h3>{target.label}</h3>
              </div>
              <dl className={styles.facts}>
                <div>
                  <dt>Exact dependency</dt>
                  <dd>{target.dependencyLabel}</dd>
                </div>
                <div>
                  <dt>Bootstrap</dt>
                  <dd>{target.bootstrapLines} physical source lines</dd>
                </div>
                <div>
                  <dt>Additional mock</dt>
                  <dd>
                    {target.mockLines
                      ? `${target.mockLines} physical source lines`
                      : 'No application-owned mock'}
                  </dd>
                </div>
                <div>
                  <dt>Recorded result</dt>
                  <dd>
                    {target.assertions === 'passed' ? 'Assertions passed' : target.assertions};{' '}
                    {target.repeatedRunMatches ? 'repeat matches' : 'repeat differs'}
                  </dd>
                </div>
              </dl>
              <p className={styles.cardBody}>{caseStudyCopy.approaches.ownership[target.id]}</p>
            </article>
          ))}
        </div>
        <p className={styles.measurementNote}>
          Measurement: {model.record.measurements.lineCount}. Generated lockfiles are not an
          authored-code comparison.
        </p>
      </div>
    </section>
  );
}
