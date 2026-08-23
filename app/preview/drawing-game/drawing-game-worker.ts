/// <reference lib="webworker" />

import { Server } from 'smocket';
import { attachSharedWorker } from 'smocket/shared-worker';
import { registerDrawingGameApplication } from './game/application';
import {
  PREVIEW_GAME_URL,
  type ClientToServerEvents,
  type GameServer,
  type ServerToClientEvents,
} from './game/events';

const io = new Server<ClientToServerEvents, ServerToClientEvents>(PREVIEW_GAME_URL);
registerDrawingGameApplication(io as unknown as GameServer);

const workerScope = globalThis as unknown as SharedWorkerGlobalScope;
workerScope.onconnect = (event) => {
  const port = event.ports[0];
  if (port) attachSharedWorker(io, port);
};
