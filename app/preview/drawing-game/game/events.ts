import type { StrokePayload } from '@/app/demo/lib/stroke';

export const PREVIEW_GAME_URL = 'http://preview.drawing-game.smocket.test';
export const PREVIEW_WORD = 'giraffe';
export const PLAYER_LABELS = ['A', 'B', 'C'] as const;

export type PlayerLabel = (typeof PLAYER_LABELS)[number];
export type GamePhase = 'waiting' | 'countdown' | 'active' | 'ended';
export type GameStroke = StrokePayload;

export interface Player {
  label: PlayerLabel;
  role: 'drawer' | 'guesser';
  socketId: string;
}

export interface SessionState {
  session: string;
  phase: GamePhase;
  players: Player[];
  countdownEndsAt?: number;
  winner?: PlayerLabel;
  word?: string;
}

export interface JoinResult {
  accepted: boolean;
  session: string;
  reason?: 'invalid-session' | 'invalid-player' | 'seat-occupied';
}

export interface ChatMessage {
  from: PlayerLabel;
  text: string;
}

export interface RoundResult {
  winner: PlayerLabel;
  word: string;
}

export interface ClientToServerEvents {
  join: (session: string, acknowledge: (result: JoinResult) => void) => void;
  stroke: (segment: GameStroke) => void;
  chat: (text: string) => void;
  guess: (text: string, acknowledge: (correct: boolean) => void) => void;
}

export interface ServerToClientEvents {
  'session-state': (state: SessionState) => void;
  'round-started': (result: { startedAt: number }) => void;
  word: (word: string) => void;
  stroke: (segment: GameStroke) => void;
  chat: (message: ChatMessage) => void;
  correct: (result: { word: string }) => void;
  announce: (result: RoundResult) => void;
}

export interface GameBroadcast {
  emit<Event extends keyof ServerToClientEvents>(
    event: Event,
    ...args: Parameters<ServerToClientEvents[Event]>
  ): void;
}

export interface GameSocket {
  readonly id: string;
  readonly handshake: { auth: Record<string, unknown> };
  join(session: string): void | Promise<void>;
  to(session: string): GameBroadcast;
  disconnect(force?: boolean): void;
  on(event: 'join', listener: ClientToServerEvents['join']): this;
  on(event: 'stroke', listener: ClientToServerEvents['stroke']): this;
  on(event: 'chat', listener: ClientToServerEvents['chat']): this;
  on(event: 'guess', listener: ClientToServerEvents['guess']): this;
  on(event: 'disconnect', listener: () => void): this;
}

export interface GameServer {
  on(event: 'connection', listener: (socket: GameSocket) => void): unknown;
  to(session: string): GameBroadcast;
}

export interface GameClient {
  readonly id?: string;
  readonly connected: boolean;
  on<Event extends keyof ServerToClientEvents>(
    event: Event,
    listener: ServerToClientEvents[Event],
  ): this;
  on(event: 'connect', listener: () => void): this;
  on(event: 'connect_error' | 'bridge_error', listener: (error: Error) => void): this;
  on(event: 'disconnect', listener: (reason: string) => void): this;
  emit<Event extends keyof ClientToServerEvents>(
    event: Event,
    ...args: Parameters<ClientToServerEvents[Event]>
  ): this;
  emitWithAck(event: 'join', session: string): Promise<JoinResult>;
  emitWithAck(event: 'guess', text: string): Promise<boolean>;
  disconnect(): this;
}
