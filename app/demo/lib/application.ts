import type { Server, Socket } from 'socket.io';
import { DRAWER, LABELS, ROOM, WORD, type Label } from './game';
import type { StrokePayload } from './stroke';

export interface JoinResult {
  accepted: boolean;
  room: string;
}

export interface ChatMessage {
  from: Label;
  text: string;
}

export interface RoundResult {
  winner: Label | null;
  word: string;
}

export interface ClientToServerEvents {
  join: (room: string, acknowledge: (result: JoinResult) => void) => void;
  word: () => void;
  stroke: (segment: StrokePayload) => void;
  chat: (text: string) => void;
  guess: (text: string, acknowledge: (correct: boolean) => void) => void;
  reveal: () => void;
}

export interface ServerToClientEvents {
  word: (word: string) => void;
  stroke: (segment: StrokePayload) => void;
  chat: (message: ChatMessage) => void;
  correct: (result: { word: string }) => void;
  announce: (result: RoundResult) => void;
}

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type GameServerSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface DeliveryCall {
  from?: Label;
  to: string[];
}

/** Optional observation only. It can wrap an emit, but never chooses recipients. */
export interface GameObserver {
  connected?(label: Label, socket: GameServerSocket): void;
  delivery?<T>(call: DeliveryCall, emit: () => T): T;
  acknowledgement?(label: Label, value: boolean): void;
}

export interface GameApplicationOptions {
  observer?: GameObserver;
}

function isLabel(value: unknown): value is Label {
  return typeof value === 'string' && (LABELS as readonly string[]).includes(value);
}

/**
 * The drawing/chat application's server code. Real Socket.IO and Smocket both
 * register this exact function; only construction and shutdown live in their
 * target bootstraps.
 */
export function registerGameHandlers(
  io: GameServer,
  { observer }: GameApplicationOptions = {},
): void {
  const deliver = <T>(call: DeliveryCall, emit: () => T): T =>
    observer?.delivery ? observer.delivery(call, emit) : emit();

  const announce = (winner: Label | null): void => {
    if (winner) {
      const winnerSocket = sockets.get(winner);
      if (winnerSocket) {
        deliver({ to: [winnerSocket.id] }, () =>
          io.to(winnerSocket.id).emit('correct', { word: WORD }),
        );
      }
    }

    deliver({ to: [ROOM] }, () => io.to(ROOM).emit('announce', { winner, word: WORD }));
  };

  const sockets = new Map<Label, GameServerSocket>();

  io.on('connection', (socket) => {
    const claimed = socket.handshake.auth.label;
    if (!isLabel(claimed)) {
      socket.disconnect(true);
      return;
    }

    const label = claimed;
    sockets.set(label, socket);
    observer?.connected?.(label, socket);

    socket.on('join', async (room, acknowledge) => {
      if (room !== ROOM) {
        acknowledge({ accepted: false, room });
        return;
      }

      await socket.join(room);
      acknowledge({ accepted: true, room });
    });

    socket.on('word', () => {
      if (label !== DRAWER) return;
      deliver({ to: [socket.id] }, () => io.to(socket.id).emit('word', WORD));
    });

    socket.on('stroke', (segment) => {
      deliver({ from: label, to: [ROOM] }, () =>
        socket.to(ROOM).emit('stroke', segment),
      );
    });

    socket.on('chat', (text) => {
      deliver({ to: [ROOM] }, () => io.to(ROOM).emit('chat', { from: label, text }));
    });

    socket.on('guess', (text, acknowledge) => {
      const correct = text === WORD;
      observer?.acknowledgement?.(label, correct);
      acknowledge(correct);

      if (correct) announce(label);
      else deliver({ to: [ROOM] }, () => io.to(ROOM).emit('chat', { from: label, text }));
    });

    socket.on('reveal', () => announce(null));

    socket.on('disconnect', () => {
      if (sockets.get(label) === socket) sockets.delete(label);
    });
  });
}
