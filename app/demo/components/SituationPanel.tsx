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

const COMPARISON_DESCRIPTION =
  'Same recorded behavior. Real and Smocket share the application handler; the handwritten mock implements the transport support in the application.';

function cardDescription(sample: DrawingGameCodeSample, column: DrawingGameCodeColumn) {
  if (column.id === 'real') {
    return ['Application event handler', 'Behavior reference'] as const;
  }
  if (column.id === 'smocket') {
    return ['Same application event handler', '0 LOC changed'] as const;
  }
  return [
    'Application-owned mock transport',
    sample.id === 'drawing'
      ? 'Room broadcast and sender exclusion'
      : 'Acknowledgement and socket-id targeting',
  ] as const;
}

type SemanticHighlight = 'related' | 'key';

function semanticHighlights(
  sample: DrawingGameCodeSample,
  column: DrawingGameCodeColumn,
): Map<number, SemanticHighlight> {
  const highlights = new Map<number, SemanticHighlight>();
  const find = (text: string, from = 0) =>
    column.lines.findIndex((line, index) => index >= from && line.text.includes(text));
  const markRange = (start: number, end: number) => {
    if (start < 0 || end < start) return;
    for (let index = start; index <= end; index += 1) {
      highlights.set(column.lines[index].lineNumber, 'related');
    }
  };
  const markKey = (index: number) => {
    if (index >= 0) highlights.set(column.lines[index].lineNumber, 'key');
  };

  if (column.id !== 'handwritten') {
    if (sample.id === 'drawing') {
      markKey(find("socket.to(ROOM).emit('stroke', segment)"));
    } else {
      markKey(find('acknowledge(correct)'));
      markKey(find("io.to(socket.id).emit('correct'"));
    }
    return highlights;
  }

  if (sample.id === 'drawing') {
    const start = find('function createBroadcast(room, senderId)');
    const end = find('if (id !== senderId)', start);
    markRange(start, end);
    markKey(end);
    return highlights;
  }

  const targetingStart = find('const ids = pairs.has(target)');
  const targetingEnd = find('if (id !== senderId)', targetingStart);
  markRange(targetingStart, targetingEnd);
  markKey(targetingStart);

  const acknowledgementEnd = find('dispatch(serverListeners, event, args)');
  markRange(acknowledgementEnd - 1, acknowledgementEnd);
  markKey(acknowledgementEnd);
  return highlights;
}

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
  const codeBlockRef = useRef<HTMLPreElement>(null);
  const description = cardDescription(sample, column);
  const highlights = semanticHighlights(sample, column);

  useEffect(() => {
    if (column.id !== 'handwritten') return;
    const block = codeBlockRef.current;
    const focusLine = block?.querySelector<HTMLElement>(
      `[data-line="${sample.handwritten.focusLineNumber}"]`,
    );
    if (!block || !focusLine) return;

    const frame = requestAnimationFrame(() => {
      const blockRect = block.getBoundingClientRect();
      const lineRect = focusLine.getBoundingClientRect();
      const relativeTop = lineRect.top - blockRect.top + block.scrollTop;
      block.scrollTop = Math.max(0, relativeTop - 18);
    });
    return () => cancelAnimationFrame(frame);
  }, [column.id, sample.handwritten.focusLineNumber, snippet.id]);

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
          <p>
            <strong>{description[0]}</strong>
            <span>{description[1]}</span>
          </p>
        </div>
      </header>

      <div className={styles.snippetDetails}>
        <a
          className={styles.snippetVerification}
          href={snippet.sourceUrl}
          target="_blank"
          rel="noreferrer"
          title={snippet.sourceSha256}
        >
          Verified source · {drawingGameCodeModel.publicationCommit.slice(0, 7)} · SHA-256{' '}
          {snippet.sourceSha256.slice(0, 10)}…
        </a>
      </div>

      <pre ref={codeBlockRef} className={styles.codeBlock} aria-label={`${column.title} code`}>
        <code data-testid={`snippet-code-${snippet.id}`}>
          {column.lines.map((line, lineIndex) => {
            const highlight = highlights.get(line.lineNumber);
            return (
              <span
                key={line.lineNumber}
                className={`${styles.codeLine}${highlight === 'related' ? ` ${styles.codeLineRelated}` : ''}${highlight === 'key' ? ` ${styles.codeLineKey}` : ''}`}
                data-line={line.lineNumber}
                data-semantic-highlight={highlight}
                data-focus-line={
                  column.id === 'handwritten' &&
                  line.lineNumber === sample.handwritten.focusLineNumber
                    ? 'true'
                    : undefined
                }
              >
                {line.text}
                {lineIndex < column.lines.length - 1 ? (
                  <span className={styles.codeNewline}>{'\n'}</span>
                ) : null}
              </span>
            );
          })}
        </code>
      </pre>
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
                  {COMPARISON_DESCRIPTION}
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
