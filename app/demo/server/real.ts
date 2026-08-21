import { createServer, type Server as HttpServer } from 'node:http';
import { Server as SocketIoServer } from 'socket.io';
import {
  registerGameHandlers,
  type ClientToServerEvents,
  type GameApplicationOptions,
  type ServerToClientEvents,
} from '../lib/application';

export interface RealDemoServer {
  httpServer: HttpServer;
  io: SocketIoServer<ClientToServerEvents, ServerToClientEvents>;
  url: string;
  close(): Promise<void>;
}

export interface RealDemoServerOptions extends GameApplicationOptions {
  hostname?: string;
  port?: number;
}

function listen(httpServer: HttpServer, port: number, hostname: string): Promise<void> {
  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, hostname, () => {
      httpServer.off('error', reject);
      resolve();
    });
  });
}

function close(io: SocketIoServer): Promise<void> {
  return new Promise((resolve, reject) => {
    io.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/** Node HTTP is the only transport bootstrap; all game handlers stay shared. */
export async function startRealDemoServer({
  hostname = '127.0.0.1',
  port = 0,
  observer,
}: RealDemoServerOptions = {}): Promise<RealDemoServer> {
  const httpServer = createServer();
  const io = new SocketIoServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: true },
  });
  registerGameHandlers(io, { observer });

  await listen(httpServer, port, hostname);
  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    await close(io);
    throw new Error('Socket.IO did not receive a TCP address');
  }

  let closePromise: Promise<void> | null = null;
  return {
    httpServer,
    io,
    url: `http://${hostname}:${address.port}`,
    close: () => (closePromise ??= close(io)),
  };
}
