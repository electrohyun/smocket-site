import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from './application';
import type { Label } from './game';

export type GameClient = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Application client construction. The import above stays `socket.io-client`;
 * the Smocket target resolves that package name to `smocket-client`.
 */
export function createGameClient(url: string, label: Label): GameClient {
  return io(url, {
    auth: { label },
    forceNew: true,
    reconnection: false,
  });
}

export function waitForConnection(socket: GameClient): Promise<void> {
  if (socket.connected) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const connected = () => {
      socket.off('connect_error', failed);
      resolve();
    };
    const failed = (error: Error) => {
      socket.off('connect', connected);
      reject(error);
    };

    socket.once('connect', connected);
    socket.once('connect_error', failed);
  });
}
