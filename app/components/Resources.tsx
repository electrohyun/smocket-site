import { resources } from '@/content/landing';
import styles from './Resources.module.css';

export default function Resources() {
  return (
    <section id={resources.id} data-section={resources.id} aria-labelledby="resources-title" className="section">
      <div className="inner">
        <h2 id="resources-title" className="h2">{resources.title}</h2>
        <p className="lead">{resources.desc}</p>
        <ul className={styles.grid}>
          {resources.links.map((link) => (
            <li key={link.label}>
              <a href={link.href}>
                <span>{link.label}</span>
                <small>{link.note}</small>
                <b aria-hidden="true">↗</b>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
