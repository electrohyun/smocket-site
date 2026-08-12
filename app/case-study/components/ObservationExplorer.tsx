'use client';

import { useReducer, useRef } from 'react';
import {
  filterTranscript,
  initialExplorerState,
  reduceExplorerState,
  type CaseStudyModel,
  type ExplorerAction,
} from '../lib/model';
import pageStyles from '../page.module.css';
import styles from './ObservationExplorer.module.css';

function label(value: string): string {
  if (value === 'all') return 'All';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ObservationExplorer({ model }: { model: CaseStudyModel }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [state, dispatch] = useReducer(
    (current: typeof initialExplorerState, action: ExplorerAction) =>
      reduceExplorerState(model, current, action),
    initialExplorerState,
  );
  const filtered = filterTranscript(model.transcript, state.participant, state.transcriptCategory);

  return (
    <section id="transcript" className={pageStyles.reportSection} aria-labelledby="transcript-heading">
      <div className={pageStyles.sectionHeading}>
        <p>05</p>
        <div><h2 id="transcript-heading">Supporting observation evidence</h2><p>The shared transcript is secondary because target selection cannot change it.</p></div>
      </div>
      <details ref={detailsRef} className={styles.disclosure}>
        <summary onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && detailsRef.current) {
            event.preventDefault();
            detailsRef.current.open = !detailsRef.current.open;
          }
        }}>Supporting evidence: shared transcript <span>{model.transcript.length} canonical lines</span></summary>
        <div className={styles.disclosureBody}>
          <div className={styles.filterBlock}>
            <p id="participant-filter-label">Filter transcript by participant</p>
            <div className={styles.buttonGroup} role="group" aria-labelledby="participant-filter-label">
              {model.participants.map((participant) => <button key={participant} type="button" aria-pressed={state.participant === participant} onClick={() => dispatch({ type: 'select-participant', value: participant })}>{label(participant)}</button>)}
            </div>
          </div>
          <div className={styles.filterBlock}>
            <p id="event-filter-label">Filter transcript by event</p>
            <div className={styles.buttonGroup} role="group" aria-labelledby="event-filter-label">
              {model.transcriptCategories.map((category) => <button key={category} type="button" aria-pressed={state.transcriptCategory === category} onClick={() => dispatch({ type: 'select-transcript-category', value: category })}>{category === 'all' ? 'All events' : label(category)}</button>)}
            </div>
          </div>
          <p className={styles.status} role="status" aria-live="polite">Showing {filtered.length} of {model.transcript.length} shared lines.</p>
          {filtered.length ? (
            <ol className={pageStyles.transcript} aria-label="Filtered shared transcript">
              {filtered.map((line) => <li key={line.id}><span>{String(line.id + 1).padStart(2, '0')}</span><code>{line.text}</code></li>)}
            </ol>
          ) : (
            <div className={styles.empty} role="status"><p>No recorded line matches both filters.</p><button type="button" onClick={() => dispatch({ type: 'reset-transcript' })}>Show all transcript lines</button></div>
          )}
        </div>
      </details>
    </section>
  );
}
