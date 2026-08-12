'use client';

import { useReducer } from 'react';
import { caseStudyCopy } from '../../../content/case-study';
import {
  filterTranscript,
  initialExplorerState,
  reduceExplorerState,
  type CaseStudyModel,
  type ExplorerAction,
  type StructuredCategoryId,
} from '../lib/model';
import pageStyles from '../page.module.css';
import styles from './ObservationExplorer.module.css';

function label(value: string): string {
  if (value === 'all') return 'All';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function EmptyDelivery() {
  return <span className={styles.none}>No delivery recorded</span>;
}

function StructuredPanel({ model, category }: { model: CaseStudyModel; category: StructuredCategoryId }) {
  const observation = model.observation;

  if (category === 'joins') {
    return (
      <ul className={styles.observationList}>
        {observation.joins.map((join) => (
          <li key={`${join.participantId}-${join.channel}`}>
            <strong>{join.participantId}</strong>
            <span>joined #{join.channel}</span>
            <code>
              ack {String(join.acknowledgement.accepted)} · #{join.acknowledgement.channel}
            </code>
          </li>
        ))}
      </ul>
    );
  }

  if (category === 'welcomes') {
    return (
      <div className={styles.recipientGrid}>
        {Object.entries(observation.welcomes).map(([participant, welcomes]) => (
          <article key={participant}>
            <h4>{participant}</h4>
            <ul>
              {welcomes.map((welcome) => (
                <li key={welcome.channel}>{welcome.text}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    );
  }

  if (category === 'message') {
    return (
      <div className={styles.recipientGrid}>
        {Object.entries(observation.messages).map(([participant, messages]) => (
          <article key={participant}>
            <h4>{participant}</h4>
            {messages.length ? (
              <ul>
                {messages.map((message) => (
                  <li key={`${message.channel}-${message.text}`}>
                    <strong>{message.from}</strong> in #{message.channel}: {message.text}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyDelivery />
            )}
          </article>
        ))}
      </div>
    );
  }

  if (category === 'authorization') {
    const actor = model.transcript.find((line) => line.category === 'authorization')?.participant;
    return (
      <div className={styles.decisionGrid}>
        <article>
          <p className={styles.miniLabel}>Non-moderator · {actor}</p>
          <strong>Rejected</strong>
          <code>accepted {String(observation.rejectedAnnouncement.accepted)}</code>
          <span>{observation.rejectedAnnouncement.reason}</span>
        </article>
        <article>
          <p className={styles.miniLabel}>Moderator acknowledgement</p>
          <strong>Accepted</strong>
          <code>accepted {String(observation.announcementAcknowledgement.accepted)}</code>
          <span>#{observation.announcementAcknowledgement.channels.join(' · #')}</span>
        </article>
      </div>
    );
  }

  if (category === 'announcement') {
    return (
      <div className={styles.recipientGrid}>
        {Object.entries(observation.announcements).map(([participant, announcements]) => (
          <article key={participant}>
            <h4>{participant}</h4>
            {announcements.length ? (
              <ul>
                {announcements.map((announcement) => (
                  <li key={`${participant}-${announcement.text}`}>
                    <strong>{announcement.from}</strong> to #
                    {announcement.channels.join(', #')}: {announcement.text}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyDelivery />
            )}
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.recipientGrid}>
      {Object.entries(observation.departures).map(([participant, departures]) => (
        <article key={participant}>
          <h4>{participant}</h4>
          {departures.length ? (
            <ul>
              {departures.map((departure) => (
                <li key={`${departure.channel}-${departure.participant}`}>
                  {departure.participant} left #{departure.channel}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyDelivery />
          )}
        </article>
      ))}
    </div>
  );
}

export default function ObservationExplorer({ model }: { model: CaseStudyModel }) {
  const [state, dispatch] = useReducer(
    (current: typeof initialExplorerState, action: ExplorerAction) =>
      reduceExplorerState(model, current, action),
    initialExplorerState,
  );
  const filteredTranscript = filterTranscript(
    model.transcript,
    state.participant,
    state.transcriptCategory,
  );
  const selectedTarget = model.targets.find((target) => target.id === state.targetId)!;

  return (
    <section className="section" aria-labelledby="result-title">
      <div className="inner">
        <h2 id="result-title" className="h2">
          {caseStudyCopy.result.title}
        </h2>
        <p className="lead">{caseStudyCopy.result.lead}</p>

        <div className={styles.targetPicker}>
          <div className={styles.buttonGroup} role="group" aria-label="Choose an approach to inspect">
            {model.targets.map((target) => (
              <button
                key={target.id}
                type="button"
                aria-pressed={state.targetId === target.id}
                onClick={() => dispatch({ type: 'select-target', value: target.id })}
              >
                Inspect {target.label}
              </button>
            ))}
          </div>
          <p className={styles.sharedNote}>
            <strong>{selectedTarget.label}</strong> is selected. The record stays the same because
            all three target observations match.
          </p>
        </div>

        <div className={styles.explorerGrid}>
          <div>
            <div className={styles.filterBlock}>
              <p id="participant-filter-label">Filter transcript by participant</p>
              <div
                className={styles.buttonGroup}
                role="group"
                aria-labelledby="participant-filter-label"
              >
                {model.participants.map((participant) => (
                  <button
                    key={participant}
                    type="button"
                    aria-pressed={state.participant === participant}
                    onClick={() => dispatch({ type: 'select-participant', value: participant })}
                  >
                    {label(participant)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterBlock}>
              <p id="event-filter-label">Filter transcript by event</p>
              <div
                className={styles.buttonGroup}
                role="group"
                aria-labelledby="event-filter-label"
              >
                {model.transcriptCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={state.transcriptCategory === category}
                    onClick={() =>
                      dispatch({ type: 'select-transcript-category', value: category })
                    }
                  >
                    {category === 'all' ? 'All events' : label(category)}
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.status} role="status" aria-live="polite">
              Showing {filteredTranscript.length} of {model.transcript.length} lines for{' '}
              {selectedTarget.label}.
            </p>

            {filteredTranscript.length ? (
              <ol className={pageStyles.transcript} aria-label="Filtered shared transcript">
                {filteredTranscript.map((line) => (
                  <li key={line.id}>
                    <span>{String(line.id + 1).padStart(2, '0')}</span>
                    <code>{line.text}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <div className={styles.empty} role="status">
                <p>No recorded line matches both filters.</p>
                <button type="button" onClick={() => dispatch({ type: 'reset-transcript' })}>
                  Show all transcript lines
                </button>
              </div>
            )}
          </div>

          <div className={styles.structured}>
            <p id="structured-label">Explore structured observations</p>
            <div
              className={styles.categoryList}
              role="group"
              aria-labelledby="structured-label"
            >
              {model.structuredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={state.structuredCategory === category.id}
                  aria-controls="structured-observation-panel"
                  onClick={() =>
                    dispatch({ type: 'select-structured-category', value: category.id })
                  }
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div
              id="structured-observation-panel"
              className={styles.structuredPanel}
              aria-live="polite"
            >
              <StructuredPanel model={model} category={state.structuredCategory} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
