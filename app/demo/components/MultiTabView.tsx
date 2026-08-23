'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import ModeSelector from './ModeSelector';
import MultiTabGameScreen, { labelForSeat } from './MultiTabGameScreen';
import type { CanvasHandle } from './Canvas';
import { createMultiTabClient, supportsSharedWorker, type MultiTabSocket } from '../lib/multi-client';
import {
  type MultiChatMessage,
  type MultiJoinResult,
  type MultiRoundResult,
  type MultiSeat,
  type MultiSessionState,
} from '../lib/multi-events';
import type { Label } from '../lib/room';
import type { StrokePayload } from '../lib/stroke';
import { TraceStore } from '../lib/trace';

const BUBBLE_MS = 3400;

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

  return (
    <MultiTabGameScreen
      topControl={<ModeSelector active="multi" compact={recording} />}
      testId="multi-tab-demo"
      session={session}
      seat={seat}
      socketId={socketId ?? ''}
      connected={connected}
      admitted={admitted}
      state={state}
      word={word}
      bubbles={bubbles}
      ended={ended}
      showFanfare={showFanfare}
      input={input}
      guessAck={guessAck}
      receivedStrokes={receivedStrokes}
      error={error}
      canvasKey={connectionKey}
      canvasRef={canvasRef}
      trace={trace}
      onStroke={commit}
      onSubmit={(event) => void submit(event)}
      onInput={setInput}
      onOpenSeat={openSeat}
      onRetry={retry}
      onFanfareDone={() => setShowFanfare(false)}
    />
  );
}
