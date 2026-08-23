import { Server as SmocketServer } from 'smocket';
import {
  registerGameHandlers,
  type ChatMessage,
  type GameServer,
  type JoinResult,
  type RoundResult,
} from '../application';
import type { GameClient, createGameClient as createClient } from '../client';
import { LABELS, ROOM, WORD, type Label } from '../game';
import type { StrokePayload } from '../stroke';
import { startRealDemoServer } from '../../server/real';

const MARKER_EVENT = 'demo:scenario-marker';

type CreateGameClient = typeof createClient;

interface RecordedEvent {
  event: 'stroke' | 'chat' | 'correct' | 'announce';
  payload: StrokePayload | ChatMessage | { word: string } | RoundResult;
}

interface ClientObservation {
  events: RecordedEvent[];
  marker(token: string): Promise<void>;
}

interface ScenarioApplication {
  url: string;
  mark(socketId: string, token: string): void;
  waitForDisconnect(label: Label): Promise<void>;
  close(): Promise<void>;
}

export interface ScenarioTarget {
  id: 'socket.io' | 'smocket';
  start(): Promise<ScenarioApplication> | ScenarioApplication;
}

export interface ScenarioObservation {
  connections: Array<{ label: Label; socketId: string }>;
  distinctSocketIds: boolean;
  joins: Array<{ label: Label; acknowledgement: JoinResult }>;
  events: Record<Label, RecordedEvent[]>;
  acknowledgements: Array<{ from: Label; value: boolean }>;
  deliveries: Array<{
    event: RecordedEvent['event'];
    payload: RecordedEvent['payload'];
    recipients: Label[];
    senderExcluded?: Label;
    disconnected?: Label[];
  }>;
  disconnect: {
    label: Label;
    serverObserved: boolean;
    connectedAfter: boolean;
    remaining: Label[];
  };
}

interface MarkerSocket {
  on(event: string, listener: (value: string) => void): void;
}

interface MarkerServer {
  on(event: 'connection', listener: (socket: TrackingSocket) => void): void;
  to(socketId: string): { emit(event: string, value: string): void };
}

interface TrackingSocket {
  handshake: { auth: Record<string, unknown> };
  once(event: 'disconnect', listener: () => void): void;
}

function labelFrom(socket: TrackingSocket): Label | null {
  const label = socket.handshake.auth.label;
  return typeof label === 'string' && (LABELS as readonly string[]).includes(label)
    ? (label as Label)
    : null;
}

function addLifecycleTracking(io: MarkerServer) {
  const disconnected = new Map<Label, Promise<void>>();

  io.on('connection', (socket) => {
    const label = labelFrom(socket);
    if (!label) return;
    disconnected.set(label, new Promise((resolve) => socket.once('disconnect', resolve)));
  });

  return (label: Label) => {
    const pending = disconnected.get(label);
    if (!pending) throw new Error(`no server-side connection was recorded for ${label}`);
    return pending;
  };
}

function scenarioApplication(
  io: MarkerServer,
  url: string,
  close: () => Promise<void>,
): ScenarioApplication {
  const waitForDisconnect = addLifecycleTracking(io);
  let closePromise: Promise<void> | null = null;

  return {
    url,
    mark: (socketId, token) => io.to(socketId).emit(MARKER_EVENT, token),
    waitForDisconnect,
    close: () => (closePromise ??= close()),
  };
}

export const realTarget: ScenarioTarget = {
  id: 'socket.io',
  async start() {
    const application = await startRealDemoServer();
    return scenarioApplication(
      application.io as unknown as MarkerServer,
      application.url,
      application.close,
    );
  },
};

let smocketOrigin = 0;

export const smocketTarget: ScenarioTarget = {
  id: 'smocket',
  start() {
    smocketOrigin += 1;
    const url = `http://demo-${smocketOrigin}.smocket.test`;
    const io = new SmocketServer(url);
    registerGameHandlers(io as unknown as GameServer);
    return scenarioApplication(
      io as unknown as MarkerServer,
      url,
      () => io.close(),
    );
  },
};

function observe(client: GameClient): ClientObservation {
  const events: RecordedEvent[] = [];
  const markerWaiters = new Map<string, () => void>();

  client.on('stroke', (payload) => events.push({ event: 'stroke', payload }));
  client.on('chat', (payload) => events.push({ event: 'chat', payload }));
  client.on('correct', (payload) => events.push({ event: 'correct', payload }));
  client.on('announce', (payload) => events.push({ event: 'announce', payload }));
  (client as unknown as MarkerSocket).on(MARKER_EVENT, (token) => {
    markerWaiters.get(token)?.();
    markerWaiters.delete(token);
  });

  return {
    events,
    marker(token) {
      return new Promise((resolve) => markerWaiters.set(token, resolve));
    },
  };
}

function connect(client: GameClient): Promise<void> {
  if (client.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
  });
}

function join(client: GameClient): Promise<JoinResult> {
  return new Promise((resolve) => client.emit('join', ROOM, resolve));
}

function guess(client: GameClient, text: string): Promise<boolean> {
  return new Promise((resolve) => client.emit('guess', text, resolve));
}

function recipients(
  observers: Record<Label, ClientObservation>,
  event: RecordedEvent['event'],
  matches: (payload: RecordedEvent['payload']) => boolean,
): Label[] {
  return LABELS.filter((label) =>
    observers[label].events.some((entry) => entry.event === event && matches(entry.payload)),
  );
}

async function mark(
  application: ScenarioApplication,
  clients: Record<Label, GameClient>,
  observers: Record<Label, ClientObservation>,
  labels: readonly Label[],
  token: string,
): Promise<void> {
  const received = labels.map((label) => observers[label].marker(token));
  for (const label of labels) {
    const socketId = clients[label].id;
    if (!socketId) throw new Error(`cannot mark disconnected client ${label}`);
    application.mark(socketId, token);
  }
  await Promise.all(received);
}

export async function runDualTargetScenario(
  target: ScenarioTarget,
  createGameClient: CreateGameClient,
): Promise<ScenarioObservation> {
  const application = await target.start();
  const clients = {} as Record<Label, GameClient>;

  try {
    for (const label of LABELS) clients[label] = createGameClient(application.url, label);

    const observers = Object.fromEntries(
      LABELS.map((label) => [label, observe(clients[label])]),
    ) as Record<Label, ClientObservation>;

    await Promise.all(LABELS.map((label) => connect(clients[label])));

    const actualIds = LABELS.map((label) => clients[label].id);
    if (actualIds.some((id) => !id)) throw new Error('a connected client has no socket id');
    const normalizedIds = new Map(actualIds.map((id, index) => [id, `sid_${LABELS[index]}`]));

    const joins: ScenarioObservation['joins'] = [];
    for (const label of LABELS) {
      const acknowledgement = await join(clients[label]);
      joins.push({ label, acknowledgement });
    }

    const firstStroke: StrokePayload = { id: 1, pts: [[0.1, 0.2], [0.3, 0.4]] };
    clients.A.emit('stroke', firstStroke);
    await mark(application, clients, observers, LABELS, 'after-first-stroke');

    const wrongText = 'zebra';
    const wrongAcknowledgement = await guess(clients.B, wrongText);
    await mark(application, clients, observers, LABELS, 'after-wrong-guess');

    const correctAcknowledgement = await guess(clients.C, WORD);
    await mark(application, clients, observers, LABELS, 'after-correct-guess');

    const serverDisconnected = application.waitForDisconnect('C');
    clients.C.disconnect();
    await serverDisconnected;

    const secondStroke: StrokePayload = { id: 2, pts: [[0.5, 0.6]], end: true };
    clients.A.emit('stroke', secondStroke);
    await mark(application, clients, observers, ['A', 'B'], 'after-disconnect-stroke');

    const wrongChat: ChatMessage = { from: 'B', text: wrongText };
    const correct: { word: string } = { word: WORD };
    const announcement: RoundResult = { winner: 'C', word: WORD };

    return {
      connections: LABELS.map((label, index) => ({
        label,
        socketId: normalizedIds.get(actualIds[index]) ?? 'missing',
      })),
      distinctSocketIds: new Set(actualIds).size === LABELS.length,
      joins,
      events: Object.fromEntries(
        LABELS.map((label) => [label, [...observers[label].events]]),
      ) as Record<Label, RecordedEvent[]>,
      acknowledgements: [
        { from: 'B', value: wrongAcknowledgement },
        { from: 'C', value: correctAcknowledgement },
      ],
      deliveries: [
        {
          event: 'stroke',
          payload: firstStroke,
          recipients: recipients(
            observers,
            'stroke',
            (payload) => (payload as StrokePayload).id === firstStroke.id,
          ),
          senderExcluded: 'A',
        },
        {
          event: 'chat',
          payload: wrongChat,
          recipients: recipients(
            observers,
            'chat',
            (payload) => (payload as ChatMessage).text === wrongText,
          ),
        },
        {
          event: 'correct',
          payload: correct,
          recipients: recipients(observers, 'correct', () => true),
        },
        {
          event: 'announce',
          payload: announcement,
          recipients: recipients(observers, 'announce', () => true),
        },
        {
          event: 'stroke',
          payload: secondStroke,
          recipients: recipients(
            observers,
            'stroke',
            (payload) => (payload as StrokePayload).id === secondStroke.id,
          ),
          senderExcluded: 'A',
          disconnected: ['C'],
        },
      ],
      disconnect: {
        label: 'C',
        serverObserved: true,
        connectedAfter: clients.C.connected,
        remaining: LABELS.filter((label) => clients[label].connected),
      },
    };
  } finally {
    for (const client of Object.values(clients)) {
      if (client.connected) client.disconnect();
    }
    await application.close();
  }
}
