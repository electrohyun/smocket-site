import Link from 'next/link';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { report } from '../../content/interactive-report';
import ArchitectureComparison from './components/ArchitectureComparison';
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
  const pinnedRoot = `${report.provenance.sourceRepository}/blob/${report.provenance.sourceCommit}`;

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
            <dl className={styles.heroFacts} aria-label="Report scope">
              {report.coverFacts.map((fact) => (
                <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
              ))}
            </dl>
          </div>
          <div className={styles.heroStatement}>
            <span>Usage guide</span><strong>{report.thesis}</strong><p>{report.supportingLine}</p>
          </div>
        </header>

        <nav className={styles.reportNav} aria-label="Interactive report sections">
          {report.navigation.map((item) => (
            <a key={item.number} href={item.href}><span>{item.number}</span>{item.label}</a>
          ))}
        </nav>

        <article className={styles.report}>
          <section id="problem" className={styles.section} aria-labelledby="problem-title">
            <SectionHeading id="problem" number="01" title="The preview handoff" body={report.problem.intro} />
            <div className={styles.problemGrid}>
              {report.problem.paths.map((path) => (
                <article key={path.id}><span>{path.label}</span><h3>{path.title}</h3><p>{path.body}</p></article>
              ))}
            </div>
          </section>

          <section id="architecture" className={styles.section} aria-labelledby="architecture-title">
            <SectionHeading id="architecture" number="02" title="Architecture by development stage" body="Select a path to see where the connection ends and what it verifies." />
            <ArchitectureComparison />
          </section>

          <section id="scenario" className={styles.section} aria-labelledby="scenario-title">
            <SectionHeading id="scenario" number="03" title="A three-tab drawing round" body={report.scenario.intro} />
            <ScenarioStepper />
            <div className={styles.demoCallout}>
              <div><span>Live demo</span><strong>Draw in A. Guess in B or C. See the same result in all three.</strong><p>The demo opens a fresh session and asks you to open each additional player with a separate click.</p></div>
              <a href="/demo/multi" target="_blank" rel="noreferrer">Open the 3-tab demo <span aria-hidden="true">↗</span></a>
            </div>
          </section>

          <section id="results" className={styles.section} aria-labelledby="results-title">
            <SectionHeading id="results" number="04" title="Drawing-game verification results" body="The board shows reproducible observations from the selected browser workflow and its scope." />
            <div className={styles.resultBoard}>
              {report.results.map((result) => (
                <article key={result.id}><strong>{result.value}</strong><span>{result.label}</span><p>{result.note}</p></article>
              ))}
            </div>
            <p className={styles.resultBoundary}>{report.resultBoundary}</p>

            <div className={styles.limitGrid}>
              <div><span className={styles.monoLabel}>Scope</span><h3>One browser profile, one origin, in-memory state.</h3></div>
              <ul>{report.limits.map((limit) => <li key={limit}>{limit}</li>)}</ul>
            </div>

            <aside className={styles.provenance} aria-label="Result provenance">
              <div><span className={styles.monoLabel}>Source and reproduction</span><h3>Smocket {report.provenance.packageVersion} · {report.provenance.verifiedOn}</h3><p>{report.provenance.outcome}</p></div>
              <dl>
                <div><dt>Commit</dt><dd><code>{report.provenance.sourceCommit}</code></dd></div>
                <div><dt>Command</dt><dd><code>{report.provenance.command}</code></dd></div>
              </dl>
              <div className={styles.sourceLinks}>
                {report.provenance.sourceFiles.map((file) => <a key={file} href={`${pinnedRoot}/${file}`}>{file.split('/').at(-1)} ↗</a>)}
              </div>
            </aside>

            <nav className={styles.resourceLinks} aria-label="Report resources">
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
