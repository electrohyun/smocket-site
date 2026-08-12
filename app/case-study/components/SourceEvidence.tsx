import type { SourceExcerpt } from '../lib/model';
import styles from '../page.module.css';

export default function SourceEvidence({ excerpt }: { excerpt: SourceExcerpt }) {
  return (
    <figure className={styles.codeFigure}>
      <figcaption>
        <div><strong>{excerpt.label}</strong><code>{excerpt.path}:{excerpt.startLine}–{excerpt.endLine}</code></div>
        <p>{excerpt.responsibility}</p>
        <a href={excerpt.sourceUrl}>Open pinned source ↗</a>
      </figcaption>
      <pre><code>{excerpt.code}</code></pre>
    </figure>
  );
}
