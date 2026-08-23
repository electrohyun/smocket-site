import { registerDrawingGameHandler } from './game-handler';
import {
  DrawingGameState,
  type GameActions,
  type GuessAction,
  type JoinAction,
  type SessionRecord,
} from './game-state';
import {
  PREVIEW_WORD,
  type GameServer,
  type GameSocket,
  type GameStroke,
  type PlayerLabel,
} from './events';

export interface DrawingGameOptions {
  countdownMs?: number;
  now?: () => number;
}

function socketPlayer(socket: GameSocket): PlayerLabel | null {
  const value = socket.handshake.auth.player;
  return value === 'A' || value === 'B' || value === 'C' ? value : null;
}

/** Worker-safe game state and connection lifecycle for the recording Preview. */
export function registerDrawingGameApplication(
  io: GameServer,
  { countdownMs = 3000, now = Date.now }: DrawingGameOptions = {},
): void {
  const state = new DrawingGameState();

  const publish = (session: string, record: SessionRecord): void => {
    io.to(session).emit('session-state', state.snapshot(session, record));
  };

  const startRound = (session: string, record: SessionRecord): void => {
    if (record.phase !== 'countdown' || record.players.size !== 3) return;
    record.countdownTimer = undefined;
    record.countdownEndsAt = undefined;
    record.phase = 'active';
    publish(session, record);
    io.to(session).emit('round-started', { startedAt: now() });
    const drawer = record.players.get('A');
    if (drawer) io.to(drawer.socket.id).emit('word', PREVIEW_WORD);
  };

  const resetCountdown = (session: string, record: SessionRecord): void => {
    if (record.countdownTimer) clearTimeout(record.countdownTimer);
    record.countdownTimer = undefined;
    record.countdownEndsAt = undefined;
    record.phase = 'waiting';
    publish(session, record);
  };

  const startCountdown = (session: string, record: SessionRecord): void => {
    if (record.phase !== 'waiting' || record.players.size !== 3) return;
    record.phase = 'countdown';
    record.countdownEndsAt = now() + countdownMs;
    publish(session, record);
    if (countdownMs === 0) startRound(session, record);
    else record.countdownTimer = setTimeout(() => startRound(session, record), countdownMs);
  };

  io.on('connection', (socket) => {
    const actions: GameActions = {
      join(current, session): JoinAction {
        return state.join(current, session);
      },
      joined(action): void {
        if (!action.accepted || !action.record) return;
        action.replaced?.disconnect(true);
        for (const stroke of action.record.strokes) io.to(action.socket.id).emit('stroke', stroke);
        if (socketPlayer(action.socket) === 'A' && action.record.phase === 'active') {
          io.to(action.socket.id).emit('word', PREVIEW_WORD);
        }
        publish(action.session, action.record);
        startCountdown(action.session, action.record);
      },
      stroke(current, segment): string | null {
        return state.rememberStroke(current, segment as GameStroke);
      },
      chat(current, text) {
        return state.chat(current, text);
      },
      guess(current, text): GuessAction {
        return state.guess(current, text);
      },
      guessed(action): void {
        if (!action.round) return;
        const record = state.sessions.get(action.session);
        if (record) publish(action.session, record);
      },
      disconnect(current): void {
        const departed = state.disconnect(current);
        if (!departed?.record) return;
        if (departed.record.phase === 'countdown') {
          resetCountdown(departed.session, departed.record);
        } else {
          publish(departed.session, departed.record);
        }
      },
    };
    registerDrawingGameHandler(io, socket, actions);
  });
}
