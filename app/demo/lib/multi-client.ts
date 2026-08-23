import { connectSharedWorker } from 'smocket-client/shared-worker';
import type { SharedWorkerSocket } from 'smocket/shared-worker';
import {
  MULTI_DEMO_URL,
  type MultiClientToServerEvents,
  type MultiSeat,
  type MultiServerToClientEvents,
} from './multi-events';

export type MultiTabSocket = SharedWorkerSocket<
  MultiServerToClientEvents,
  MultiClientToServerEvents
>;

export const MULTI_WORKER_NAME = 'smocket-drawing-game-e1c166f-v1';

export interface MultiTabConnectionOptions {
  session: string;
  seat: MultiSeat;
  presenceId: string;
}

export function supportsSharedWorker(): boolean {
  return typeof SharedWorker === 'function';
}

/** Connect one page to the caller-owned, versioned drawing-game worker. */
export function createMultiTabClient({
  session,
  seat,
  presenceId,
}: MultiTabConnectionOptions): MultiTabSocket {
  if (!supportsSharedWorker()) throw new Error('SharedWorker is not supported in this browser.');

  const worker = new SharedWorker(new URL('../multi-worker.ts', import.meta.url), {
    name: MULTI_WORKER_NAME,
    type: 'module',
  });
  return connectSharedWorker<MultiServerToClientEvents, MultiClientToServerEvents>(worker.port, {
    url: MULTI_DEMO_URL,
    auth: { session, seat, presenceId },
  });
}
