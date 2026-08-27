'use client';

import type { FormEvent, ReactNode } from 'react';
import Canvas, { type CanvasHandle } from './Canvas';
import Character from './Character';
import Countdown from './Countdown';
import Fanfare from './Fanfare';
import TracePanel from './TracePanel';
import type { MultiPhase, MultiPlayer, MultiSeat } from '../lib/multi-events';
import type { Label } from '../lib/room';
import type { StrokePayload } from '../lib/stroke';
import type { TraceStore } from '../lib/trace';
import styles from './MultiTabView.module.css';

const NO_SEGMENTS = () => {};

export interface MultiTabScreenState {
  phase: MultiPhase;
  players: MultiPlayer[];
  countdownEndsAt?: number;
}

export interface MultiTabScreenResult {
  winnerSeat: MultiSeat;
  word: string;
}

export function labelForSeat(seat: MultiSeat): Label {
  return seat === 1 ? 'A' : seat === 2 ? 'B' : 'C';
}

function PlayerBadge({ label, role }: { label: Label; role: 'drawer' | 'guesser' }) {
  return (
    <aside className={styles.playerBadge} aria-label="Current player">
      <strong data-socket={label}>{label}</strong>
      <span aria-hidden="true">·</span>
      <span>{role}</span>
    </aside>
  );
}

function PlayerSlot({
  playerSeat,
  currentSeat,
  player,
  bubble,
  winnerSeat,
  onOpen,
}: {
  playerSeat: 2 | 3;
  currentSeat: MultiSeat;
  player: MultiPlayer | undefined;
  bubble: string | null;
  winnerSeat: MultiSeat | undefined;
  onOpen: (seat: 2 | 3) => void;
}) {
  const label = labelForSeat(playerSeat);
  const ready = Boolean(player);
  const current = playerSeat === currentSeat;
  const role = current ? 'you' : ready ? 'guesser' : 'waiting';

  return (
    <div className={styles.playerSlot} data-ready={ready} data-current={current}>
      <Character label={label} role={role} bubble={bubble} highlight={winnerSeat === playerSeat} />
      {ready ? (
        <span className={styles.playerState}>ready</span>
      ) : currentSeat === 1 ? (
        <button type="button" className={styles.openPlayer} onClick={() => onOpen(playerSeat)}>
          Open Player {playerSeat}
        </button>
      ) : (
        <span className={styles.waitingPlayer}>Waiting for Player {playerSeat}</span>
      )}
    </div>
  );
}

function hintFor(phase: MultiPhase, isDrawer: boolean): string {
  if (phase === 'ended') {
    return 'One developer just reproduced a three-player realtime UI without a Socket.IO backend.';
  }
  if (phase === 'active') {
    return isDrawer
      ? 'Draw. The delivery record shows the real events observed by this tab.'
      : 'Guess from the drawing. The delivery record shows the real events observed by this tab.';
  }
  if (phase === 'countdown') return 'Three players are ready. The round starts together.';
  return 'Build and preview a three-player realtime UI before the backend is ready.';
}

export default function MultiTabGameScreen({
  topControl,
  testId,
  session,
  seat,
  socketId,
  connected,
  admitted,
  state,
  word,
  bubbles,
  ended,
  showFanfare,
  input,
  guessAck,
  receivedStrokes,
  error,
  canvasKey,
  canvasRef,
  trace,
  waitingTitle,
  waitingDetail,
  onStroke,
  onSubmit,
  onInput,
  onOpenSeat,
  onRetry,
  onFanfareDone,
}: {
  topControl: ReactNode;
  testId: string;
  session: string;
  seat: MultiSeat;
  socketId: string;
  connected: boolean;
  admitted: boolean;
  state: MultiTabScreenState | null;
  word: string | null;
  bubbles: Partial<Record<Label, string>>;
  ended: MultiTabScreenResult | null;
  showFanfare: boolean;
  input: string;
  guessAck: 'idle' | 'wrong' | 'correct' | 'rejected' | 'error';
  receivedStrokes: number;
  error: string | null;
  canvasKey: number;
  canvasRef: React.RefObject<CanvasHandle | null>;
  trace: TraceStore;
  waitingTitle?: string;
  waitingDetail?: string;
  onStroke: (segment: StrokePayload | null) => void;
  onSubmit: (event: FormEvent) => void;
  onInput: (value: string) => void;
  onOpenSeat: (seat: 2 | 3) => void;
  onRetry: () => void;
  onFanfareDone: () => void;
}) {
  const phase = state?.phase ?? 'waiting';
  const players = state?.players ?? [];
  const isDrawer = seat === 1;
  const socketLabel = labelForSeat(seat);
  const canDraw = connected && admitted && isDrawer && phase === 'active';
  const canGuess = connected && admitted && !isDrawer && phase === 'active';
  const winnerLabel = ended ? labelForSeat(ended.winnerSeat) : null;

  return (
    <>
      {topControl}
      <PlayerBadge label={socketLabel} role={isDrawer ? 'drawer' : 'guesser'} />

      <main
        className={styles.stage}
        data-testid={testId}
        data-session={session}
        data-seat={seat}
        data-socket-id={socketId}
        data-connected={connected}
        data-admitted={admitted}
        data-player-count={players.length}
        data-phase={phase}
        data-stroke-count={receivedStrokes}
        data-guess-ack={guessAck}
        data-ended={ended !== null}
        data-winner={winnerLabel ?? ''}
      >
        <section className={styles.board} aria-label={`${socketLabel} · ${isDrawer ? 'Drawer' : 'Guesser'}`}>
          {isDrawer && (
            <p className={styles.word}>
              <span className={styles.wordLabel}>word</span>
              <span className={styles.wordValue} data-socket="A">{word ?? '??'}</span>
            </p>
          )}

          <div className={styles.surface}>
            <Canvas
              key={canvasKey}
              ref={canvasRef}
              onSegment={isDrawer ? onStroke : NO_SEGMENTS}
              disabled={!canDraw}
            />
            {phase === 'countdown' && state?.countdownEndsAt && <Countdown endsAt={state.countdownEndsAt} />}
            {phase === 'waiting' && !error && (
              <div className={styles.waiting} role="status">
                <strong>{waitingTitle ?? `${players.length} / 3 players connected`}</strong>
                <span>{waitingDetail ?? 'Open the empty player desks below. The round starts when A, B, and C are ready.'}</span>
              </div>
            )}
            {error && (
              <div className={styles.error} role="alert">
                <strong>Could not take {socketLabel}</strong>
                <span>{error}</span>
                <button type="button" onClick={onRetry}>Retry this player</button>
              </div>
            )}
            {showFanfare && ended && winnerLabel && (
              <Fanfare
                word={ended.word}
                socket={winnerLabel}
                eyebrow={ended.winnerSeat === seat ? 'You got it' : `${winnerLabel} guessed it`}
                onDone={onFanfareDone}
              />
            )}
            {ended && !showFanfare && winnerLabel && (
              <div className={styles.result} role="status">
                <span className={styles.resultName} data-socket={winnerLabel}>{winnerLabel}</span>
                {' guessed it · '}
                <span className={styles.resultWord} data-socket="A">{ended.word}</span>
              </div>
            )}
          </div>

          <div className={styles.players} aria-label="Player tabs">
            {([2, 3] as const).map((playerSeat) => (
              <PlayerSlot
                key={playerSeat}
                playerSeat={playerSeat}
                currentSeat={seat}
                player={players.find((player) => player.seat === playerSeat)}
                bubble={bubbles[labelForSeat(playerSeat)] ?? null}
                winnerSeat={ended?.winnerSeat}
                onOpen={onOpenSeat}
              />
            ))}
          </div>

          {!isDrawer && (
            <form className={styles.chat} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={input}
                onChange={(event) => onInput(event.target.value)}
                placeholder={ended ? `Round over · the word was ${ended.word}` : 'Guess from the drawing'}
                aria-label="Guess"
                disabled={!canGuess}
              />
              <button type="submit" className={styles.send} disabled={!canGuess || !input.trim()}>Send</button>
              <output className={styles.ack} aria-live="polite">
                {guessAck === 'wrong'
                  ? 'Guess acknowledged — keep trying.'
                  : guessAck === 'correct'
                    ? 'Correct guess acknowledged.'
                    : guessAck === 'rejected'
                      ? 'The round is not accepting guesses.'
                      : guessAck === 'error'
                        ? 'Guess acknowledgement failed.'
                        : ''}
              </output>
            </form>
          )}

          <footer className={styles.footer}>
            <p className={styles.hint}>{hintFor(phase, isDrawer)}</p>
            <code className={styles.session} title={session}>SESSION ID: {session}</code>
          </footer>
        </section>

        <TracePanel store={trace} scope={socketLabel} maskWord={!isDrawer && !ended} />
      </main>
    </>
  );
}
