'use client';

import { useState } from 'react';
import { report, type ScenarioStepId } from '../../../content/interactive-report';
import styles from '../page.module.css';

export default function ScenarioStepper() {
  const [selectedId, setSelectedId] = useState<ScenarioStepId>('connect');
  const selected = report.scenario.steps.find((step) => step.id === selectedId)!;

  return (
    <div className={styles.scenarioInteractive}>
      <ol className={styles.eventTimeline} aria-label="Drawing-game event flow">
        {report.scenario.steps.map((step, index) => (
          <li key={step.id}>
            <button type="button" aria-pressed={step.id === selectedId} aria-controls="scenario-detail" onClick={() => setSelectedId(step.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{step.event}</strong>
            </button>
          </li>
        ))}
      </ol>
      <div id="scenario-detail" className={styles.scenarioDetail} aria-live="polite">
        <div className={styles.scenarioBrowsers} aria-hidden="true">
          {['A · DRAWER', 'B · GUESSER', 'C · GUESSER'].map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className={styles.scenarioCopy}>
          <p>{selected.event}</p><h3>{selected.label}</h3>
          <dl>
            <div><dt>On screen</dt><dd>{selected.experience}</dd></div>
            <div><dt>Event flow</dt><dd>{selected.exchange}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
