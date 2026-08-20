import observations from '../../content/case-study-observations.json';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import ApproachEvidence from './components/ApproachEvidence';
import AuthoredSurface from './components/AuthoredSurface';
import BehaviorMatrix from './components/BehaviorMatrix';
import EvidenceBoundaries from './components/EvidenceBoundaries';
import Method from './components/Method';
import ObservationExplorer from './components/ObservationExplorer';
import Provenance from './components/Provenance';
import ReportHeader from './components/ReportHeader';
import { createCaseStudyModel } from './lib/model';
import { loadCaseStudySources } from './lib/source-evidence';
import styles from './page.module.css';

const model = createCaseStudyModel(observations, loadCaseStudySources());

export default function CaseStudyPage() {
  return (
    <>
      <ThemeToggle />
      <main className={styles.pageShell}>
        <article className={styles.report}>
          <ReportHeader model={model} />
          <nav className={styles.reportNav} aria-label="Case study sections">
            <a href="#method">Method</a><a href="#surface">Owned surface</a><a href="#implementation">Implementation</a><a href="#behavior">Behavior</a><a href="#boundaries">Boundaries</a><a href="#provenance">Provenance</a>
          </nav>
          <Method model={model} />
          <AuthoredSurface model={model} />
          <ApproachEvidence model={model} />
          <BehaviorMatrix model={model} />
          <ObservationExplorer model={model} />
          <EvidenceBoundaries />
          <Provenance model={model} />
        </article>
      </main>
      <Footer />
    </>
  );
}
