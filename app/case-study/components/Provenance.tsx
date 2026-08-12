import {
  OBSERVATION_SHA256,
  PINNED_SOURCE_COMMIT,
  caseStudyLinks,
} from '../../../content/case-study';
import type { CaseStudyModel } from '../lib/model';
import styles from '../page.module.css';

function CodeFact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.codeFact}>
      <dt>{label}</dt>
      <dd>
        <code>{value}</code>
      </dd>
    </div>
  );
}

export default function Provenance({ model }: { model: CaseStudyModel }) {
  const { record } = model;
  const commands = [
    record.reproduction.run,
    record.reproduction.check,
    record.reproduction.record,
    ...Object.values(record.reproduction.targets),
  ];

  return (
    <section className="section" aria-labelledby="provenance-title">
      <div className="inner">
        <h2 id="provenance-title" className="h2">
          Reproduce the record.
        </h2>
        <p className="lead">
          Run these commands in the pinned Smocket source. Recording replaces the canonical
          snapshot, so use it only intentionally.
        </p>

        <div className={styles.provenanceGrid}>
          <div>
            <h3 className={styles.subhead}>Commands</h3>
            <ul className={styles.commandList}>
              {commands.map((command) => (
                <li key={command}>
                  <code>{command}</code>
                </li>
              ))}
            </ul>
            <h3 className={styles.applicationSubhead}>Shared application source</h3>
            <p className={styles.sourceRoot}>
              <code>{record.application.source}</code>
            </p>
            <ul className={styles.sourceFileList}>
              {record.application.files.map((file) => (
                <li key={file.path}>
                  <code>{file.path}</code>
                  <span>
                    {file.role} · {file.lines} physical source lines
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={styles.subhead}>Recorded provenance</h3>
            <dl className={styles.provenanceFacts}>
              <CodeFact label="Recorded at" value={record.recordedAt} />
              <CodeFact
                label="Environment"
                value={`${record.environment.platform} ${record.environment.architecture}; Node ${record.environment.node}; npm ${record.environment.npm}`}
              />
              <CodeFact label="Pinned source commit" value={PINNED_SOURCE_COMMIT} />
              <CodeFact label="Observation SHA-256" value={OBSERVATION_SHA256} />
              <CodeFact
                label="Application source SHA-256"
                value={record.application.combinedSha256}
              />
            </dl>
          </div>
        </div>

        <nav className={styles.sourceLinks} aria-label="Case study sources">
          <a href={caseStudyLinks.authoritativeDocument}>Authoritative Markdown</a>
          <a href={caseStudyLinks.observation}>Pinned observation JSON</a>
          <a href={caseStudyLinks.source}>Pinned case-study source</a>
        </nav>
      </div>
    </section>
  );
}
