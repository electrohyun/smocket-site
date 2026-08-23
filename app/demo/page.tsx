import DemoBrand from './components/DemoBrand';
import Stage from './components/Stage';

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

/* The viewpoint and whether it replays are read here, on the server, so `Stage`
   takes plain props and needs no Suspense boundary around `useSearchParams`.
   `?view=observer` opens on the observer; `?replay` drives the drawer from the
   recording (기획 3·4단계). The in-app switch is a dev toggle until stage 5. */
export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initial = params.view === 'observer' ? 'observer' : 'drawer';
  const replay = 'replay' in params;
  const initialDelay = Number(params.delay) || 0;

  return (
    <>
      <DemoBrand />
      <Stage initial={initial} replay={replay} initialDelay={initialDelay} />
    </>
  );
}
