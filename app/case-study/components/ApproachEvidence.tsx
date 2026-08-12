'use client';

import { useState } from 'react';
import type { CaseStudyModel, TargetId } from '../lib/model';
import styles from '../page.module.css';
import SourceEvidence from './SourceEvidence';

export default function ApproachEvidence({ model }: { model: CaseStudyModel }) {
  const [targetId, setTargetId] = useState<TargetId>('socket-io');
  const selected = model.approachEvidence[targetId];
  const [excerptIds, setExcerptIds] = useState<Record<TargetId, string>>({
    'socket-io': 'bootstrap',
    'published-smocket': 'bootstrap',
    handwritten: 'bootstrap',
  });
  const selectedExcerpt = selected.excerpts.find((item) => item.id === excerptIds[targetId]) ?? selected.excerpts[0];

  return (
    <section id="implementation" className={styles.reportSection} aria-labelledby="implementation-title">
      <div className={styles.sectionHeading}>
        <p>03</p>
        <div><h2 id="implementation-title">Pinned implementation evidence</h2><p>Selecting an approach changes its setup, owned files, failure paths, and exact source.</p></div>
      </div>
      <div className={styles.selector} role="group" aria-label="Select target implementation evidence">
        {model.targets.map((target) => (
          <button key={target.id} type="button" aria-pressed={targetId === target.id} onClick={() => setTargetId(target.id)}>
            Select {target.label} evidence
          </button>
        ))}
      </div>
      <div className={styles.evidenceSummary} aria-live="polite">
        <div>
          <p className={styles.overline}>{selected.label}</p>
          <h3>{selected.dependencyLabel}</h3>
          <p>{selected.setup}</p>
        </div>
        <div>
          <strong>Owned files</strong>
          <ul>{selected.authoredFiles.map((file) => <li key={file.path}><code>{file.path}</code> · {file.role} · {file.lines} lines</li>)}</ul>
        </div>
        <div>
          <strong>Explicit source paths</strong>
          <p>{selected.debugging}</p>
        </div>
      </div>
      {selected.excerpts.length > 1 && (
        <div className={styles.subselector} role="group" aria-label="Select handwritten source evidence">
          {selected.excerpts.map((item) => <button key={item.id} type="button" aria-pressed={selectedExcerpt.id === item.id} onClick={() => setExcerptIds((current) => ({ ...current, [targetId]: item.id }))}>{item.label}</button>)}
        </div>
      )}
      <SourceEvidence excerpt={selectedExcerpt} />
      {targetId === 'handwritten' && (
        <div className={styles.behaviorBoundary}>
          <div className={styles.supported}><h3>Reproduced in this handwritten mock</h3><ul>{selected.supportedBehaviors.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className={styles.omitted}><h3>Deliberately omitted / not evidenced</h3><ul>{selected.omittedBehaviors.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
      )}
    </section>
  );
}
