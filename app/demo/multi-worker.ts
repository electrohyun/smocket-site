import { Server } from 'smocket';
import { attachSharedWorker } from 'smocket/shared-worker';
import { registerMultiTabGameHandlers } from './lib/multi-application';
import {
  MULTI_DEMO_URL,
  type MultiClientToServerEvents,
  type MultiServerToClientEvents,
} from './lib/multi-events';

const io = new Server<MultiClientToServerEvents, MultiServerToClientEvents>(MULTI_DEMO_URL);
registerMultiTabGameHandlers(io);

const workerScope = globalThis as unknown as {
  onconnect: ((event: MessageEvent & { ports: readonly MessagePort[] }) => void) | null;
};

workerScope.onconnect = (event) => {
  const port = event.ports[0];
  if (port) attachSharedWorker(io, port);
};
