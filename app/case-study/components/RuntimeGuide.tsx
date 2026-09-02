'use client';

import { useState } from 'react';
import { report, type RuntimeId } from '../../../content/interactive-report';
import styles from '../page.module.css';

export default function RuntimeGuide() {
  const [selectedId, setSelectedId] = useState<RuntimeId>('node-test');
  const selected = report.runtimes.find((runtime) => runtime.id === selectedId)!;

  return (
    <div className={styles.runtimeInteractive}>
      <div className={styles.runtimeTabs} role="group" aria-label="Inspect a runtime">
        {report.runtimes.map((runtime) => (
          <button
            key={runtime.id}
            type="button"
            aria-pressed={runtime.id === selectedId}
            aria-controls="runtime-detail"
            onClick={() => setSelectedId(runtime.id)}
          >
            <span>{runtime.tabLabel}</span>
            <strong>{runtime.title}</strong>
          </button>
        ))}
      </div>
      <div id="runtime-detail" className={styles.runtimeDetail} aria-live="polite">
        <div>
          <span className={styles.monoLabel}>{selected.tabLabel}</span>
          <h3>{selected.title}</h3>
          <p>{selected.detail}</p>
        </div>
        <dl>
          <div><dt>Host</dt><dd>{selected.host}</dd></div>
          <div><dt>Connection</dt><dd>{selected.connection}</dd></div>
          <div><dt>Use it for</dt><dd>{selected.timing}</dd></div>
        </dl>
      </div>
    </div>
  );
}
