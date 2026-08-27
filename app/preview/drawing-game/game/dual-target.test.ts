import { createServer } from 'node:http';
import { Server as SmocketServer } from 'smocket';
import { io as createSmocketClient } from 'smocket-client';
import { io as createSocketIoClient } from 'socket.io-client';
import { describe, expect, it } from 'vitest';
import { attachRealDrawingGameServer } from '../server/real';
import { registerDrawingGameApplication } from './application';
import type {
  ChatMessage,
  ClientToServerEvents,
  GameServer,
  GameStroke,
  JoinResult,
  PlayerLabel,
  RoundResult,
  ServerToClientEvents,
  SessionState,
} from './events';

interface ScenarioClient {
  readonly id?: string;
  readonly connected: boolean;
  once(event: 'connect', listener: () => void): this;
  once(event: 'connect_error', listener: (error: Error) => void): this;
  once(
    event: 'stroke' | 'chat' | 'correct' | 'announce',
    listener: (payload: GameStroke | ChatMessage | { word: string } | RoundResult) => void,
  ): this;
  on(event: 'stroke', listener: ServerToClientEvents['stroke']): this;
  on(event: 'session-state', listener: ServerToClientEvents['session-state']): this;
  emit(event: 'join', session: string, acknowledge: (result: JoinResult) => void): this;
  emit(event: 'stroke', stroke: GameStroke): this;
  emit(event: 'guess', text: string, acknowledge: (correct: boolean) => void): this;
  disconnect(): this;
}

interface ScenarioTarget {
  createClient(player: PlayerLabel): ScenarioClient;
  close(): Promise<void>;
}

interface ScenarioObservation {
  distinctSocketIds: boolean;
  joins: boolean[];
  activePlayers: number[];
  strokeRecipients: PlayerLabel[];
  drawerReceivedOwnStroke: boolean;
  chatRecipients: PlayerLabel[];
  wrongGuessAcknowledged: boolean;
  correctGuessAcknowledged: boolean;
  correctRecipients: PlayerLabel[];
  announceRecipients: PlayerLabel[];
  endedPlayers: number[];
}

const PLAYERS = ['A', 'B', 'C'] as const;
let smocketOrigin = 0;

function waitForConnection(client: ScenarioClient): Promise<void> {
  if (client.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
  });
}

function waitForState(
  client: ScenarioClient,
  phase: SessionState['phase'],
): Promise<SessionState> {
  return new Promise((resolve) => {
    client.on('session-state', (state) => {
      if (state.phase === phase) resolve(state);
    });
  });
}

function join(client: ScenarioClient, session: string): Promise<JoinResult> {
  return new Promise((resolve) => client.emit('join', session, resolve));
}

function guess(client: ScenarioClient, text: string): Promise<boolean> {
  return new Promise((resolve) => client.emit('guess', text, resolve));
}

function once<Event extends 'stroke' | 'chat' | 'correct' | 'announce'>(
  client: ScenarioClient,
  event: Event,
): Promise<Parameters<ServerToClientEvents[Event]>[0]> {
  return new Promise((resolve) => {
    client.once(event, resolve as never);
  });
}

async function startSmocketTarget(): Promise<ScenarioTarget> {
  smocketOrigin += 1;
  const url = `http://preview-drawing-game-${smocketOrigin}.test`;
  const io = new SmocketServer<ClientToServerEvents, ServerToClientEvents>(url);
  registerDrawingGameApplication(io as unknown as GameServer, { countdownMs: 0 });
  return {
    createClient(player) {
      return createSmocketClient(url, {
        auth: { player, presenceId: `presence-${player}` },
        forceNew: true,
      }) as unknown as ScenarioClient;
    },
    close: () => io.close(),
  };
}

async function startSocketIoTarget(): Promise<ScenarioTarget> {
  const httpServer = createServer();
  const io = attachRealDrawingGameServer(httpServer, { countdownMs: 0 });
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const address = httpServer.address();
  if (!address || typeof address === 'string') throw new Error('missing Socket.IO address');
  const url = `http://127.0.0.1:${address.port}`;
  return {
    createClient(player) {
      return createSocketIoClient(url, {
        auth: { player, presenceId: `presence-${player}` },
        forceNew: true,
        reconnection: false,
      }) as unknown as ScenarioClient;
    },
    close: () => new Promise((resolve) => io.close(() => resolve())),
  };
}

async function observe(startTarget: () => Promise<ScenarioTarget>): Promise<ScenarioObservation> {
  const target = await startTarget();
  const clients = Object.fromEntries(
    PLAYERS.map((player) => [player, target.createClient(player)]),
  ) as Record<PlayerLabel, ScenarioClient>;
  const session = 'shared-handler';
  let drawerStrokeCount = 0;
  clients.A.on('stroke', () => {
    drawerStrokeCount += 1;
  });

  try {
    await Promise.all(PLAYERS.map((player) => waitForConnection(clients[player])));
    const active = PLAYERS.map((player) => waitForState(clients[player], 'active'));
    const joins = await Promise.all(PLAYERS.map((player) => join(clients[player], session)));
    const activeStates = await Promise.all(active);

    const stroke: GameStroke = { id: 1, pts: [[0.1, 0.2], [0.4, 0.5]], end: true };
    const strokeDeliveries = (['B', 'C'] as const).map(async (player) => {
      await once(clients[player], 'stroke');
      return player;
    });
    clients.A.emit('stroke', stroke);
    const strokeRecipients = await Promise.all(strokeDeliveries);

    const chatDeliveries = PLAYERS.map(async (player) => {
      const message = await once(clients[player], 'chat') as ChatMessage;
      expect(message).toEqual({ from: 'B', text: 'zebra' });
      return player;
    });
    const wrongGuessAcknowledged = await guess(clients.B, 'zebra');
    const chatRecipients = await Promise.all(chatDeliveries);

    const ended = PLAYERS.map((player) => waitForState(clients[player], 'ended'));
    const announcements = PLAYERS.map(async (player) => {
      const result = await once(clients[player], 'announce') as RoundResult;
      expect(result).toEqual({ winner: 'C', word: 'giraffe' });
      return player;
    });
    const correctDelivery = once(clients.C, 'correct').then(() => 'C' as const);
    const correctGuessAcknowledged = await guess(clients.C, 'giraffe');

    return {
      distinctSocketIds: new Set(PLAYERS.map((player) => clients[player].id)).size === 3,
      joins: joins.map((result) => result.accepted),
      activePlayers: activeStates.map((state) => state.players.length),
      strokeRecipients,
      drawerReceivedOwnStroke: drawerStrokeCount > 0,
      chatRecipients,
      wrongGuessAcknowledged,
      correctGuessAcknowledged,
      correctRecipients: [await correctDelivery],
      announceRecipients: await Promise.all(announcements),
      endedPlayers: (await Promise.all(ended)).map((state) => state.players.length),
    };
  } finally {
    for (const client of Object.values(clients)) client.disconnect();
    await target.close();
  }
}

const expected: ScenarioObservation = {
  distinctSocketIds: true,
  joins: [true, true, true],
  activePlayers: [3, 3, 3],
  strokeRecipients: ['B', 'C'],
  drawerReceivedOwnStroke: false,
  chatRecipients: ['A', 'B', 'C'],
  wrongGuessAcknowledged: false,
  correctGuessAcknowledged: true,
  correctRecipients: ['C'],
  announceRecipients: ['A', 'B', 'C'],
  endedPlayers: [3, 3, 3],
};

describe.sequential('the Preview drawing game on both server targets', () => {
  it('runs the complete three-client scenario in Smocket', async () => {
    await expect(observe(startSmocketTarget)).resolves.toEqual(expected);
  });

  it('runs the same application on a real Socket.IO server', async () => {
    await expect(observe(startSocketIoTarget)).resolves.toEqual(expected);
  });

  it('produces identical observations on both targets', async () => {
    const smocket = await observe(startSmocketTarget);
    const socketIo = await observe(startSocketIoTarget);
    expect(smocket).toEqual(socketIo);
  });
});
