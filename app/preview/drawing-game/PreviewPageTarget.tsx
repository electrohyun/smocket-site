'use client';

import { useEffect } from 'react';
import DemoBrand from '@/app/demo/components/DemoBrand';
import { useHandlerReload } from './connections/handler-reload';
import type { PlayerLabel } from './game/events';
import PreviewDrawingGame from './PreviewDrawingGame';

export default function PreviewPageTarget({
  session,
  player,
  updateUrl,
}: {
  session: string;
  player: PlayerLabel;
  updateUrl: boolean;
}) {
  useHandlerReload();

  useEffect(() => {
    if (!updateUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.set('session', session);
    url.searchParams.set('player', player);
    window.history.replaceState(null, '', url);
  }, [player, session, updateUrl]);

  return (
    <>
      <DemoBrand />
      <PreviewDrawingGame session={session} player={player} />
    </>
  );
}
