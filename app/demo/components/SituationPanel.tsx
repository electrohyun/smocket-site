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
  type DrawingGameCodeCard,
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

function snippetDomId(prefix: string, snippetId: string) {
  return `${prefix}-${snippetId.replace(/[^a-z0-9_-]/gi, '-')}`;
}

function CodeCard({
  card,
  index,
  sampleId,
}: {
  card: DrawingGameCodeCard;
  index: number;
  sampleId: CodeSampleId;
}) {
  const [selectedId, setSelectedId] = useState(card.snippets[0].id);
  const selected = card.snippets.find((snippet) => snippet.id === selectedId) ?? card.snippets[0];
  const prefix = `demo-code-${sampleId}-${card.id}`;
  const selectedTabId = snippetDomId(`${prefix}-tab`, selected.id);
  const selectedPanelId = snippetDomId(`${prefix}-panel`, selected.id);

  const selectAndFocus = (snippetIndex: number) => {
    const next = card.snippets[snippetIndex];
    setSelectedId(next.id);
    requestAnimationFrame(() =>
      document.getElementById(snippetDomId(`${prefix}-tab`, next.id))?.focus(),
    );
  };

  return (
    <article className={styles.codeCard} aria-labelledby={`${prefix}-title`}>
      <header className={styles.codeCardHeader}>
        <span className={styles.codeCardIndex}>{String(index + 1).padStart(2, '0')}</span>
        <div>
          <h3 id={`${prefix}-title`}>{card.title}</h3>
          <p>{card.description}</p>
        </div>
        <span className={styles.codeCardMeta}>{card.meta}</span>
      </header>

      <div className={styles.snippetTabs} role="tablist" aria-label={`${card.title} snippets`}>
        {card.snippets.map((snippet, snippetIndex) => {
          const tabId = snippetDomId(`${prefix}-tab`, snippet.id);
          const panelId = snippetDomId(`${prefix}-panel`, snippet.id);
          const active = snippet.id === selected.id;
          return (
            <button
              key={snippet.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              className={styles.snippetTab}
              onClick={() => setSelectedId(snippet.id)}
              onKeyDown={(event) => {
                const lastIndex = card.snippets.length - 1;
                let nextIndex: number | null = null;
                if (event.key === 'ArrowRight')
                  nextIndex = (snippetIndex + 1) % card.snippets.length;
                if (event.key === 'ArrowLeft')
                  nextIndex = (snippetIndex - 1 + card.snippets.length) % card.snippets.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = lastIndex;
                if (nextIndex === null) return;
                event.preventDefault();
                selectAndFocus(nextIndex);
              }}
            >
              {snippet.label}
            </button>
          );
        })}
      </div>

      <div className={styles.snippetDetails}>
        <span className={styles.snippetRole}>{selected.role}</span>
        <code className={styles.snippetId}>{selected.id}</code>
        <a
          className={styles.snippetSource}
          href={selected.sourceUrl}
          target="_blank"
          rel="noreferrer"
          title={selected.sourceLabel}
        >
          Source at {drawingGameCodeModel.publicationCommit.slice(0, 7)}
        </a>
      </div>

      <pre
        id={selectedPanelId}
        className={styles.codeBlock}
        role="tabpanel"
        aria-labelledby={selectedTabId}
      >
        <code data-testid={`snippet-code-${selected.id}`}>{selected.code}</code>
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
              {sample.cards.map((card, index) => (
                <CodeCard
                  key={`${sample.id}-${card.id}`}
                  card={card}
                  index={index}
                  sampleId={sample.id}
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
