'use client';

import { useState } from 'react';
import DrawerView from './DrawerView';
import ObserverView from './ObserverView';
import SituationPanel from './SituationPanel';
import ModeSelector from './ModeSelector';

/* Holds which viewpoint is on screen and the panel's knobs, and swaps the two
 * views. Switching unmounts one view and mounts the other, and each view builds
 * its own round — so a switch is the same-url reset (`new Server(url)` overwriting
 * the registry, the previous round disposed in its teardown) that stage 3 verified.
 *
 * The word toggle and B's delay live here because the panel outlives a single
 * view; the observer reads them as props. */

type Viewpoint = 'drawer' | 'observer';

export default function Stage({
  initial = 'drawer',
  replay = false,
  initialDelay = 0,
}: {
  initial?: Viewpoint;
  replay?: boolean;
  initialDelay?: number;
}) {
  const [viewpoint, setViewpoint] = useState<Viewpoint>(initial);
  const [revealed, setRevealed] = useState(false);
  const [delayMs, setDelayMs] = useState(initialDelay);
  return (
    <>
      <ModeSelector active="single" />
      {viewpoint === 'drawer' ? (
        <DrawerView replay={replay} />
      ) : (
        <ObserverView revealed={revealed} delayMs={delayMs} />
      )}

      <SituationPanel
        viewpoint={viewpoint}
        onSwitch={() => setViewpoint((v) => (v === 'drawer' ? 'observer' : 'drawer'))}
        revealed={revealed}
        onReveal={setRevealed}
        delayMs={delayMs}
        onDelay={setDelayMs}
      />
    </>
  );
}
