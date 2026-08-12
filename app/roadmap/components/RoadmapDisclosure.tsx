'use client';

import { useRef } from 'react';
import type { RoadmapDisclosure as RoadmapDisclosureItem } from '../../../content/roadmap';
import styles from '../page.module.css';

function closeDisclosureGroup(current: HTMLDetailsElement, group?: string) {
  if (!group) return;

  document.querySelectorAll<HTMLDetailsElement>(`details[name="${group}"][open]`).forEach((item) => {
    if (item !== current) item.open = false;
  });
}

export default function RoadmapDisclosure({
  item,
  group,
}: {
  item: RoadmapDisclosureItem;
  group?: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={detailsRef} name={group} className={styles.disclosure}>
      <summary
        onClick={() => {
          if (detailsRef.current && !detailsRef.current.open) {
            closeDisclosureGroup(detailsRef.current, group);
          }
        }}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && detailsRef.current) {
            event.preventDefault();
            const willOpen = !detailsRef.current.open;
            if (willOpen) closeDisclosureGroup(detailsRef.current, group);
            detailsRef.current.open = willOpen;
          }
        }}
      >
        <span>
          <strong>{item.title}</strong>
          <small>{item.summary}</small>
        </span>
        <span className={styles.disclosureMark} aria-hidden="true">
          +
        </span>
      </summary>
      <div className={styles.disclosureBody}>
        <p>{item.detail}</p>
        <div className={styles.inlineLinks}>
          {item.links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}
