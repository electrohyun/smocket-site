'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CanvasHandle } from '@/app/demo/components/Canvas';
import MultiTabGameScreen, {
  labelForSeat,
  type MultiTabScreenResult,
  type MultiTabScreenState,
} from '@/app/demo/components/MultiTabGameScreen';
import type { MultiSeat } from '@/app/demo/lib/multi-events';
import type { Label } from '@/app/demo/lib/room';
import type { StrokePayload } from '@/app/demo/lib/stroke';
import { TraceStore } from '@/app/demo/lib/trace';
import { connectPreviewPage, supportsPreviewSharedWorker } from './connections/page-connection';
import type {
  ChatMessage,
  GameClient,
  JoinResult,
  PlayerLabel,
  RoundResult,
  SessionState,
} from './game/events';
import PreviewTargetBadge from './PreviewTargetBadge';

const BUBBLE_MS = 3400;
const WORKER_BOOTSTRAP_WAIT_MS = 1500;

function seatForPlayer(player: PlayerLabel): MultiSeat {
  return player === 'A' ? 1 : player === 'B' ? 2 : 3;
}

function presenceFor(session: string, player: PlayerLabel): string {
  const key = `smocket-preview-presence:${session}:${player}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = `${player.toLowerCase()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return `${player.toLowerCase()}-${Math.random().toString(36).slice(2, 14)}`;
  }
}

function toScreenState(state: SessionState): MultiTabScreenState {
  return {
    phase: state.phase,
    players: state.players.map((player) => ({
      seat: seatForPlayer(player.label),
      role: player.role,
      socketId: player.socketId,
    })),
    ...(state.countdownEndsAt === undefined ? {} : { countdownEndsAt: state.countdownEndsAt }),
  };
}

function toScreenResult(result: RoundResult): MultiTabScreenResult {
  return { winnerSeat: seatForPlayer(result.winner), word: result.word };
}

function admissionMessage(result: JoinResult | null): string | null {
  if (!result || result.accepted) return null;
  if (result.reason === 'seat-occupied') return 'This player is already open in another page.';
  if (result.reason === 'invalid-session') return 'This session link is invalid.';
  return 'This player link is invalid.';
}

class WorkerBootstrapUnavailableError extends Error {}

export default function PreviewDrawingGame({
  session,
  player,
}: {
  session: string;
  player: PlayerLabel;
}) {
  const seat = seatForPlayer(player);
  const [connectionKey, setConnectionKey] = useState(0);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState('');
  const [admission, setAdmission] = useState<JoinResult | null>(null);
  const [state, setState] = useState<SessionState | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [ended, setEnded] = useState<RoundResult | null>(null);
  const [showFanfare, setShowFanfare] = useState(false);
  const [input, setInput] = useState('');
  const [guessAck, setGuessAck] = useState<'idle' | 'wrong' | 'correct' | 'error'>('idle');
  const [bubbles, setBubbles] = useState<Partial<Record<Label, string>>>({});
  const [receivedStrokes, setReceivedStrokes] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [workerBootstrapMissing, setWorkerBootstrapMissing] = useState(false);
  const socketRef = useRef<GameClient | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const bubbleTimers = useRef<Partial<Record<Label, number>>>({});
  const [trace] = useState(() => new TraceStore());
  const sharedWorkerSupported = useSyncExternalStore(
    () => () => {},
    supportsPreviewSharedWorker,
    () => true,
  );

  const showChat = useCallback((message: ChatMessage) => {
    setBubbles((current) => ({ ...current, [message.from]: message.text }));
    window.clearTimeout(bubbleTimers.current[message.from]);
    bubbleTimers.current[message.from] = window.setTimeout(
      () => setBubbles((current) => ({ ...current, [message.from]: undefined })),
      BUBBLE_MS,
    );
  }, []);

  useEffect(() => () => {
    for (const timer of Object.values(bubbleTimers.current)) window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sharedWorkerSupported) return;
    let live = true;
    let joining = false;
    const socket = connectPreviewPage(player, presenceFor(session, player));
    socketRef.current = socket;
    trace.clear?.();
    trace.lifecycle(`${player} connecting`);

    const join = async () => {
      if (!live || joining) return;
      joining = true;
      trace.inbound(player, 'join', [session]);
      let timer: number | undefined;
      try {
        const result = await Promise.race([
          socket.emitWithAck('join', session),
          new Promise<never>((_, reject) => {
            timer = window.setTimeout(
              () => reject(new WorkerBootstrapUnavailableError()),
              WORKER_BOOTSTRAP_WAIT_MS,
            );
          }),
        ]);
        if (!live) return;
        trace.ack(player, result);
        setAdmission(result);
        setWorkerBootstrapMissing(false);
      } catch (error) {
        if (!live) return;
        if (error instanceof WorkerBootstrapUnavailableError) {
          setWorkerBootstrapMissing(true);
        } else {
          const message = error instanceof Error ? error.message : String(error);
          trace.lifecycle(`${player} join failed · ${message}`);
          setConnectionError(message);
        }
      } finally {
        if (timer !== undefined) window.clearTimeout(timer);
        joining = false;
      }
    };

    const markConnected = () => {
      if (!live) return;
      setConnected(true);
      setSocketId(socket.id ?? '');
      trace.lifecycle(`${player} connected · ${socket.id?.slice(0, 8) ?? 'socket'}`);
      void join();
    };

    socket.on('connect', markConnected);
    socket.on('connect_error', (error) => {
      trace.lifecycle(`${player} connect error · ${error.message}`);
      if (live) setConnectionError(error.message);
    });
    socket.on('bridge_error', (error) => {
      trace.lifecycle(`${player} bridge error · ${error.message}`);
      if (live) setConnectionError(error.message);
    });
    socket.on('disconnect', (reason) => {
      trace.lifecycle(`${player} disconnected · ${reason}`);
      if (!live) {
        return;
      }
      setConnected(false);
      setSocketId('');
    });
    socket.on('session-state', (next) => {
      trace.received(player, 'session-state', [next]);
      setState(next);
      if (next.phase === 'ended' && next.winner && next.word) {
        setEnded({ winner: next.winner, word: next.word });
      }
    });
    socket.on('round-started', (result) => {
      trace.received(player, 'round-started', [result]);
      setGuessAck('idle');
    });
    socket.on('word', (nextWord) => {
      trace.received(player, 'word', [nextWord]);
      setWord(nextWord);
    });
    socket.on('stroke', (stroke) => {
      trace.received(player, 'stroke', [stroke]);
      canvasRef.current?.draw(stroke);
      setReceivedStrokes((count) => count + 1);
    });
    socket.on('chat', (message) => {
      trace.received(player, 'chat', [message]);
      showChat(message);
    });
    socket.on('correct', (result) => trace.received(player, 'correct', [result]));
    socket.on('announce', (result) => {
      trace.received(player, 'announce', [result]);
      setEnded(result);
      setShowFanfare(true);
    });
    if (socket.connected) markConnected();

    return () => {
      live = false;
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [connectionKey, player, session, sharedWorkerSupported, showChat, trace]);

  const admitted = admission?.accepted === true;
  const phase = state?.phase ?? 'waiting';
  const canGuess = connected && admitted && player !== 'A' && phase === 'active';
  const error = admissionMessage(admission)
    ?? connectionError
    ?? (!sharedWorkerSupported ? 'SharedWorker is unavailable. Use a desktop Chromium browser.' : null);

  const sendStroke = useCallback((stroke: StrokePayload | null) => {
    if (!stroke) return;
    trace.inbound('A', 'stroke', [stroke]);
    socketRef.current?.emit('stroke', stroke);
  }, [trace]);

  const submitGuess = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    const socket = socketRef.current;
    if (!text || !socket || !canGuess) return;
    setInput('');
    trace.inbound(player, 'guess', [text]);
    let timer: number | undefined;
    try {
      const correct = await Promise.race([
        socket.emitWithAck('guess', text),
        new Promise<never>((_, reject) => {
          timer = window.setTimeout(() => reject(new Error('Guess acknowledgement timed out.')), 5000);
        }),
      ]);
      trace.ack(player, correct);
      setGuessAck(correct ? 'correct' : 'wrong');
    } catch (reason) {
      setInput(text);
      setGuessAck('error');
      setConnectionError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      if (timer !== undefined) window.clearTimeout(timer);
    }
  }, [canGuess, input, player, trace]);

  const openPlayer = useCallback((targetSeat: 2 | 3) => {
    const url = new URL('/preview/drawing-game', window.location.origin);
    url.searchParams.set('session', session);
    url.searchParams.set('player', labelForSeat(targetSeat));
    trace.lifecycle(`opening ${labelForSeat(targetSeat)}`);
    window.open(url, '_blank', 'noopener');
  }, [session, trace]);

  const retry = () => {
    trace.lifecycle(`${player} retrying`);
    setConnected(false);
    setSocketId('');
    setAdmission(null);
    setState(null);
    setWord(null);
    setEnded(null);
    setShowFanfare(false);
    setGuessAck('idle');
    setReceivedStrokes(0);
    setConnectionError(null);
    setWorkerBootstrapMissing(false);
    setConnectionKey((key) => key + 1);
  };

  return (
    <MultiTabGameScreen
      topControl={<PreviewTargetBadge />}
      testId="drawing-game-preview"
      session={session}
      seat={seat}
      socketId={socketId}
      connected={connected}
      admitted={admitted}
      state={state ? toScreenState(state) : null}
      word={word}
      bubbles={bubbles}
      ended={ended ? toScreenResult(ended) : null}
      showFanfare={showFanfare}
      input={input}
      guessAck={guessAck}
      receivedStrokes={receivedStrokes}
      error={error}
      canvasKey={connectionKey}
      canvasRef={canvasRef}
      trace={trace}
      waitingTitle={workerBootstrapMissing ? 'SharedWorker server not connected' : undefined}
      waitingDetail={workerBootstrapMissing
        ? 'Create the Smocket server, register the game handlers, and attach the SharedWorker port.'
        : undefined}
      onStroke={sendStroke}
      onSubmit={(event) => void submitGuess(event)}
      onInput={setInput}
      onOpenSeat={openPlayer}
      onRetry={retry}
      onFanfareDone={() => setShowFanfare(false)}
    />
  );
}
