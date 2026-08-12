'use client';

import { useRef } from 'react';
import type { ReleaseStage as ReleaseStageItem } from '../../../content/roadmap';
import styles from '../page.module.css';

export default function ReleaseStage({ stage, index }: { stage: ReleaseStageItem; index: number }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <li
      className={stage.conditional ? styles.conditionalStage : undefined}
      data-step={String(index + 1).padStart(2, '0')}
      data-route-stage={stage.id}
    >
      <span className={styles.routeNode} aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      {stage.conditional && (
        <span className={styles.branchLabel}>Conditional branch</span>
      )}
      {stage.detail ? (
        <details ref={detailsRef} name="release-rule" className={styles.stageDisclosure}>
          <summary
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && detailsRef.current) {
                event.preventDefault();
                detailsRef.current.open = !detailsRef.current.open;
              }
            }}
          >
            <span className={styles.stageEyebrow}>{stage.eyebrow}</span>
            <strong>{stage.label}</strong>
            <small>{stage.summary}</small>
            <span className={styles.nextRoute}>
              <b>Next:</b> {stage.next}
            </span>
            <span className={styles.stagePrompt}>Read release rule</span>
          </summary>
          <p>{stage.detail}</p>
        </details>
      ) : (
        <div className={styles.stageCard}>
          <span className={styles.stageEyebrow}>{stage.eyebrow}</span>
          <strong>{stage.label}</strong>
          <small>{stage.summary}</small>
          <span className={styles.nextRoute}>
            <b>Next:</b> {stage.next}
          </span>
        </div>
      )}
      {stage.conditional && (
        <span className={styles.rejoinLabel}>Rejoins at stabilization</span>
      )}
    </li>
  );
}
