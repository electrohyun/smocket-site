'use client';

import { useState } from 'react';
import DrawerView from './DrawerView';
import ObserverView from './ObserverView';
import styles from './Stage.module.css';

/* Holds which viewpoint is on screen and swaps the two. Switching unmounts one
 * view and mounts the other, and each view builds its own round — so a switch is
 * the same-url reset (`new Server(url)` overwriting the registry, the previous
 * round disposed in its teardown) that stage 3 verified.
 *
 * The control here is a plain dev toggle. The real one — the situation panel that
 * turns viewpoints and reveals the word — is stage 5; this stage only needs the
 * two views to exist and the switch between them to hold up (기획 4단계 §7). */

type Viewpoint = 'drawer' | 'observer';

export default function Stage({
  initial = 'drawer',
  replay = false,
}: {
  initial?: Viewpoint;
  replay?: boolean;
}) {
  const [viewpoint, setViewpoint] = useState<Viewpoint>(initial);

  return (
    <>
      {viewpoint === 'drawer' ? <DrawerView replay={replay} /> : <ObserverView />}
      <button
        type="button"
        className={styles.switch}
        onClick={() => setViewpoint((v) => (v === 'drawer' ? 'observer' : 'drawer'))}
      >
        {viewpoint === 'drawer' ? 'observer →' : '← drawer'}
      </button>
    </>
  );
}
