import { page } from '@/content/demo';
import DrawerView from './components/DrawerView';
import styles from './page.module.css';

/* Stage 2 builds the drawer's viewpoint. The observer's, the recording engine,
   and the control panel come after it.
 *
 * This stays a server component and `DrawerView` carries `'use client'`, so the
 * client bundle — smocket included — is caged in the demo and never reaches the
 * landing (기획 §8).
 *
 * A plain <img> for the same reason the landing uses one: image optimisation is
 * off (pnpm-workspace.yaml), and 기획 §8 wants the demo making no request the
 * network tab has to explain. */

export default function DemoPage() {
  return (
    <>
      <header className={styles.brand}>
        <img
          className={styles.mascot}
          src={page.mascot.src}
          alt={page.mascot.alt}
          width={26}
          height={26}
        />
        <span className={styles.wordmark}>{page.wordmark}</span>
      </header>

      <DrawerView />
    </>
  );
}
