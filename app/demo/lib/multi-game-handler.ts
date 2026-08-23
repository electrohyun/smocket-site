import type {
  MultiGuessResult,
  MultiRoundResult,
  MultiSeat,
  MultiServer,
  MultiSocket,
  MultiStrokePayload,
} from './multi-events';
import { MULTI_WORD } from './multi-events';

export interface ActiveMultiPlayer {
  session: string;
  room: string;
  seat: MultiSeat;
}

export interface MultiRoundStore {
  activePlayer(socket: MultiSocket): ActiveMultiPlayer | null;
  rememberStroke(session: string, segment: MultiStrokePayload): void;
  endRound(session: string, winnerSeat: MultiSeat): MultiRoundResult;
  publish(session: string): void;
}

/** The Socket.IO-shaped drawing and guess flow used in the worker and real target. */
export function registerDrawingGameHandlers(
  io: MultiServer,
  socket: MultiSocket,
  rounds: MultiRoundStore,
): void {
  socket.on('stroke', (segment) => {
    const player = rounds.activePlayer(socket);
    if (!player || player.seat !== 1) return;
    rounds.rememberStroke(player.session, segment);
    socket.to(player.room).emit('stroke', segment);
  });

  socket.on('guess', (text, acknowledge) => {
    const player = rounds.activePlayer(socket);
    if (!player || player.seat === 1)
      return acknowledge({ accepted: false, correct: false, reason: player ? 'not-a-guesser' : 'round-not-active' });
    const guess = text.trim();
    const correct = guess.toLowerCase() === MULTI_WORD;
    acknowledge({ accepted: true, correct } satisfies MultiGuessResult);
    if (!correct) return io.to(player.room).emit('chat', { from: player.seat, text: guess });
    io.to(player.room).emit('round-ended', rounds.endRound(player.session, player.seat));
    rounds.publish(player.session);
  });
}
