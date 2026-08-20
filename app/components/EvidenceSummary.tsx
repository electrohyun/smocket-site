import Link from 'next/link';
import { createEvidenceOverview } from '../evidence/model';
import styles from './EvidenceSummary.module.css';

export default function EvidenceSummary() {
  const overview = createEvidenceOverview();
  const report = overview.reports[0];

  return (
    <section
      id="evidence-summary"
      data-section="evidence-summary"
      aria-labelledby="evidence-summary-title"
      className="section"
    >
      <div className="inner">
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>Measured so far</p>
            <h2 id="evidence-summary-title" className="h2">
              One workflow, pinned and inspectable.
            </h2>
            <p className="lead">
              The current report runs one shared chat-room application and the same assertions
              against three approaches. It is a dated snapshot, not a compatibility score or a
              speed claim.
            </p>
          </div>
          <Link href={report.route} className={styles.link}>
            Open the measured report <span aria-hidden="true">→</span>
          </Link>
        </div>

        <dl className={styles.metrics}>
          <div>
            <dt>Recorded workflows</dt>
            <dd>{overview.measuredReportCount}</dd>
            <p>{report.title}</p>
          </div>
          <div>
            <dt>Compared approaches</dt>
            <dd>{overview.comparedTargetCount}</dd>
            <p>{report.targets.map((target) => target.label).join(' · ')}</p>
          </div>
          <div>
            <dt>Recorded result</dt>
            <dd className={styles.result}>{report.observationsMatch ? 'Matched' : 'Different'}</dd>
            <p>Within this workflow and its shared assertions</p>
          </div>
        </dl>

        <div className={styles.versionRow} aria-label="Exact recorded target versions">
          {report.targets.map((target) => (
            <span key={target.id}>
              <strong>{target.label}</strong>
              {target.dependencies.length > 0 ? ` · ${target.dependencies.join(', ')}` : ' · no package'}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
