export const MULTI_DEMO_URL = 'http://multi-tab.drawing-game.smocket.test';
export const MULTI_WORD = 'giraffe';

export type MultiSeat = 1 | 2 | 3;
export type MultiPhase = 'waiting' | 'countdown' | 'active' | 'ended';

export interface MultiStrokePayload {
  id: number;
  pts: Array<[x: number, y: number]>;
  end?: true;
}

export interface MultiPlayer {
  seat: MultiSeat;
  role: 'drawer' | 'guesser';
  socketId: string;
}

export interface MultiSessionState {
  session: string;
  phase: MultiPhase;
  players: MultiPlayer[];
  countdownEndsAt?: number;
  winnerSeat?: MultiSeat;
  word?: string;
}

export interface MultiJoinResult {
  accepted: boolean;
  reason?: 'invalid-session' | 'invalid-seat' | 'seat-occupied';
  state?: MultiSessionState;
  strokes?: MultiStrokePayload[];
  word?: string;
}

export interface MultiGuessResult {
  accepted: boolean;
  correct: boolean;
  reason?: 'not-a-guesser' | 'round-not-active';
}

export interface MultiChatMessage {
  from: MultiSeat;
  text: string;
}

export interface MultiRoundResult {
  winnerSeat: MultiSeat;
  word: string;
}

export interface MultiClientToServerEvents {
  'join-session': (acknowledge: (result: MultiJoinResult) => void) => void;
  stroke: (segment: MultiStrokePayload) => void;
  guess: (text: string, acknowledge: (result: MultiGuessResult) => void) => void;
}

export interface MultiServerToClientEvents {
  'session-state': (state: MultiSessionState) => void;
  'round-started': (result: { startedAt: number }) => void;
  word: (word: string) => void;
  stroke: (segment: MultiStrokePayload) => void;
  chat: (message: MultiChatMessage) => void;
  'round-ended': (result: MultiRoundResult) => void;
}

export interface MultiSocket {
  readonly id: string;
  readonly handshake: { auth: Record<string, unknown> };
  join(room: string): void | Promise<void>;
  to(room: string): MultiBroadcast;
  disconnect(force?: boolean): void;
  on(event: 'join-session', listener: MultiClientToServerEvents['join-session']): this;
  on(event: 'stroke', listener: MultiClientToServerEvents['stroke']): this;
  on(event: 'guess', listener: MultiClientToServerEvents['guess']): this;
  on(event: 'disconnect', listener: () => void): this;
}

export interface MultiBroadcast {
  emit<Event extends keyof MultiServerToClientEvents>(
    event: Event,
    ...args: Parameters<MultiServerToClientEvents[Event]>
  ): void;
}

export interface MultiServer {
  on(event: 'connection', listener: (socket: MultiSocket) => void): unknown;
  to(room: string): MultiBroadcast;
}
