/// <reference lib="webworker" />

import { registerDrawingGameApplication } from '@/app/preview/drawing-game/game/application';
import {
  ClientToServerEvents,
  GameServer,
  PREVIEW_GAME_URL,
  ServerToClientEvents,
} from '@/app/preview/drawing-game/game/events';
import { Server } from 'smocket';
import { attachSharedWorker } from 'smocket/shared-worker';

const io = new Server<ClientToServerEvents, ServerToClientEvents>(PREVIEW_GAME_URL);
registerDrawingGameApplication(io as unknown as GameServer);

const workerScope = globalThis as unknown as SharedWorkerGlobalScope;
workerScope.onconnect = (event) => {
  const port = event.ports[0];
  if (port) attachSharedWorker(io, port);
};
