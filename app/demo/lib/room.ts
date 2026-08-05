import { connect, Server } from 'smocket';
import { TraceAdapter } from './trace-adapter';
import { TraceStore } from './trace';
import type { StrokePayload } from './stroke';

/* One round of the drawing game, as socket traffic. There is no scoring, no
   answer checking beyond a string comparison, and no server authority — this is
   a demo, and what it is demonstrating is delivery (기획 §0).

   Every call goes through `trace.deliver`, which hands over the one thing
   nothing can observe: how the call was spelled. The rooms it names are checked
   against the rooms the adapter was actually asked to route, so a call form and
   its delivery cannot drift apart unnoticed (계획서 §1-1 규칙 4). */

export const DEMO_URL = 'http://localhost:4000';
export const ROOM = 'room-1';
export const WORD = '기린';

/** A draws, B and C guess. Fixed for one round; there is no rotation (기획 §1). */
export const LABELS = ['A', 'B', 'C'] as const;
export type Label = (typeof LABELS)[number];

export const DRAWER: Label = 'A';

export interface Round {
  trace: TraceStore;
  /** The server itself, for the views that broadcast outside these helpers. */
  io: Server;
  sids: Record<Label, string>;
  /** The word, to the drawer alone. */
  word(): void;
  /** One segment of a stroke, to everyone in the room but the drawer. */
  stroke(segment: StrokePayload): void;
  chat(from: Label, text: string): void;
  /** A guess, answered by an ack. A correct one also announces (기획 §3-4). */
  guess(from: Label, text: string): Promise<boolean>;
  /**
   * Listen on a client socket. A view receives what was delivered to it and
   * nothing else, which is what makes the word reaching only the drawer visible
   * rather than merely recorded.
   */
  on(label: Label, event: string, handler: (...args: never[]) => void): void;
  dispose(): void;
}

export async function createRound(): Promise<Round> {
  const trace = new TraceStore();
  const io = new Server(DEMO_URL);

  // Before any client connects: `io.adapter` installs a fresh adapter on every
  // namespace, so registering it late would throw away membership already made.
  io.adapter(() => new TraceAdapter(trace));

  const sids = {} as Record<Label, string>;
  const servers = {} as Record<Label, Awaited<ReturnType<typeof io.nextConnection>>>;
  const clients = {} as Record<Label, ReturnType<typeof connect>>;

  for (const label of LABELS) {
    const client = connect(DEMO_URL);
    const socket = await io.nextConnection();

    trace.name(socket.id, label);
    // Connect is a reserved event, so the outgoing catch-all never sees it and
    // this line has to be written here instead (계획서 §1-3).
    trace.lifecycle(`client ${label} connected   sid_${socket.id.slice(0, 4)}`);
    trace.watch(socket.id, socket);
    trace.watchClient(label, client);

    sids[label] = socket.id;
    servers[label] = socket;
    clients[label] = client;
  }

  for (const label of LABELS) await servers[label].join(ROOM);

  for (const label of LABELS) {
    servers[label].on('guess', (text: string, ack: (correct: boolean) => void) => {
      const correct = text === WORD;
      trace.ack(label, correct);
      ack(correct);
      if (correct) announce(label);
    });
  }

  /* The three deliveries a correct guess produces, which is the whole of the ack
     coverage in 기획 §7: the callback above, a targeted emit to whoever got it,
     and a broadcast telling the room. */
  function announce(winner: Label): void {
    trace.deliver({ to: [sids[winner]] }, () =>
      io.to(sids[winner]).emit('correct', { word: WORD }),
    );
    trace.deliver({ to: [ROOM] }, () => io.to(ROOM).emit('announce', { winner, word: WORD }));
  }

  let disposed = false;

  return {
    trace,
    io,
    sids,

    word: () => {
      // Through the server, not `servers.A.emit`: a socket's own emit bypasses the
      // adapter, so the routing would never reach the record (계획서 §1-1 규칙 5).
      trace.deliver({ to: [sids[DRAWER]] }, () => io.to(sids[DRAWER]).emit('word', WORD));
    },

    stroke: (segment) => {
      // `socket.to(room)` excludes the sender for free: the room's members minus
      // the sender's own id-room. That exclusion is why the drawer's own canvas
      // has to paint locally — the stroke it just sent never comes back to it.
      trace.deliver({ from: DRAWER, to: [ROOM] }, () =>
        servers[DRAWER].to(ROOM).emit('stroke', segment),
      );
    },

    chat: (from, text) => {
      trace.deliver({ to: [ROOM] }, () => io.to(ROOM).emit('chat', { from, text }));
    },

    guess: (from, text) =>
      new Promise<boolean>((resolve) => {
        clients[from].emit('guess', text, (correct: boolean) => resolve(correct));
      }),

    on: (label, event, handler) => clients[label].on(event, handler),

    // Idempotent, because the view switch tears a round down and the caller that
    // asked for it may not be the only one holding a handle (계획서 §1-4).
    dispose: () => {
      if (disposed) return;
      disposed = true;
      for (const label of LABELS) clients[label].disconnect();
    },
  };
}
