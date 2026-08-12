import type { CaseStudyModel } from '../lib/model';
import styles from '../page.module.css';

export default function AuthoredSurface({ model }: { model: CaseStudyModel }) {
  return (
    <section id="surface" className={styles.reportSection} aria-labelledby="surface-title">
      <div className={styles.sectionHeading}>
        <p>02</p>
        <div>
          <h2 id="surface-title">Authored support surface</h2>
          <p>Exact target-owned JavaScript measured for this recorded workflow.</p>
        </div>
      </div>
      <figure className={styles.surfaceFigure}>
        <div className={styles.surfaceChart}>
          {model.authoredSurfaces.map((surface) => (
            <div className={styles.surfaceRow} key={surface.id}>
              <div className={styles.surfaceLabel}>
                <strong>{surface.label}</strong>
                <span>{surface.segments.map((segment) => segment.lines).join(' + ')} lines</span>
              </div>
              <div className={styles.barTrack} aria-label={`${surface.label}: ${surface.segments.map((segment) => `${segment.lines} ${segment.role} lines`).join(' and ')}`}>
                <div className={styles.barTotal} style={{ width: `${(surface.total / model.maxAuthoredLines) * 100}%` }}>
                  {surface.segments.map((segment) => (
                    <span key={segment.role} className={segment.role === 'bootstrap' ? styles.bootstrapSegment : styles.mockSegment} style={{ width: `${(segment.lines / surface.total) * 100}%` }} title={`${segment.role}: ${segment.lines} lines`}>
                      <b>{segment.lines}</b><em>{segment.role === 'bootstrap' ? 'bootstrap' : 'owned mock'}</em>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <figcaption>
          Physical source lines, including blank and comment lines. This is an observed authored
          surface, not a productivity score; generated lockfiles are excluded and the counts do
          not generalize beyond this workflow.
        </figcaption>
      </figure>
      <div className={styles.tableWrap}>
        <table className={`${styles.dataTable} ${styles.comparisonTable}`}>
          <caption>Target-owned setup, code, failure paths, and change locations</caption>
          <thead><tr><th>Question</th>{model.targets.map((target) => <th key={target.id}>{target.label}</th>)}</tr></thead>
          <tbody>
            {model.comparisonRows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {model.targets.map((target) => <td key={target.id}>{row.values[target.id]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.inferenceNote}><strong>Inference</strong> Because the handwritten fixture owns the observed 212-line implementation, changes to exercised room or event semantics may require changes there. Future maintenance effort was not measured.</p>
    </section>
  );
}
