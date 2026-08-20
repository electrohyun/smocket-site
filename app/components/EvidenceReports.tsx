import Link from 'next/link';
import { createEvidenceOverview } from '../evidence/model';
import styles from './EvidenceReports.module.css';

export default function EvidenceReports() {
  const overview = createEvidenceOverview();

  return (
    <section id="evidence" data-section="evidence" aria-labelledby="evidence-title" className="section">
      <div className="inner">
        <p className={styles.kicker}>Measured reports</p>
        <h2 id="evidence-title" className="h2">Read the result, then inspect how it was made.</h2>
        <p className="lead">
          Counts, target versions, environment, and limitations below come from the checked JSON
          record. The detailed page exposes the same data, pinned source, and reproduction commands.
        </p>

        <div className={styles.reports}>
          {overview.reports.map((report, index) => (
            <article key={report.id} className={styles.report}>
              <div className={styles.reportTop}>
                <div>
                  <p className={styles.index}>Report {String(index + 1).padStart(2, '0')} · recorded {report.recordedDate}</p>
                  <h3>{report.title}</h3>
                </div>
                <span className={styles.status}>{report.observationsMatch ? 'Recorded observations matched' : 'Recorded difference'}</span>
              </div>

              <ul className={styles.targets} aria-label="Compared approaches">
                {report.targets.map((target) => (
                  <li key={target.id}>
                    <strong>{target.label}</strong>
                    <span>{target.dependencies.length ? target.dependencies.join(', ') : 'No package dependency'}</span>
                  </li>
                ))}
              </ul>

              <dl className={styles.facts}>
                <div><dt>Schema</dt><dd>v{report.schemaVersion}</dd></div>
                <div><dt>Environment</dt><dd>{report.environment}</dd></div>
                <div><dt>Line definition</dt><dd>{report.lineCountDefinition}</dd></div>
              </dl>

              <p className={styles.boundary}><strong>Claim boundary.</strong> {report.claimBoundary}</p>
              <Link href={report.route} className={styles.open}>Explore source, matrix, transcript, and provenance <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>

        <aside className={styles.unmeasured} aria-labelledby="unmeasured-title">
          <div>
            <p className={styles.unmeasuredLabel}>Not measured yet</p>
            <h3 id="unmeasured-title">Competitor fixtures are waiting for executable records.</h3>
            <p>No rank, percentage, or placeholder result is shown before those fixtures exist.</p>
          </div>
          <ul>
            {overview.unmeasuredTargets.map((target) => <li key={target}>{target}</li>)}
          </ul>
        </aside>
      </div>
    </section>
  );
}
