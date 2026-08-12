import { pinnedSourceUrl } from '../../../content/case-study';
import type { CaseStudyModel } from '../lib/model';
import styles from '../page.module.css';

export default function Method({ model }: { model: CaseStudyModel }) {
  return (
    <section id="method" className={styles.reportSection} aria-labelledby="method-title">
      <div className={styles.sectionHeading}>
        <p>01</p>
        <div>
          <h2 id="method-title">Research question &amp; method</h2>
          <p>What does each approach own to support the same selected application test?</p>
        </div>
      </div>
      <div className={styles.proseGrid}>
        <div>
          <p>
            All three targets run the same application, scenario, and assertions. Only dependency
            wiring and bootstrap change; the handwritten fixture additionally owns the mock being
            compared. No shared file contains a target branch or workaround.
          </p>
          <p>
            Listeners register before their actions. Acknowledgements and later per-socket markers—not
            delays or timeouts—establish completion and non-receipt. The same assertions execute
            twice per target in one process.
          </p>
        </div>
        <aside className={styles.methodBoundary}>
          <strong>Evidence boundary</strong>
          Equal results mean equal values under these shared assertions only. They do not prove
          overall Socket.IO compatibility.
        </aside>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <caption>Shared application and test code, unchanged across all three targets</caption>
          <thead><tr><th>File</th><th>Responsibility</th><th>Observed surface</th><th>Evidence</th></tr></thead>
          <tbody>
            {model.record.application.files.map((file) => {
              const path = `${model.record.application.source}/${file.path}`;
              return (
                <tr key={file.path}>
                  <th scope="row"><code>{file.path}</code></th>
                  <td>{file.role === 'assertions' ? 'Expected observation and deep equality' : file.path === 'scenario.js' ? 'Shared workflow orchestration' : 'Chat-room application handlers'}</td>
                  <td>{file.lines} physical source lines</td>
                  <td><a href={pinnedSourceUrl(path)}>Pinned source ↗</a><small><code>{file.sha256.slice(0, 12)}…</code></small></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
