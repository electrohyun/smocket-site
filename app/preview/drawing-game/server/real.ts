import type { Server as HttpServer } from 'node:http';
import { Server as SocketIoServer } from 'socket.io';
import {
  registerDrawingGameApplication,
  type DrawingGameOptions,
} from '../game/application';
import type {
  ClientToServerEvents,
  GameServer,
  ServerToClientEvents,
} from '../game/events';

/** Attach the same drawing-game application used by the SharedWorker to a real Socket.IO server. */
export function attachRealDrawingGameServer(
  httpServer: HttpServer,
  options: DrawingGameOptions = {},
): SocketIoServer<ClientToServerEvents, ServerToClientEvents> {
  const io = new SocketIoServer<ClientToServerEvents, ServerToClientEvents>(httpServer);
  registerDrawingGameApplication(io as unknown as GameServer, options);
  return io;
}
