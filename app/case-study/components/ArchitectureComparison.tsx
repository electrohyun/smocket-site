'use client';

import { useState } from 'react';
import { report, type ArchitectureId } from '../../../content/interactive-report';
import styles from '../page.module.css';

export default function ArchitectureComparison() {
  const [selectedId, setSelectedId] = useState<ArchitectureId>('socket-io');
  const selected = report.architectures.find((item) => item.id === selectedId)!;

  return (
    <div className={styles.architectureInteractive}>
      <div className={styles.architectureTabs} role="group" aria-label="Inspect an architecture">
        {report.architectures.map((architecture) => (
          <button key={architecture.id} type="button" aria-pressed={architecture.id === selectedId} aria-controls="architecture-detail" onClick={() => setSelectedId(architecture.id)}>
            {architecture.tabLabel}
          </button>
        ))}
      </div>
      <div className={styles.architectureGrid}>
        {report.architectures.map((architecture) => (
          <article key={architecture.id} className={styles.architectureCard} data-selected={architecture.id === selectedId} aria-label={`${architecture.tabLabel} architecture`}>
            <div className={styles.browserStack} aria-label="Three browser tabs">
              {['Tab 1', 'Tab 2', 'Tab 3'].map((tab) => <span key={tab}>{tab}</span>)}
            </div>
            <div className={styles.connection} aria-hidden="true"><i /><i /><i /><b>{architecture.transport}</b></div>
            <div className={styles.serverNode}>
              <span>{architecture.id === 'socket-io' ? 'NODE SERVER' : 'BROWSER WORKER'}</span>
              <strong>{architecture.title}</strong>
            </div>
            <footer><span>Role</span><strong>{architecture.role}</strong></footer>
          </article>
        ))}
      </div>
      <div id="architecture-detail" className={styles.architectureDetail} aria-live="polite">
        <span>{selected.tabLabel}</span>
        <div><strong>{selected.detail}</strong><p>{selected.timing}</p></div>
      </div>
    </div>
  );
}
