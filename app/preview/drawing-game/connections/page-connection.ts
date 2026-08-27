import { connectSharedWorker } from 'smocket-client/shared-worker';
import type { SharedWorkerSocket } from 'smocket/shared-worker';
import {
  PREVIEW_GAME_URL,
  type ClientToServerEvents,
  type GameClient,
  type PlayerLabel,
  type ServerToClientEvents,
} from '../game/events';

export const PREVIEW_WORKER_NAME = 'smocket-drawing-game-preview-v1';
export const PREVIEW_WORKER_VERSION_KEY = 'smocket:drawing-game-preview:worker-version';

function workerVersion(): string {
  try {
    return localStorage.getItem(PREVIEW_WORKER_VERSION_KEY) ?? 'base';
  } catch {
    return 'base';
  }
}

export function supportsPreviewSharedWorker(): boolean {
  return typeof SharedWorker === 'function';
}

/** The only page module that constructs and connects the Preview SharedWorker. */
export function connectPreviewPage(
  player: PlayerLabel,
  presenceId: string,
): GameClient {
  if (!supportsPreviewSharedWorker()) {
    throw new Error('SharedWorker is unavailable. Use a desktop Chromium browser.');
  }
  const worker = new SharedWorker(new URL('../drawing-game-worker.ts', import.meta.url), {
    name: `${PREVIEW_WORKER_NAME}-${workerVersion()}`,
    type: 'module',
  });
  return connectSharedWorker<ServerToClientEvents, ClientToServerEvents>(worker.port, {
    url: PREVIEW_GAME_URL,
    auth: { player, presenceId },
  }) as SharedWorkerSocket<ServerToClientEvents, ClientToServerEvents> as unknown as GameClient;
}
