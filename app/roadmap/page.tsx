import Link from 'next/link';
import { roadmap, roadmapLinks } from '../../content/roadmap';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import JourneyNav from './components/JourneyNav';
import ReleaseStage from './components/ReleaseStage';
import RoadmapDisclosure from './components/RoadmapDisclosure';
import styles from './page.module.css';

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      <p aria-hidden="true">{number}</p>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <>
      <ThemeToggle />
      <main className={styles.pageShell}>
        <article className={styles.report}>
          <header className={styles.reportHeader} aria-labelledby="roadmap-title">
            <div className={styles.brandRow}>
              <Link className={styles.brand} href="/" aria-label="smocket home">
                <img src="/cat.webp" alt="" width={34} height={34} />
                <span>smocket</span>
              </Link>
              <span className={styles.reportLabel}>v1 direction</span>
            </div>

            <p className={styles.kicker}>{roadmap.eyebrow}</p>
            <h1 id="roadmap-title">{roadmap.title}</h1>
            <p className={styles.summary}>{roadmap.summary}</p>

            <div className={styles.sourceNote}>
              <p>{roadmap.sourceNote}</p>
              <a href={roadmapLinks.canonical}>
                Open the canonical roadmap <span aria-hidden="true">↗</span>
              </a>
            </div>
          </header>

          <div className={styles.journeyLayout}>
            <JourneyNav />
            <div className={styles.journeyRoute}>
          <section id="guarantee" className={styles.section} data-journey-stop="guarantee">
            <SectionHeading
              number="01"
              title="The v1 guarantee"
              description="A stable logic-layer promise with an explicit edge."
            />
            <p className={styles.guaranteeStatement}>{roadmap.guarantee}</p>
            <div className={styles.boundaryGrid}>
              <div className={styles.boundaryPanel}>
                <p className={styles.overline}>What v1.0.0 aims to stabilize</p>
                <ul>
                  {roadmap.stabilizes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className={styles.inlineLinks}>
                  <a href={roadmapLinks.scope}>Read the documented scope ↗</a>
                  <a href={roadmapLinks.conformance}>Open the conformance report ↗</a>
                </div>
              </div>
              <div className={`${styles.boundaryPanel} ${styles.nonGoals}`}>
                <p className={styles.overline}>What v1.0.0 does not promise</p>
                <ul>
                  {roadmap.nonGoals.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="classification" className={styles.section} data-journey-stop="classification">
            <SectionHeading
              number="02"
              title="Fidelity and Extensibility review"
              description={roadmap.reviewSummary}
            />
            <div className={styles.disclosureGrid}>
              {roadmap.classifications.map((item) => (
                <RoadmapDisclosure key={item.id} item={item} group="classification-outcome" />
              ))}
            </div>
            <p className={styles.boundaryNote}>
              A new finding is not automatically a v1 requirement. It enters the release only
              after the project decides that it affects the published scope or an explicit
              guarantee.
            </p>
          </section>

          <section id="sequence" className={styles.section} data-journey-stop="sequence">
            <SectionHeading
              number="03"
              title="The pre-v1 release path"
              description="One required path, one conditional branch, and no invented release count."
            />
            <figure className={styles.releaseFigure}>
              <ol className={styles.releaseFlow}>
                {roadmap.releaseStages.map((stage, index) => (
                  <ReleaseStage key={stage.id} stage={stage} index={index} />
                ))}
              </ol>
              <figcaption>
                v0.5.0 is conditional, not scheduled. It appears only when required pre-v1 work
                falls into an ADR 0019 major-class row; otherwise stabilization follows v0.4.3.
              </figcaption>
            </figure>
            <div className={styles.releaseRule}>
              <span>Governing rule</span>
              <p>
                ADR 0019 classifies every change. The roadmap applies its pre-v1 shift without
                duplicating the decision table.
              </p>
              <a href={roadmapLinks.adr0019}>Read ADR 0019 ↗</a>
            </div>
          </section>

          <section id="dependencies" className={styles.section} data-journey-stop="dependencies">
            <SectionHeading
              number="04"
              title="Release-order dependencies"
              description="Only relationships that materially affect release order belong here; their linked issues and decisions own the details."
            />
            <div className={styles.dependencyList}>
              {roadmap.dependencies.map((item) => (
                <RoadmapDisclosure key={item.id} item={item} />
              ))}
            </div>
          </section>

          <section id="sources" className={styles.section} data-journey-stop="sources">
            <SectionHeading
              number="05"
              title="How this roadmap changes"
              description="A finding changes the release plan only through the canonical project process."
            />
            <ol className={styles.changeSteps}>
              {roadmap.changeSteps.map((step, index) => (
                <li key={step}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <div className={styles.sourcePanel}>
              <div>
                <p className={styles.overline}>Canonical sources</p>
                <h3>Follow the documents that own the decisions.</h3>
                <p>
                  Issue and decision status can change after this page is published. Use these
                  links for the current plan and the reasoning behind it.
                </p>
              </div>
              <nav className={styles.sourceLinks} aria-label="Canonical roadmap sources">
                {roadmap.relatedLinks.map((link) => (
                  <a key={link.href} href={link.href}>
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </nav>
            </div>
          </section>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
