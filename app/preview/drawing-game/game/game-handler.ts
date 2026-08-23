import type { GameServer, GameSocket } from './events';
import type { GameActions } from './game-state';

/** The live-coded Socket.IO-shaped flow used by the Preview worker. */
export function registerDrawingGameHandler(io: GameServer, socket: GameSocket, game: GameActions): void {
  void io;
  void socket;
  void game;
}
