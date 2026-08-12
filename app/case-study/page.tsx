import Link from 'next/link';
import observations from '../../content/case-study-observations.json';
import { caseStudyCopy, caseStudyLinks } from '../../content/case-study';
import ThemeToggle from '../components/ThemeToggle';
import ApproachComparison from './components/ApproachComparison';
import EvidenceBoundaries from './components/EvidenceBoundaries';
import ObservationExplorer from './components/ObservationExplorer';
import Provenance from './components/Provenance';
import { createCaseStudyModel, type CaseStudyRecord } from './lib/model';
import styles from './page.module.css';

const model = createCaseStudyModel(observations as CaseStudyRecord);

export default function CaseStudyPage() {
  return (
    <>
      <ThemeToggle />
      <main>
        <section className={`section ${styles.hero}`} aria-labelledby="case-study-title">
          <div className={`inner ${styles.heroInner}`}>
            <Link className={styles.brand} href="/" aria-label="smocket home">
              <img src="/cat.webp" alt="" width={38} height={38} />
              <span>smocket</span>
            </Link>
            <p className={styles.kicker}>{caseStudyCopy.hero.eyebrow}</p>
            <h1 id="case-study-title">{caseStudyCopy.hero.title}</h1>
            <p className={styles.heroLead}>{caseStudyCopy.hero.lead}</p>
            <div className={styles.resultStrip}>
              <strong>Same observable result</strong>
              <span>Assertions passed · repeat matches · all three targets</span>
            </div>
            <p className={styles.authority}>
              {caseStudyCopy.hero.authority}{' '}
              <a href={caseStudyLinks.authoritativeDocument}>Read the authoritative interpretation.</a>
            </p>
            <p className={styles.claimBoundary}>{model.record.claimBoundary}</p>
          </div>
        </section>
        <ApproachComparison model={model} />
        <ObservationExplorer model={model} />
        <EvidenceBoundaries />
        <Provenance model={model} />
      </main>
    </>
  );
}
