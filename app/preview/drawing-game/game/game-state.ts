import {
  PLAYER_LABELS,
  PREVIEW_WORD,
  type ChatMessage,
  type GamePhase,
  type GameSocket,
  type GameStroke,
  type JoinResult,
  type PlayerLabel,
  type RoundResult,
  type SessionState,
} from './events';

interface Participant {
  socket: GameSocket;
  presenceId: string;
}

export interface SessionRecord {
  phase: GamePhase;
  players: Map<PlayerLabel, Participant>;
  strokes: GameStroke[];
  countdownEndsAt?: number;
  countdownTimer?: ReturnType<typeof setTimeout>;
  winner?: PlayerLabel;
}

interface Membership {
  session: string;
  label: PlayerLabel;
}

export interface JoinAction {
  accepted: boolean;
  result: JoinResult;
  session: string;
  socket: GameSocket;
  record?: SessionRecord;
  replaced?: GameSocket;
}

export interface GuessAction {
  correct: boolean;
  session: string;
  chat?: ChatMessage;
  round?: RoundResult;
}

export interface GameActions {
  join(socket: GameSocket, session: string): JoinAction;
  joined(action: JoinAction): void;
  stroke(socket: GameSocket, segment: GameStroke): string | null;
  chat(socket: GameSocket, text: string): { session: string; message: ChatMessage } | null;
  guess(socket: GameSocket, text: string): GuessAction;
  guessed(action: GuessAction): void;
  disconnect(socket: GameSocket): void;
}

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function playerFrom(socket: GameSocket): PlayerLabel | null {
  const value = socket.handshake.auth.player;
  return value === 'A' || value === 'B' || value === 'C' ? value : null;
}

function presenceFrom(socket: GameSocket): string {
  const value = socket.handshake.auth.presenceId;
  return typeof value === 'string' && value.trim() ? value.slice(0, 128) : socket.id;
}

export class DrawingGameState {
  readonly sessions = new Map<string, SessionRecord>();
  readonly memberships = new Map<string, Membership>();

  getSession(session: string): SessionRecord {
    const current = this.sessions.get(session);
    if (current) return current;
    const created: SessionRecord = { phase: 'waiting', players: new Map(), strokes: [] };
    this.sessions.set(session, created);
    return created;
  }

  snapshot(session: string, record = this.getSession(session)): SessionState {
    return {
      session,
      phase: record.phase,
      players: PLAYER_LABELS.flatMap((label) => {
        const participant = record.players.get(label);
        return participant
          ? [{
              label,
              role: label === 'A' ? ('drawer' as const) : ('guesser' as const),
              socketId: participant.socket.id,
            }]
          : [];
      }),
      ...(record.countdownEndsAt === undefined ? {} : { countdownEndsAt: record.countdownEndsAt }),
      ...(record.winner === undefined ? {} : { winner: record.winner }),
      ...(record.phase === 'ended' ? { word: PREVIEW_WORD } : {}),
    };
  }

  join(socket: GameSocket, session: string): JoinAction {
    if (!SESSION_PATTERN.test(session)) {
      return {
        accepted: false,
        result: { accepted: false, session, reason: 'invalid-session' },
        session,
        socket,
      };
    }
    const label = playerFrom(socket);
    if (!label) {
      return {
        accepted: false,
        result: { accepted: false, session, reason: 'invalid-player' },
        session,
        socket,
      };
    }
    const existing = this.memberships.get(socket.id);
    if (existing) {
      return {
        accepted: true,
        result: { accepted: true, session: existing.session },
        session: existing.session,
        socket,
        record: this.getSession(existing.session),
      };
    }

    const record = this.getSession(session);
    const occupied = record.players.get(label);
    const presenceId = presenceFrom(socket);
    if (occupied && occupied.presenceId !== presenceId) {
      return {
        accepted: false,
        result: { accepted: false, session, reason: 'seat-occupied' },
        session,
        socket,
      };
    }

    record.players.set(label, { socket, presenceId });
    this.memberships.set(socket.id, { session, label });
    if (occupied) this.memberships.delete(occupied.socket.id);
    return {
      accepted: true,
      result: { accepted: true, session },
      session,
      socket,
      record,
      ...(occupied && occupied.socket.id !== socket.id ? { replaced: occupied.socket } : {}),
    };
  }

  active(socket: GameSocket, role?: 'drawer' | 'guesser'): Membership | null {
    const membership = this.memberships.get(socket.id);
    if (!membership) return null;
    const record = this.sessions.get(membership.session);
    const canFinishStroke = role === 'drawer' && record?.phase === 'ended';
    if (record?.phase !== 'active' && !canFinishStroke) return null;
    if (record.players.get(membership.label)?.socket.id !== socket.id) return null;
    if (role === 'drawer' && membership.label !== 'A') return null;
    if (role === 'guesser' && membership.label === 'A') return null;
    return membership;
  }

  rememberStroke(socket: GameSocket, segment: GameStroke): string | null {
    const player = this.active(socket, 'drawer');
    if (!player) return null;
    this.sessions.get(player.session)?.strokes.push(segment);
    return player.session;
  }

  chat(socket: GameSocket, text: string): { session: string; message: ChatMessage } | null {
    const player = this.active(socket);
    const clean = text.trim();
    return player && clean
      ? { session: player.session, message: { from: player.label, text: clean } }
      : null;
  }

  guess(socket: GameSocket, text: string): GuessAction {
    const player = this.active(socket, 'guesser');
    const guess = text.trim();
    if (!player || !guess) return { correct: false, session: '' };
    const correct = guess.toLowerCase() === PREVIEW_WORD;
    if (!correct) {
      return { correct, session: player.session, chat: { from: player.label, text: guess } };
    }
    const record = this.sessions.get(player.session);
    if (record) {
      record.phase = 'ended';
      record.winner = player.label;
    }
    return { correct, session: player.session, round: { winner: player.label, word: PREVIEW_WORD } };
  }

  disconnect(socket: GameSocket): { session: string; record?: SessionRecord } | null {
    const membership = this.memberships.get(socket.id);
    this.memberships.delete(socket.id);
    if (!membership) return null;
    const record = this.sessions.get(membership.session);
    if (!record || record.players.get(membership.label)?.socket.id !== socket.id) return null;
    record.players.delete(membership.label);
    if (record.players.size === 0) {
      if (record.countdownTimer) clearTimeout(record.countdownTimer);
      this.sessions.delete(membership.session);
      return { session: membership.session };
    }
    return { session: membership.session, record };
  }
}
