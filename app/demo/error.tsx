'use client';

import styles from './error.module.css';

/* The demo route's error boundary (기획 6단계 §3-2). A round is live JavaScript —
 * a real server, real sockets, all in the tab — so a throw would otherwise leave a
 * blank screen with no way back, which is the worst thing to meet mid-demo. This
 * catches it and offers the one recovery a self-contained demo needs: start over.
 * It wraps `/demo` alone; the landing has nothing to catch. */

export default function DemoError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className={styles.wrap} role="alert">
      <p className={styles.title}>The round hit a snag.</p>
      <p className={styles.sub}>
        Nothing left this tab — it all runs here. Start the round over.
      </p>
      <button type="button" className={styles.retry} onClick={reset}>
        restart
      </button>
    </div>
  );
}
