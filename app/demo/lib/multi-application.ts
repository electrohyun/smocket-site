import { registerDrawingGameHandlers } from './multi-game-handler';
import type {
  MultiPhase,
  MultiPlayer,
  MultiSeat,
  MultiServer,
  MultiSessionState,
  MultiSocket,
  MultiStrokePayload,
} from './multi-events';
import { MULTI_WORD } from './multi-events';

interface Participant {
  socket: MultiSocket;
  presenceId: string;
}

interface SessionRecord {
  phase: MultiPhase;
  players: Map<MultiSeat, Participant>;
  strokes: MultiStrokePayload[];
  countdownEndsAt?: number;
  countdownTimer?: ReturnType<typeof setTimeout>;
  winnerSeat?: MultiSeat;
}

interface Membership {
  session: string;
  seat: MultiSeat;
}

export interface MultiApplicationOptions {
  countdownMs?: number;
  now?: () => number;
}

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function readSession(value: unknown): string | null {
  return typeof value === 'string' && SESSION_PATTERN.test(value) ? value : null;
}

function readSeat(value: unknown): MultiSeat | null {
  return value === 1 || value === 2 || value === 3 ? value : null;
}

function readPresenceId(value: unknown, fallback: string): string {
  const provided = typeof value === 'string' ? value.trim().slice(0, 128) : '';
  return provided || fallback;
}

function roomName(session: string): string {
  return `drawing-session:${session}`;
}

function roleFor(seat: MultiSeat): MultiPlayer['role'] {
  return seat === 1 ? 'drawer' : 'guesser';
}

/** Worker-safe drawing-game handlers shared by every real browser tab. */
export function registerMultiTabGameHandlers(
  io: MultiServer,
  { countdownMs = 3000, now = Date.now }: MultiApplicationOptions = {},
): void {
  const sessions = new Map<string, SessionRecord>();
  const memberships = new Map<string, Membership>();

  const getSession = (session: string): SessionRecord => {
    const existing = sessions.get(session);
    if (existing) return existing;
    const created: SessionRecord = {
      phase: 'waiting',
      players: new Map(),
      strokes: [],
    };
    sessions.set(session, created);
    return created;
  };

  const snapshot = (session: string, record: SessionRecord): MultiSessionState => ({
    session,
    phase: record.phase,
    players: [...record.players]
      .sort(([left], [right]) => left - right)
      .map(([seat, participant]) => ({
        seat,
        role: roleFor(seat),
        socketId: participant.socket.id,
      })),
    ...(record.countdownEndsAt === undefined
      ? {}
      : { countdownEndsAt: record.countdownEndsAt }),
    ...(record.winnerSeat === undefined ? {} : { winnerSeat: record.winnerSeat }),
    ...(record.phase === 'ended' ? { word: MULTI_WORD } : {}),
  });

  const publish = (session: string, record: SessionRecord): void => {
    io.to(roomName(session)).emit('session-state', snapshot(session, record));
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

    record.countdownTimer = setTimeout(() => {
      record.countdownTimer = undefined;
      record.countdownEndsAt = undefined;
      if (record.phase !== 'countdown' || record.players.size !== 3) {
        resetCountdown(session, record);
        return;
      }

      const startedAt = now();
      record.phase = 'active';
      publish(session, record);
      io.to(roomName(session)).emit('round-started', { startedAt });
      const drawer = record.players.get(1);
      if (drawer) io.to(drawer.socket.id).emit('word', MULTI_WORD);
    }, countdownMs);
  };

  io.on('connection', (socket) => {
    const claimedSession = readSession(socket.handshake.auth.session);
    const claimedSeat = readSeat(socket.handshake.auth.seat);
    const presenceId = readPresenceId(socket.handshake.auth.presenceId, socket.id);

    socket.on('join-session', async (acknowledge) => {
      if (!claimedSession) {
        acknowledge({ accepted: false, reason: 'invalid-session' });
        return;
      }
      if (!claimedSeat) {
        acknowledge({ accepted: false, reason: 'invalid-seat' });
        return;
      }

      const existingMembership = memberships.get(socket.id);
      if (existingMembership) {
        const record = sessions.get(existingMembership.session);
        acknowledge(
          record
            ? {
                accepted: true,
                state: snapshot(existingMembership.session, record),
                strokes: [...record.strokes],
                ...(existingMembership.seat === 1 && record.phase === 'active'
                  ? { word: MULTI_WORD }
                  : {}),
              }
            : { accepted: false, reason: 'invalid-session' },
        );
        return;
      }

      const record = getSession(claimedSession);
      const occupied = record.players.get(claimedSeat);
      if (occupied && occupied.presenceId !== presenceId) {
        acknowledge({ accepted: false, reason: 'seat-occupied' });
        return;
      }

      record.players.set(claimedSeat, { socket, presenceId });
      memberships.set(socket.id, { session: claimedSession, seat: claimedSeat });
      if (occupied && occupied.socket.id !== socket.id) occupied.socket.disconnect(true);

      await socket.join(roomName(claimedSession));
      const currentState = snapshot(claimedSession, record);
      acknowledge({
        accepted: true,
        state: currentState,
        strokes: [...record.strokes],
        ...(claimedSeat === 1 && record.phase === 'active' ? { word: MULTI_WORD } : {}),
      });
      publish(claimedSession, record);
      startCountdown(claimedSession, record);
    });

    registerDrawingGameHandlers(io, socket, {
      activePlayer(currentSocket) {
        const membership = memberships.get(currentSocket.id);
        if (!membership) return null;
        const record = sessions.get(membership.session);
        if (!record || record.phase !== 'active') return null;
        if (record.players.get(membership.seat)?.socket.id !== currentSocket.id) return null;
        return {
          session: membership.session,
          room: roomName(membership.session),
          seat: membership.seat,
        };
      },
      rememberStroke(session, segment) {
        sessions.get(session)?.strokes.push(segment);
      },
      endRound(session, winnerSeat) {
        const record = sessions.get(session);
        if (!record) throw new Error(`missing active session: ${session}`);
        record.phase = 'ended';
        record.winnerSeat = winnerSeat;
        return { winnerSeat, word: MULTI_WORD };
      },
      publish(session) {
        const record = sessions.get(session);
        if (record) publish(session, record);
      },
    });

    socket.on('disconnect', () => {
      const membership = memberships.get(socket.id);
      memberships.delete(socket.id);
      if (!membership) return;

      const record = sessions.get(membership.session);
      if (!record) return;
      const current = record.players.get(membership.seat);
      if (current?.socket.id !== socket.id) return;

      record.players.delete(membership.seat);
      if (record.players.size === 0) {
        if (record.countdownTimer) clearTimeout(record.countdownTimer);
        sessions.delete(membership.session);
        return;
      }
      if (record.phase === 'countdown') resetCountdown(membership.session, record);
      else publish(membership.session, record);
    });
  });
}
