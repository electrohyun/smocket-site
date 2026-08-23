'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Canvas, { type CanvasHandle } from './Canvas';
import Character from './Character';
import Countdown from './Countdown';
import Fanfare from './Fanfare';
import ModeSelector from './ModeSelector';
import TracePanel from './TracePanel';
import { createMultiTabClient, supportsSharedWorker, type MultiTabSocket } from '../lib/multi-client';
import {
  type MultiChatMessage,
  type MultiJoinResult,
  type MultiPlayer,
  type MultiRoundResult,
  type MultiSeat,
  type MultiSessionState,
} from '../lib/multi-events';
import type { Label } from '../lib/room';
import type { StrokePayload } from '../lib/stroke';
import { TraceStore } from '../lib/trace';
import styles from './MultiTabView.module.css';

const NO_SEGMENTS = () => {};
const BUBBLE_MS = 3400;

function labelForSeat(seat: MultiSeat): Label {
  return seat === 1 ? 'A' : seat === 2 ? 'B' : 'C';
}

function randomId(prefix: string): string {
  const id = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replaceAll('-', '').slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${id}`;
}

function presenceFor(session: string, seat: MultiSeat): string {
  const key = `smocket-demo-presence:${session}:${seat}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = randomId(`seat${seat}`);
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return randomId(`seat${seat}`);
  }
}

function admissionMessage(result: MultiJoinResult | null): string | null {
  if (!result || result.accepted) return null;
  if (result.reason === 'seat-occupied') return 'This seat is already open in another tab. Close it there, then retry.';
  if (result.reason === 'invalid-session') return 'This session link is invalid. Return to Multi tab to create a new one.';
  return 'This player seat is invalid. Open the player from the setup controls.';
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

function hintFor(phase: MultiSessionState['phase'] | 'waiting', isDrawer: boolean): string {
  if (phase === 'ended') return 'One developer just reproduced a three-player realtime UI without a Socket.IO backend.';
  if (phase === 'active') return isDrawer
    ? 'Draw. The delivery record shows the real events observed by this tab.'
    : 'Guess from the drawing. The delivery record shows the real events observed by this tab.';
  if (phase === 'countdown') return 'Three players are ready. The round starts together.';
  return 'Build and preview a three-player realtime UI before the backend is ready.';
}

export default function MultiTabView({
  session,
  updateSessionUrl,
  seat,
  recording,
}: {
  session: string;
  updateSessionUrl: boolean;
  seat: MultiSeat;
  recording: boolean;
}) {
  const [connectionKey, setConnectionKey] = useState(0);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [joinResult, setJoinResult] = useState<MultiJoinResult | null>(null);
  const [state, setState] = useState<MultiSessionState | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Partial<Record<Label, string>>>({});
  const [ended, setEnded] = useState<MultiRoundResult | null>(null);
  const [showFanfare, setShowFanfare] = useState(false);
  const [input, setInput] = useState('');
  const [guessAck, setGuessAck] = useState<'idle' | 'wrong' | 'correct' | 'rejected'>('idle');
  const [receivedStrokes, setReceivedStrokes] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const socketRef = useRef<MultiTabSocket | null>(null);
  const bubbleTimers = useRef<Partial<Record<Label, number>>>({});
  const [trace] = useState(() => new TraceStore());
  const socketLabel = labelForSeat(seat);
  const sharedWorkerSupported = useSyncExternalStore(
    () => () => {},
    supportsSharedWorker,
    () => true,
  );

  const showBubble = useCallback((message: MultiChatMessage) => {
    const label = labelForSeat(message.from);
    setBubbles((current) => ({ ...current, [label]: message.text }));
    window.clearTimeout(bubbleTimers.current[label]);
    bubbleTimers.current[label] = window.setTimeout(
      () => setBubbles((current) => ({ ...current, [label]: undefined })),
      BUBBLE_MS,
    );
  }, []);

  useEffect(() => () => {
    for (const timer of Object.values(bubbleTimers.current)) window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!updateSessionUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.set('session', session);
    url.searchParams.set('seat', String(seat));
    window.history.replaceState(null, '', url);
  }, [seat, session, updateSessionUrl]);

  useEffect(() => {
    if (!sharedWorkerSupported) return;

    let live = true;
    let joining = false;
    const socket = createMultiTabClient({
      session,
      seat,
      presenceId: presenceFor(session, seat),
    });
    socketRef.current = socket;
    // Fast Refresh can preserve a store instance created by the previous module shape.
    trace.clear?.();
    trace.lifecycle(`${socketLabel} connecting`);

    const applyState = (next: MultiSessionState) => {
      if (!live) return;
      setState(next);
      if (next.phase === 'ended' && next.winnerSeat && next.word) {
        setEnded({ winnerSeat: next.winnerSeat, word: next.word });
      }
    };

    const join = async () => {
      if (!live || joining) return;
      joining = true;
      trace.inbound(socketLabel, 'join-session');
      try {
        const result = await socket.emitWithAck('join-session');
        trace.ack(socketLabel, result);
        if (!live) return;
        setJoinResult(result);
        if (result.state) applyState(result.state);
        if (result.word) setWord(result.word);
        for (const segment of result.strokes ?? []) canvasRef.current?.draw(segment);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        trace.lifecycle(`${socketLabel} join failed · ${message}`);
        if (live) setConnectionError(message);
      } finally {
        joining = false;
      }
    };

    const markConnected = () => {
      if (!live) return;
      setConnected(true);
      setSocketId(socket.id ?? null);
      trace.lifecycle(`${socketLabel} connected · ${socket.id?.slice(0, 8) ?? 'socket'}`);
      void join();
    };

    socket.on('connect', markConnected);
    socket.on('connect_error', (error) => {
      trace.lifecycle(`${socketLabel} connect error · ${error.message}`);
      if (live) setConnectionError(error.message);
    });
    socket.on('bridge_error', (error) => {
      trace.lifecycle(`${socketLabel} bridge error · ${error.message}`);
      if (live) setConnectionError(error.message);
    });
    socket.on('disconnect', (reason) => {
      trace.lifecycle(`${socketLabel} disconnected · ${reason}`);
      if (!live) return;
      setConnected(false);
      setSocketId(null);
    });
    socket.on('session-state', (next) => {
      trace.received(socketLabel, 'session-state', [next]);
      applyState(next);
    });
    socket.on('round-started', (result) => {
      trace.received(socketLabel, 'round-started', [result]);
      setGuessAck('idle');
    });
    socket.on('word', (nextWord) => {
      trace.received(socketLabel, 'word', [nextWord]);
      setWord(nextWord);
    });
    socket.on('stroke', (segment: StrokePayload) => {
      trace.received(socketLabel, 'stroke', [segment]);
      canvasRef.current?.draw(segment);
      setReceivedStrokes((count) => count + 1);
    });
    socket.on('chat', (message) => {
      trace.received(socketLabel, 'chat', [message]);
      showBubble(message);
    });
    socket.on('round-ended', (result) => {
      trace.received(socketLabel, 'round-ended', [result]);
      setEnded(result);
      setShowFanfare(true);
    });

    if (socket.connected) markConnected();

    return () => {
      live = false;
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [connectionKey, seat, session, sharedWorkerSupported, showBubble, socketLabel, trace]);

  const admitted = joinResult?.accepted === true;
  const phase = state?.phase ?? 'waiting';
  const isDrawer = seat === 1;
  const canDraw = connected && admitted && isDrawer && phase === 'active';
  const canGuess = connected && admitted && !isDrawer && phase === 'active';
  const error = admissionMessage(joinResult)
    ?? connectionError
    ?? (!sharedWorkerSupported
      ? 'SharedWorker is unavailable here. Use Single tab in a desktop Chromium browser.'
      : null);

  const commit = useCallback((segment: StrokePayload | null) => {
    if (!segment) return;
    trace.inbound('A', 'stroke', [segment]);
    socketRef.current?.emit('stroke', segment);
  }, [trace]);

  const submit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    const socket = socketRef.current;
    if (!text || !socket || !canGuess) return;
    setInput('');
    trace.inbound(socketLabel, 'guess', [text]);
    let acknowledgementTimeout: number | undefined;
    try {
      const result = await Promise.race([
        socket.emitWithAck('guess', text),
        new Promise<never>((_, reject) => {
          acknowledgementTimeout = window.setTimeout(
            () => reject(new Error('Guess acknowledgement timed out.')),
            5_000,
          );
        }),
      ]);
      trace.ack(socketLabel, result);
      setGuessAck(result.accepted ? (result.correct ? 'correct' : 'wrong') : 'rejected');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      trace.lifecycle(`${socketLabel} guess failed · ${message}`);
      setConnectionError(message);
    } finally {
      if (acknowledgementTimeout !== undefined) window.clearTimeout(acknowledgementTimeout);
    }
  }, [canGuess, input, socketLabel, trace]);

  const openSeat = useCallback((targetSeat: 2 | 3) => {
    const url = new URL('/demo/multi', window.location.origin);
    url.searchParams.set('session', session);
    url.searchParams.set('seat', String(targetSeat));
    if (recording) url.searchParams.set('recording', '1');
    trace.lifecycle(`opening ${labelForSeat(targetSeat)}`);
    window.open(url, '_blank', 'noopener');
  }, [recording, session, trace]);

  const retry = () => {
    trace.lifecycle(`${socketLabel} retrying`);
    setConnected(false);
    setSocketId(null);
    setJoinResult(null);
    setState(null);
    setWord(null);
    setBubbles({});
    setEnded(null);
    setShowFanfare(false);
    setGuessAck('idle');
    setReceivedStrokes(0);
    setConnectionError(null);
    setConnectionKey((key) => key + 1);
  };

  const players = state?.players ?? [];
  const winnerLabel = ended ? labelForSeat(ended.winnerSeat) : null;

  return (
    <>
      <ModeSelector active="multi" compact={recording} />
      <PlayerBadge label={socketLabel} role={isDrawer ? 'drawer' : 'guesser'} />

      <main
        className={styles.stage}
        data-testid="multi-tab-demo"
        data-session={session}
        data-seat={seat}
        data-socket-id={socketId ?? ''}
        data-connected={connected}
        data-admitted={admitted}
        data-player-count={players.length}
        data-phase={phase}
        data-stroke-count={receivedStrokes}
        data-guess-ack={guessAck}
        data-ended={ended !== null}
      >
        <section className={styles.board} aria-label={`${socketLabel} · ${isDrawer ? 'Drawer' : 'Guesser'}`}>
          {isDrawer && (
            <p className={styles.word}>
              <span className={styles.wordLabel}>word</span>
              <span className={styles.wordValue} data-socket="A">{word ?? '…'}</span>
            </p>
          )}

          <div className={styles.surface}>
            <Canvas
              key={connectionKey}
              ref={canvasRef}
              onSegment={isDrawer ? commit : NO_SEGMENTS}
              disabled={!canDraw}
            />
            {phase === 'countdown' && state?.countdownEndsAt && <Countdown endsAt={state.countdownEndsAt} />}
            {phase === 'waiting' && !error && (
              <div className={styles.waiting} role="status">
                <strong>{players.length} / 3 players connected</strong>
                <span>Open the empty player desks below. The round starts when A, B, and C are ready.</span>
              </div>
            )}
            {error && (
              <div className={styles.error} role="alert">
                <strong>Could not take {socketLabel}</strong>
                <span>{error}</span>
                <button type="button" onClick={retry}>Retry this player</button>
              </div>
            )}
            {showFanfare && ended && winnerLabel && (
              <Fanfare
                word={ended.word}
                socket={winnerLabel}
                eyebrow={ended.winnerSeat === seat ? 'You got it' : `${winnerLabel} guessed it`}
                onDone={() => setShowFanfare(false)}
              />
            )}
            {ended && !showFanfare && winnerLabel && (
              <div className={styles.result} role="status">
                <span className={styles.resultName} data-socket={winnerLabel}>{winnerLabel}</span>
                {' guessed it — '}
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
                onOpen={openSeat}
              />
            ))}
          </div>

          {!isDrawer && (
            <form className={styles.chat} onSubmit={submit}>
              <input
                className={styles.input}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={ended ? `Round over · the word was ${ended.word}` : 'Guess from the drawing'}
                aria-label="Guess"
                disabled={!canGuess}
              />
              <button type="submit" className={styles.send} disabled={!canGuess || !input.trim()}>Send</button>
              <output className={styles.ack} aria-live="polite">
                {guessAck === 'wrong' ? 'Guess acknowledged — keep trying.' : guessAck === 'correct' ? 'Correct guess acknowledged.' : guessAck === 'rejected' ? 'The round is not accepting guesses.' : ''}
              </output>
            </form>
          )}

          <footer className={styles.footer}>
            <p className={styles.hint}>{hintFor(phase, isDrawer)}</p>
            <code className={styles.session} title={session}>{session}</code>
          </footer>
        </section>

        <TracePanel store={trace} scope={socketLabel} maskWord={!isDrawer && !ended} />
      </main>

    </>
  );
}
