import { Server } from 'smocket';
import { io as createClient, type Socket } from 'smocket-client';
import { afterEach, describe, expect, it } from 'vitest';
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

let origin = 0;
let server: Server | null = null;
let clients: Client[] = [];

afterEach(async () => {
  for (const client of clients) client.disconnect();
  clients = [];
  if (server) await server.close();
  server = null;
});

function connect(session: string, seat: MultiSeat, presenceId = `presence-${seat}`): Client {
  const url = `http://multi-application-${origin}.test`;
  const client = createClient(url, {
    auth: { session, seat, presenceId },
    forceNew: true,
  }) as Client;
  clients.push(client);
  return client;
}

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

function guess(client: Client, text: string) {
  return new Promise<Parameters<MultiClientToServerEvents['guess']>[1] extends (value: infer Result) => void ? Result : never>((resolve) => client.emit('guess', text, resolve));
}

async function startApplication(countdownMs = 20) {
  origin += 1;
  const url = `http://multi-application-${origin}.test`;
  server = new Server(url);
  registerMultiTabGameHandlers(server as unknown as MultiServer, { countdownMs });
}

describe('multi-tab drawing application', () => {
  it('shares countdown, strokes, acknowledgement, ending, and departure across three clients', async () => {
    await startApplication();
    const session = 'round-one';
    const [drawer, guesserTwo, guesserThree] = [
      connect(session, 1),
      connect(session, 2),
      connect(session, 3),
    ];
    const states: MultiSessionState[] = [];
    const words: string[] = [];
    const strokesTwo: MultiStrokePayload[] = [];
    const strokesThree: MultiStrokePayload[] = [];
    const endings = { one: 0, two: 0, three: 0 };

    drawer.on('session-state', (state) => states.push(state));
    drawer.on('word', (word) => words.push(word));
    guesserTwo.on('stroke', (segment) => strokesTwo.push(segment));
    guesserThree.on('stroke', (segment) => strokesThree.push(segment));
    drawer.on('round-ended', () => (endings.one += 1));
    guesserTwo.on('round-ended', () => (endings.two += 1));
    guesserThree.on('round-ended', () => (endings.three += 1));

    await Promise.all([drawer, guesserTwo, guesserThree].map(waitForConnection));
    const joins = await Promise.all([drawer, guesserTwo, guesserThree].map(join));

    expect(joins.every((result) => result.accepted)).toBe(true);
    expect(new Set([drawer.id, guesserTwo.id, guesserThree.id])).toHaveLength(3);
    await expect.poll(() => states.some((state) => state.phase === 'countdown')).toBe(true);
    await expect.poll(() => states.at(-1)?.phase).toBe('active');
    expect(words).toEqual(['giraffe']);

    const segment: MultiStrokePayload = { id: 1, pts: [[0.1, 0.2], [0.3, 0.4]], end: true };
    drawer.emit('stroke', segment);
    await expect.poll(() => strokesTwo).toEqual([segment]);
    await expect.poll(() => strokesThree).toEqual([segment]);

    const acknowledgement = await guess(guesserThree, 'giraffe');
    expect(acknowledgement).toEqual({ accepted: true, correct: true });
    await expect.poll(() => endings).toEqual({ one: 1, two: 1, three: 1 });
    await expect.poll(() => states.at(-1)?.phase).toBe('ended');

    guesserThree.disconnect();
    await expect.poll(() => states.at(-1)?.players.map((player) => player.seat)).toEqual([1, 2]);

    const returnedThree = connect(session, 3, 'returned-seat-three');
    await waitForConnection(returnedThree);
    expect(await join(returnedThree)).toMatchObject({ accepted: true });
    await expect.poll(() => states.at(-1)?.players.map((player) => player.seat)).toEqual([1, 2, 3]);
  });

  it('replaces a reloaded presence but rejects a different tab claiming an occupied seat', async () => {
    await startApplication(1000);
    const first = connect('seat-lifecycle', 1, 'stable-presence');
    await waitForConnection(first);
    expect(await join(first)).toMatchObject({ accepted: true });

    const intruder = connect('seat-lifecycle', 1, 'other-presence');
    await waitForConnection(intruder);
    expect(await join(intruder)).toEqual({ accepted: false, reason: 'seat-occupied' });

    const replacement = connect('seat-lifecycle', 1, 'stable-presence');
    await waitForConnection(replacement);
    const replaced = await join(replacement);

    expect(replaced.accepted).toBe(true);
    await expect.poll(() => first.connected).toBe(false);
    expect(replaced.state?.players).toHaveLength(1);
    expect(replaced.state?.players[0].socketId).toBe(replacement.id);
  });

  it('keeps otherwise identical seats isolated by session room', async () => {
    await startApplication(1000);
    const left = connect('left-session', 1, 'left');
    const right = connect('right-session', 1, 'right');
    const rightStates: MultiSessionState[] = [];
    right.on('session-state', (state) => rightStates.push(state));

    await Promise.all([left, right].map(waitForConnection));
    await Promise.all([join(left), join(right)]);

    expect(rightStates.at(-1)?.session).toBe('right-session');
    expect(rightStates.at(-1)?.players).toHaveLength(1);
    expect(rightStates.at(-1)?.players[0].socketId).toBe(right.id);
  });
});
