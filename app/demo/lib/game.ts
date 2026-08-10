/* The round's fixed facts, with nothing socket-shaped about them.
 *
 * These lived in `room.ts` until the landing wanted the bot script. `room.ts`
 * opens with `import { connect, Server } from 'smocket'`, so anything reaching
 * through it for a constant drags the whole library along — and the landing is
 * the one page that must not carry it (기획 §8). Splitting the constants out is
 * what lets `bots.ts` be imported from a page that has no server in it.
 *
 * `room.ts` re-exports every name here, so the demo's own imports are unchanged
 * and there is still one place to read `WORD` from.
 */

export const ROOM = 'room-1';
export const WORD = 'giraffe';

/** A draws, B and C guess. Fixed for one round; there is no rotation (기획 §1). */
export const LABELS = ['A', 'B', 'C'] as const;
export type Label = (typeof LABELS)[number];

export const DRAWER: Label = 'A';
