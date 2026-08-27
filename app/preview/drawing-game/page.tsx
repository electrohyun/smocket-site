import { randomUUID } from 'node:crypto';
import type { PlayerLabel } from './game/events';
import PreviewPageTarget from './PreviewPageTarget';

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readPlayer(value: string | undefined): PlayerLabel {
  return value === 'B' || value === 'C' ? value : 'A';
}

export default async function DrawingGamePreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sessionParam = first(params.session);
  const requestedSession = sessionParam && SESSION_PATTERN.test(sessionParam) ? sessionParam : null;
  const playerParam = first(params.player);
  const player = readPlayer(playerParam);
  const session = requestedSession ?? `preview-${randomUUID().replaceAll('-', '').slice(0, 12)}`;

  return (
    <PreviewPageTarget
      session={session}
      player={player}
      updateUrl={!requestedSession || playerParam !== player}
    />
  );
}
