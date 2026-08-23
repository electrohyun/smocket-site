import { DelayingAdapter, Server as SmocketServer } from 'smocket';
import {
  registerGameHandlers,
  type GameObserver,
  type GameServer,
  type JoinResult,
} from './application';
import { createGameClient, waitForConnection, type GameClient } from './client';
import { TraceAdapter } from './trace-adapter';
import { TraceStore } from './trace';
import { DRAWER, LABELS, ROOM, type Label } from './game';
import type { StrokePayload } from './stroke';

export const DEMO_URL =
  process.env.NEXT_PUBLIC_DEMO_SOCKET_URL ?? 'http://127.0.0.1:4000';

const USE_SMOCKET = process.env.NEXT_PUBLIC_DEMO_SOCKET_TARGET !== 'real';

export { DRAWER, LABELS, ROOM, WORD, type Label } from './game';

export interface Round {
  trace: TraceStore;
  /** Present for the in-browser Smocket target; the Real server is a separate process. */
  io: GameServer | null;
  sids: Record<Label, string>;
  /** The word, requested by A and targeted back to A by the server. */
  word(): void;
  /** A emits a segment; the server excludes A from its room broadcast. */
  stroke(segment: StrokePayload): void;
  /** The named participant emits chat through its own client socket. */
  chat(from: Label, text: string): void;
  /** The named participant emits a guess and resolves with the server acknowledgement. */
  guess(from: Label, text: string): Promise<boolean>;
  /** A asks the server to reveal the word to the room with no winner. */
  reveal(): void;
  /** Smocket-only delivery observation control; a no-op against the Real server. */
  setDelay(label: Label, ms: number): void;
  on(label: Label, event: string, handler: (...args: never[]) => void): void;
  dispose(): Promise<void>;
}

function join(client: GameClient): Promise<JoinResult> {
  return new Promise((resolve) => client.emit('join', ROOM, resolve));
}

/**
 * Creates the three independent application clients used by the existing UI.
 * In the default build `socket.io-client` is aliased to `smocket-client` and a
 * Smocket server is bootstrapped in-process. In the Real build the same client
 * module connects to the separately started Node Socket.IO server.
 */
export async function createRound(): Promise<Round> {
  const trace = new TraceStore();
  let adapter: DelayingAdapter | null = null;
  let smocket: SmocketServer | null = null;

  const observer: GameObserver = {
    connected(label, socket) {
      trace.name(socket.id, label);
      trace.lifecycle(`client ${label} connected   sid_${socket.id.slice(0, 4)}`);
      trace.watch(socket.id, socket);
    },
    delivery: (call, emit) => trace.deliver(call, emit),
    acknowledgement: (label, value) => trace.ack(label, value),
  };

  if (USE_SMOCKET) {
    smocket = new SmocketServer(DEMO_URL);
    smocket.adapter(() => (adapter = new TraceAdapter(trace)));
    // Smocket implements the Socket.IO event surface used by the application;
    // constructing and closing it are the only target-specific server steps.
    registerGameHandlers(smocket as unknown as GameServer, { observer });
  }

  const clients = {} as Record<Label, GameClient>;
  const sids = {} as Record<Label, string>;

  try {
    for (const label of LABELS) {
      const client = createGameClient(DEMO_URL, label);
      clients[label] = client;
      trace.watchClient(label, client);
      await waitForConnection(client);

      if (!client.id) throw new Error(`client ${label} connected without a socket id`);
      sids[label] = client.id;

      const result = await join(client);
      if (!result.accepted) throw new Error(`client ${label} could not join ${ROOM}`);
    }
  } catch (error) {
    for (const client of Object.values(clients)) client?.disconnect();
    if (smocket) await smocket.close();
    throw error;
  }

  let disposePromise: Promise<void> | null = null;

  return {
    trace,
    io: smocket as unknown as GameServer | null,
    sids,

    word: () => clients[DRAWER].emit('word'),
    stroke: (segment) => clients[DRAWER].emit('stroke', segment),
    chat: (from, text) => clients[from].emit('chat', text),
    guess: (from, text) =>
      new Promise<boolean>((resolve) => clients[from].emit('guess', text, resolve)),
    reveal: () => clients[DRAWER].emit('reveal'),
    setDelay: (label, ms) => adapter?.setDelay(sids[label], ms),
    on: (label, event, handler) =>
      (
        clients[label] as unknown as {
          on(name: string, listener: (...args: never[]) => void): void;
        }
      ).on(event, handler),
    dispose: () => {
      if (disposePromise) return disposePromise;
      for (const client of Object.values(clients)) client.disconnect();
      disposePromise = smocket ? smocket.close() : Promise.resolve();
      return disposePromise;
    },
  };
}
