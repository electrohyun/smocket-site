'use client';

import IconButton from '@/app/components/IconButton';
import { useEffect, useRef, useState } from 'react';
import {
  ChatIcon,
  ClockIcon,
  CodeIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  SoundOffIcon,
  SoundOnIcon,
} from '@/app/components/icons';
import {
  drawingGameCodeModel,
  type CodeSampleId,
  type DrawingGameCodeColumn,
  type DrawingGameCodeSample,
} from '../lib/drawing-game-code';
import styles from './SituationPanel.module.css';

/* The situation panel (기획 v2 §5). Controls that act on the round, kept off the
 * two views themselves so a view stays about the game and this stays about the
 * knobs. The word toggle and the delay slider are the observer's alone — the
 * drawer has no word to hide and no B on screen to slow — so they are not shown
 * there rather than greyed, because a dead control only asks "why won't this
 * work" (기획 5단계 §2).
 *
 * They are discs now rather than the small text pills they were. On a page whose
 * subject is what is happening on it, the things that change what happens were
 * the least visible marks on screen. `IconButton` is the landing's replay button,
 * the same component, so a control looks like a control on both pages.
 *
 * The eye only ever means the word. The viewpoint button shows where it goes, and
 * where it goes from the observer is the pen — so an eye and a viewpoint eye are
 * never on screen together. */

type Viewpoint = 'drawer' | 'observer';

function CodeCard({
  column,
  index,
  sample,
}: {
  column: DrawingGameCodeColumn;
  index: number;
  sample: DrawingGameCodeSample;
}) {
  const prefix = `demo-code-${sample.id}-${column.id}`;
  const snippet = column.snippet;

  return (
    <article
      className={styles.codeCard}
      aria-labelledby={`${prefix}-title`}
      data-code-column={column.id}
    >
      <header className={styles.codeCardHeader}>
        <span className={styles.codeCardIndex}>{String(index + 1).padStart(2, '0')}</span>
        <div>
          <h3 id={`${prefix}-title`}>{column.title}</h3>
          <p>{column.summary}</p>
        </div>
        <span className={styles.codeCardMeta}>{column.status}</span>
      </header>

      <div className={styles.comparisonFacts} aria-label={`${column.title} comparison facts`}>
        {column.id === 'real' && (
          <>
            <strong>Behavior oracle</strong>
            <span>Recorded workflow reference</span>
            <span>Source hash shown below</span>
          </>
        )}
        {column.id === 'smocket' && (
          <>
            <strong>Same handler</strong>
            <span>Code + source hash matched</span>
            <span>Application code changed: {sample.applicationComparison.changedLoc} LOC</span>
          </>
        )}
        {column.id === 'handwritten' && (
          <>
            <strong>{sample.handwritten.totalLoc} LOC capability stage</strong>
            <span>{sample.handwritten.stageId}</span>
            <span>Application-owned transport</span>
          </>
        )}
      </div>

      <div className={styles.snippetDetails}>
        <span className={styles.snippetRole}>{snippet.purpose}</span>
        <code className={styles.snippetId}>{snippet.id}</code>
        <a
          className={styles.snippetSource}
          href={snippet.sourceUrl}
          target="_blank"
          rel="noreferrer"
          title={snippet.sourceLabel}
        >
          Source at {drawingGameCodeModel.publicationCommit.slice(0, 7)}
        </a>
        <span className={styles.snippetHash} title={snippet.sourceSha256}>
          SHA-256 {snippet.sourceSha256.slice(0, 10)}…
        </span>
      </div>

      <pre className={styles.codeBlock} aria-label={`${column.title} code`}>
        <code data-testid={`snippet-code-${snippet.id}`}>
          {column.lines.map((line, lineIndex) => (
            <span
              key={line.lineNumber}
              className={`${styles.codeLine}${line.highlighted ? ` ${styles.codeLineHighlighted}` : ''}`}
              data-line={line.lineNumber}
              data-highlighted={line.highlighted ? 'true' : undefined}
            >
              {line.text}
              {lineIndex < column.lines.length - 1 ? (
                <span className={styles.codeNewline}>{'\n'}</span>
              ) : null}
            </span>
          ))}
        </code>
      </pre>

      <footer className={styles.codeCardFooter}>
        {column.id === 'real' && <p>Reference result for this recorded workflow step.</p>}
        {column.id === 'smocket' && (
          <dl className={styles.integrationMetrics}>
            <div>
              <dt>Full target integration</dt>
              <dd>{sample.smocketIntegration.totalLoc} LOC</dd>
            </div>
            <div>
              <dt>Bootstrap</dt>
              <dd>{sample.smocketIntegration.bootstrapLoc} LOC</dd>
            </div>
            <div>
              <dt>Substitution + registration</dt>
              <dd>{sample.smocketIntegration.substitutionAndRegistrationLoc} LOC</dd>
            </div>
          </dl>
        )}
        {column.id === 'handwritten' && (
          <>
            <dl className={styles.integrationMetrics} aria-label="Handwritten LOC by stage">
              <div>
                <dt>{sample.handwritten.prerequisite.stageId.replaceAll('-', ' ')}</dt>
                <dd>{sample.handwritten.prerequisite.totalLoc} LOC</dd>
              </div>
              <div>
                <dt>{sample.handwritten.stageId.replaceAll('-', ' ')}</dt>
                <dd>{sample.handwritten.totalLoc} LOC</dd>
              </div>
              <div>
                <dt>full workflow</dt>
                <dd>{sample.handwritten.fullWorkflowLoc} LOC</dd>
              </div>
            </dl>
            <p>{sample.handwritten.supportDescription}</p>
            <div className={styles.diffMetrics} aria-label="Measured stage changes">
              {sample.handwritten.diffs.map((diff) => (
                <span key={diff.snippetId} title={diff.snippetId}>
                  {diff.stageId}: +{diff.additions} / -{diff.deletions}
                </span>
              ))}
            </div>
            <p className={styles.limitNote}>
              {sample.handwritten.totalLoc} LOC is the {sample.handwritten.stageId} capability
              stage, not the full golden workflow. Full handwritten workflow source closure:{' '}
              {sample.handwritten.fullWorkflowLoc} LOC.
            </p>
          </>
        )}
      </footer>
    </article>
  );
}

interface Props {
  viewpoint: Viewpoint;
  onSwitch: () => void;
  revealed: boolean;
  onReveal: (value: boolean) => void;
  delayMs: number;
  onDelay: (ms: number) => void;
  muted: boolean;
  onMute: (value: boolean) => void;
}

export default function SituationPanel({
  viewpoint,
  onSwitch,
  revealed,
  onReveal,
  delayMs,
  onDelay,
  muted,
  onMute,
}: Props) {
  const observing = viewpoint === 'observer';
  const [activeSample, setActiveSample] = useState<CodeSampleId | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const sample = activeSample ? drawingGameCodeModel.samples[activeSample] : null;

  const openSample = (name: CodeSampleId, trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    setActiveSample(name);
  };

  const closeSample = () => {
    setActiveSample(null);
    requestAnimationFrame(() => lastTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!activeSample) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveSample(null);
        requestAnimationFrame(() => lastTriggerRef.current?.focus());
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([tabindex="-1"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeSample]);

  return (
    <aside className={styles.panel} aria-label="Controls">
      <div className={styles.codeActions} role="group" aria-label="Mock code">
        <span className={styles.codePrompt}>
          <span>
            Built with <strong>Smocket</strong>.{' '}
            <span className={styles.promptDetail}>Explore the code behind this demo </span>
            <span aria-hidden="true">→</span>
          </span>
        </span>

        <button
          type="button"
          className={`${styles.codeButton} ${styles.drawingLink}`}
          aria-label="View drawing code"
          aria-expanded={activeSample === 'drawing'}
          aria-controls="demo-code-panel"
          onClick={(event) => openSample('drawing', event.currentTarget)}
        >
          <svg
            className={styles.codeButtonIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {CodeIcon}
          </svg>
          <span className={styles.codeLabel}>Drawing</span>
        </button>

        <button
          type="button"
          className={`${styles.codeButton} ${styles.chatLink}`}
          aria-label="View chat code"
          aria-expanded={activeSample === 'chat'}
          aria-controls="demo-code-panel"
          onClick={(event) => openSample('chat', event.currentTarget)}
        >
          <svg
            className={styles.codeButtonIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ChatIcon}
          </svg>
          <span className={styles.codeLabel}>Chat</span>
        </button>
      </div>

      {sample && (
        <div
          className={styles.codeOverlay}
          data-testid="demo-code-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSample();
          }}
        >
          <section
            ref={panelRef}
            id="demo-code-panel"
            className={styles.codePanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-code-title"
            aria-describedby="demo-code-description"
          >
            <header className={styles.codePanelHeader}>
              <div>
                <span className={styles.codeEyebrow}>Recorded drawing-game workflow</span>
                <h2 id="demo-code-title" className={styles.codeTitle}>
                  {sample.title}
                </h2>
                <p id="demo-code-description" className={styles.codeDescription}>
                  {sample.description}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                className={styles.codeClose}
                aria-label="Close code comparison"
                onClick={closeSample}
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <div className={styles.codeGrid}>
              {sample.columns.map((column, index) => (
                <CodeCard
                  key={`${sample.id}-${column.id}`}
                  column={column}
                  index={index}
                  sample={sample}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {observing && (
        <>
          <IconButton
            icon={revealed ? EyeIcon : EyeOffIcon}
            label="word"
            title={revealed ? 'hide the word' : 'reveal the word'}
            pressed={revealed}
            onClick={() => onReveal(!revealed)}
          />

          {/* The one control that is not a button, and stays one: what it is for
              is watching order hold as the delay grows, and a stepped button
              would only ever show the steps someone chose in advance. Sized to
              the discs so the labels sit on one line. */}
          <div className={styles.control}>
            <div className={`${styles.pill}${delayMs > 0 ? ` ${styles.on}` : ''}`}>
              <svg
                className={styles.pillIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ClockIcon}
              </svg>
              <input
                className={styles.range}
                type="range"
                min={0}
                max={2000}
                step={100}
                value={delayMs}
                onChange={(event) => onDelay(Number(event.target.value))}
                aria-label="Delay B's delivery, in milliseconds"
              />
              <span className={styles.value}>{delayMs}ms</span>
            </div>
            <span className={styles.label}>
              <span className={styles.adapter}>DelayingAdapter</span> · B
            </span>
          </div>
        </>
      )}

      <IconButton
        icon={muted ? SoundOffIcon : SoundOnIcon}
        label="sound"
        title={muted ? 'turn the sound on' : 'turn the sound off'}
        pressed={!muted}
        onClick={() => onMute(!muted)}
      />

      <IconButton
        icon={observing ? PencilIcon : EyeIcon}
        label={observing ? 'drawer' : 'observer'}
        title={observing ? 'switch to the drawer' : 'switch to the observer'}
        onClick={onSwitch}
      />
    </aside>
  );
}
