'use client';

import { useState } from 'react';
import type { BehaviorId, CaseStudyModel } from '../lib/model';
import styles from '../page.module.css';
import SourceEvidence from './SourceEvidence';

export default function BehaviorMatrix({ model }: { model: CaseStudyModel }) {
  const [behaviorId, setBehaviorId] = useState<BehaviorId>('join');
  const selected = model.behaviorRows.find((row) => row.id === behaviorId)!;

  return (
    <section id="behavior" className={styles.reportSection} aria-labelledby="behavior-title">
      <div className={styles.sectionHeading}>
        <p>04</p>
        <div><h2 id="behavior-title">Workflow behavior matrix</h2><p>The same structured observation passed the same assertion for every target.</p></div>
      </div>
      <div className={styles.tableWrap}>
        <table className={`${styles.dataTable} ${styles.matrix}`}>
          <caption>Passed means equal only within this selected workflow and shared assertion.</caption>
          <thead><tr><th>Selected behavior</th>{model.targets.map((target) => <th key={target.id}>{target.label}</th>)}</tr></thead>
          <tbody>{model.behaviorRows.map((row) => (
            <tr key={row.id}>
              <th scope="row"><button type="button" aria-pressed={row.id === behaviorId} aria-controls="behavior-evidence" onClick={() => setBehaviorId(row.id)}>{row.label}</button></th>
              {model.targets.map((target) => <td key={target.id}><span className={styles.passMark}>✓</span> {row.results[target.id]}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div id="behavior-evidence" className={styles.matrixEvidence} aria-live="polite">
        <div className={styles.structuredValue}><p className={styles.overline}>Selected structured observation · {selected.label}</p><pre><code>{JSON.stringify(selected.structuredObservation, null, 2)}</code></pre></div>
        <div className={styles.evidenceGrid}>
          <SourceEvidence excerpt={selected.evidence.assertion} />
          <SourceEvidence excerpt={selected.evidence.application} />
          {selected.evidence.handwritten && <SourceEvidence excerpt={selected.evidence.handwritten} />}
        </div>
      </div>
    </section>
  );
}
