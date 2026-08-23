import { createServer } from 'node:http';
import { Server as SocketIoServer } from 'socket.io';
import { io as createClient, type Socket } from 'socket.io-client';
import { describe, expect, it } from 'vitest';
import { registerMultiTabGameHandlers } from '../multi-application';
import type {
  MultiClientToServerEvents,
  MultiJoinResult,
  MultiSeat,
  MultiServer,
  MultiServerToClientEvents,
  MultiSessionState,
  MultiStrokePayload,
} from '../multi-events';

type Client = Socket<MultiServerToClientEvents, MultiClientToServerEvents>;

function waitForConnection(client: Client): Promise<void> {
  if (client.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
  });
}

function join(client: Client): Promise<MultiJoinResult> {
  return new Promise((resolve) => client.emit('join-session', resolve));
}

function close(io: SocketIoServer): Promise<void> {
  return new Promise((resolve) => io.close(() => resolve()));
}

describe('multi-tab application handler on the production Socket.IO target', () => {
  it('reuses the worker-safe handler without changing its events', async () => {
    const httpServer = createServer();
    const io = new SocketIoServer(httpServer);
    registerMultiTabGameHandlers(io as unknown as MultiServer, { countdownMs: 10 });
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const address = httpServer.address();
    if (!address || typeof address === 'string') throw new Error('missing Socket.IO address');

    const url = `http://127.0.0.1:${address.port}`;
    const clients = ([1, 2, 3] as const).map((seat: MultiSeat) =>
      createClient(url, { auth: { session: 'real-target', seat, presenceId: `seat-${seat}` } }),
    );
    const [drawer, guesserTwo, guesserThree] = clients;
    const states: MultiSessionState[] = [];
    drawer.on('session-state', (state) => states.push(state));

    try {
      await Promise.all(clients.map(waitForConnection));
      expect((await Promise.all(clients.map(join))).every((result) => result.accepted)).toBe(true);
      await expect.poll(() => states.at(-1)?.phase).toBe('active');

      const segment: MultiStrokePayload = { id: 7, pts: [[0.2, 0.3]], end: true };
      const delivered = new Promise<MultiStrokePayload>((resolve) => guesserTwo.once('stroke', resolve));
      drawer.emit('stroke', segment);
      await expect(delivered).resolves.toEqual(segment);

      const endings = clients.map((client) =>
        new Promise((resolve) => client.once('round-ended', resolve)),
      );
      const acknowledgement = await new Promise((resolve) =>
        guesserThree.emit('guess', 'giraffe', resolve),
      );
      expect(acknowledgement).toEqual({ accepted: true, correct: true });
      await Promise.all(endings);
    } finally {
      for (const client of clients) client.disconnect();
      await close(io);
    }
  });
});
