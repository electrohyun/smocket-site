import DemoBrand from '../components/DemoBrand';
import MultiTabView from '../components/MultiTabView';
import type { MultiSeat } from '../lib/multi-events';
import { randomUUID } from 'node:crypto';

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readSeat(value: string | undefined): MultiSeat {
  return value === '2' ? 2 : value === '3' ? 3 : 1;
}

export default async function MultiTabDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sessionParam = first(params.session);
  const requestedSession = sessionParam && SESSION_PATTERN.test(sessionParam) ? sessionParam : null;
  const seat = readSeat(first(params.seat));
  const recording = first(params.recording) === '1';
  const session = requestedSession ?? `${recording ? 'recording' : 'demo'}-${randomUUID().replaceAll('-', '').slice(0, 12)}`;

  return (
    <>
      <DemoBrand />
      <MultiTabView session={session} updateSessionUrl={!requestedSession} seat={seat} recording={recording} />
    </>
  );
}
