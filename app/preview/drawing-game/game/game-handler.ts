import type { GameServer, GameSocket } from './events';
import type { GameActions } from './game-state';

/** The Socket.IO-shaped flow reused by the Smocket and real Socket.IO bootstraps. */
export function registerDrawingGameHandler(
  io: GameServer,
  socket: GameSocket,
  game: GameActions,
): void {
  socket.on('join', async (session, acknowledge) => {
    const joined = game.join(socket, session);
    if (joined.accepted) await socket.join(joined.session);
    acknowledge(joined.result);
    game.joined(joined);
  });
  socket.on('stroke', (stroke) => {
    const session = game.stroke(socket, stroke);
    if (session) socket.to(session).emit('stroke', stroke);
  });
  socket.on('guess', (text, acknowledge) => {
    const result = game.guess(socket, text);
    acknowledge(result.correct);
    if (result.chat) io.to(result.session).emit('chat', result.chat);
    if (result.round) io.to(socket.id).emit('correct', { word: result.round.word });
    if (result.round) io.to(result.session).emit('announce', result.round);
    game.guessed(result);
  });
  socket.on('chat', (text) => {
    const result = game.chat(socket, text);
    if (result) io.to(result.session).emit('chat', result.message);
  });
  socket.on('disconnect', () => game.disconnect(socket));
}
