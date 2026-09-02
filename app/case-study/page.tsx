import Link from 'next/link';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { report } from '../../content/interactive-report';
import RuntimeGuide from './components/RuntimeGuide';
import ScenarioStepper from './components/ScenarioStepper';
import styles from './page.module.css';

function SectionHeading({ id, number, title, body }: { id: string; number: string; title: string; body: string }) {
  return (
    <header className={styles.sectionHeading}>
      <span className={styles.sectionNumber}>{number}</span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{body}</p>
    </header>
  );
}

export default function CaseStudyPage() {
  const pinnedRoot = `${report.source.repository}/blob/${report.source.commit}`;

  return (
    <>
      <ThemeToggle />
      <main className={styles.pageShell}>
        <header className={styles.hero}>
          <Link className={styles.brand} href="/" aria-label="Smocket home">
            <img src="/cat.webp" alt="" width="46" height="46" /><span>smocket</span>
          </Link>
          <div className={styles.heroLead}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{report.eyebrow}</p>
              <h1>{report.title}</h1>
              <p className={styles.introduction}>{report.introduction}</p>
            </div>
            <dl className={styles.heroFacts} aria-label="Case study scope">
              {report.coverFacts.map((fact) => (
                <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
              ))}
            </dl>
          </div>
          <div className={styles.heroStatement}>
            <span>Working rule</span><strong>{report.thesis}</strong><p>{report.supportingLine}</p>
          </div>
        </header>

        <nav className={styles.reportNav} aria-label="Case study sections">
          {report.navigation.map((item) => (
            <a key={item.number} href={item.href}><span>{item.number}</span>{item.label}</a>
          ))}
        </nav>

        <article className={styles.report}>
          <section id="roles" className={styles.section} aria-labelledby="roles-title">
            <SectionHeading id="roles" number="01" title="Two jobs, one application" body={report.roles.intro} />
            <div className={styles.roleGrid}>
              {report.roles.items.map((role) => (
                <article key={role.id}>
                  <span>{role.label}</span><h3>{role.title}</h3><p>{role.body}</p><strong>{role.useWhen}</strong>
                </article>
              ))}
            </div>
          </section>

          <section id="runtimes" className={styles.section} aria-labelledby="runtimes-title">
            <SectionHeading id="runtimes" number="02" title="Where Smocket runs" body="Choose a context to see who hosts the server and how clients connect." />
            <RuntimeGuide />
          </section>

          <section id="application" className={styles.section} aria-labelledby="application-title">
            <SectionHeading id="application" number="03" title="One application, two bootstraps" body={report.application.intro} />
            <div className={styles.codeGrid}>
              {report.application.snippets.map((snippet) => (
                <article key={snippet.id} className={styles.codeCard} data-shared={snippet.id === 'shared'}>
                  <header><span>{snippet.label}</span><h3>{snippet.title}</h3></header>
                  <pre><code>{snippet.code}</code></pre>
                  <p>{snippet.note}</p>
                </article>
              ))}
            </div>
            <div className={styles.flowHeading}>
              <span className={styles.monoLabel}>Selected workflow</span><h3>A three-tab drawing round</h3><p>{report.scenario.intro}</p>
            </div>
            <ScenarioStepper />
            <div className={styles.demoCallout}>
              <div><span>Live demo</span><strong>Draw in A. Guess in B or C. See the same result in all three.</strong><p>The demo uses the SharedWorker runtime shown above.</p></div>
              <a href="/demo/multi" target="_blank" rel="noreferrer">Open the 3-tab demo <span aria-hidden="true">↗</span></a>
            </div>
          </section>

          <section id="results" className={styles.section} aria-labelledby="results-title">
            <SectionHeading id="results" number="04" title="Observed behavior and boundaries" body="The table covers the drawing-game workflow, then separates what still belongs to the production backend." />
            <div className={styles.behaviorTableWrap}>
              <table className={styles.behaviorTable}>
                <thead><tr><th>Selected behavior</th><th>Node.js Socket.IO mock server</th><th>Smocket</th></tr></thead>
                <tbody>
                  {report.observedBehavior.map((row) => (
                    <tr key={row.behavior}><th scope="row">{row.behavior}</th><td>{row.socketIo}</td><td>{row.smocket}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.boundaryGrid}>
              {report.boundaries.map((boundary) => (
                <article key={boundary.label}>
                  <span className={styles.monoLabel}>{boundary.label}</span><h3>{boundary.title}</h3>
                  <ul>{boundary.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </article>
              ))}
            </div>

            <aside className={styles.sourcePanel} aria-label="Source and reproduction">
              <div><span className={styles.monoLabel}>Source and reproduction</span><h3>Smocket {report.source.version} · {report.source.date}</h3><p>{report.source.note}</p></div>
              <dl>
                <div><dt>Commit</dt><dd><code>{report.source.commit}</code></dd></div>
                <div><dt>Command</dt><dd><code>{report.source.command}</code></dd></div>
              </dl>
              <div className={styles.sourceLinks}>
                {report.source.files.map((file) => <a key={file.path} href={`${pinnedRoot}/${file.path}`}>{file.label} ↗</a>)}
              </div>
            </aside>

            <nav className={styles.resourceLinks} aria-label="Case study resources">
              {report.links.map((link) => (
                <a key={link.label} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noreferrer' : undefined}>{link.label} <span aria-hidden="true">↗</span></a>
              ))}
            </nav>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
