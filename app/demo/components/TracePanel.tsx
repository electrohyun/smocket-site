'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import EventCall from '../../components/EventCall';
import { fold, type FoldedLine } from '../lib/fold';
import {
  formatAck,
  formatCall,
  formatInbound,
  formatMembership,
  type TraceStore,
} from '../lib/trace';
import styles from './TracePanel.module.css';

/* The delivery record, top right (기획 §4).
 *
 * Every socket message in this demo lands here, including the ones the user
 * fires. The store is an append-only log and this is the only thing that folds
 * it, so nothing on screen can go missing from the record itself. */

interface Props {
  store: TraceStore;
  /** Hide the word in `emit('word', …)` — the observer is not supposed to know it. */
  maskWord?: boolean;
}

export default function TracePanel({ store, maskWord = false }: Props) {
  const lines = useSyncExternalStore(
    (onChange) => store.subscribe(onChange),
    () => store.lines(),
    () => store.lines(),
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lines]);

  const folded = fold(lines);

  return (
    <aside className={styles.panel} aria-label="Delivery record">
      <header className={styles.head}>
        <span className={styles.title}>delivery</span>
        <ul className={styles.legend}>
          {(['A', 'B', 'C'] as const).map((label) => (
            <li key={label} className={styles.chip} data-socket={label}>
              {label}
            </li>
          ))}
        </ul>
      </header>

      <div className={styles.log} ref={scrollRef}>
        {folded.map((entry, index) => (
          <Row key={index} entry={entry} maskWord={maskWord} />
        ))}
      </div>
    </aside>
  );
}

function Row({
  entry,
  maskWord,
}: {
  entry: FoldedLine;
  maskWord: boolean;
}) {
  const { line, count } = entry;

  if (line.kind === 'delivery') {
    return (
      <div className={styles.row}>
        <div className={styles.call}>
          <EventCall code={formatCall(line, { maskWord })} />
          {count > 1 && <span className={styles.count}> ×{count}</span>}
        </div>
        <div className={styles.reach}>
          <span aria-hidden="true">→ </span>
          <Sockets labels={line.reached} />
          {line.excluded.length > 0 && (
            <span className={styles.except}>
              {'  (except '}
              <Sockets labels={line.excluded} />
              {')'}
            </span>
          )}
        </div>
        {line.mismatch && <div className={styles.mismatch}>!! {line.mismatch}</div>}
      </div>
    );
  }

  if (line.kind === 'inbound') {
    return (
      <div className={styles.row}>
        <div className={styles.call}>
          <EventCall code={formatInbound(line, { maskWord })} />
          {count > 1 && <span className={styles.count}> ×{count}</span>}
        </div>
        <div className={styles.reach}>→ server</div>
      </div>
    );
  }

  // The ack points the other way and is dimmed, so it never reads as one of the
  // routed deliveries above it (계획서 §1-2).
  if (line.kind === 'ack') {
    return <div className={`${styles.row} ${styles.ack}`}>{formatAck(line)}</div>;
  }

  if (line.kind === 'membership') {
    return <div className={`${styles.row} ${styles.note}`}>{formatMembership(line)}</div>;
  }

  return <div className={`${styles.row} ${styles.note}`}>{line.text}</div>;
}

function Sockets({ labels }: { labels: string[] }) {
  return (
    <>
      {labels.map((label, index) => (
        <span key={label}>
          {index > 0 && ', '}
          <span className={styles.socket} data-socket={label}>
            {label}
          </span>
        </span>
      ))}
    </>
  );
}
