import Link from 'next/link';
import { caseStudyLinks } from '../../../content/case-study';
import type { CaseStudyModel } from '../lib/model';
import styles from '../page.module.css';

export default function ReportHeader({ model }: { model: CaseStudyModel }) {
  const { record } = model;

  return (
    <header className={styles.reportHeader} aria-labelledby="case-study-title">
      <div className={styles.reportBrandRow}>
        <Link className={styles.brand} href="/" aria-label="smocket home">
          <img src="/cat.webp" alt="" width={34} height={34} />
          <span>smocket</span>
        </Link>
        <span className={styles.reportStatus}>Recorded study · assertions passed</span>
      </div>
      <p className={styles.reportKicker}>Application evidence report</p>
      <h1 id="case-study-title">Chat-room application case study</h1>
      <div className={styles.abstract}>
        <p className={styles.abstractLabel}>Abstract</p>
        <p>
          For one moderated two-room workflow, observable behavior matched across Real Socket.IO
          4.8.3, published Smocket 0.4.2, and a handwritten mock, while the owned test-support
          surface differed. This report compares that surface and the pinned implementation
          evidence behind the result.
        </p>
      </div>
      <dl className={styles.headerFacts}>
        <div><dt>Recorded</dt><dd>{record.recordedAt.slice(0, 10)}</dd></div>
        <div><dt>Environment</dt><dd>{record.environment.platform} {record.environment.architecture} · Node {record.environment.node}</dd></div>
        <div><dt>Targets</dt><dd>Socket.IO 4.8.3 · Smocket 0.4.2 · handwritten</dd></div>
      </dl>
      <div className={styles.authorityCallout}>
        <p>
          The static Markdown document is the <strong>authoritative interpretation</strong>. This
          page is an interactive form of the same pinned observation data.
        </p>
        <a href={caseStudyLinks.authoritativeDocument}>Read authoritative Markdown ↗</a>
      </div>
      <p className={styles.claimBoundary}>{record.claimBoundary}</p>
    </header>
  );
}
