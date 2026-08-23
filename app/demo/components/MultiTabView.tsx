'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Canvas, { type CanvasHandle } from './Canvas';
import ModeSelector from './ModeSelector';
import { createMultiTabClient, supportsSharedWorker, type MultiTabSocket } from '../lib/multi-client';
import {
  type MultiChatMessage,
  type MultiJoinResult,
  type MultiRoundResult,
  type MultiSeat,
  type MultiSessionState,
} from '../lib/multi-events';
import type { StrokePayload } from '../lib/stroke';
import styles from './MultiTabView.module.css';

const NO_SEGMENTS = () => {};

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

function SharedCountdown({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    const update = () => setRemaining(Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return (
    <div className={styles.countdown} role="timer" aria-live="assertive" aria-label={`Round starts in ${remaining}`}>
      <span>{remaining}</span>
    </div>
  );
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
  const [messages, setMessages] = useState<MultiChatMessage[]>([]);
  const [ended, setEnded] = useState<MultiRoundResult | null>(null);
  const [input, setInput] = useState('');
  const [guessAck, setGuessAck] = useState<'idle' | 'wrong' | 'correct' | 'rejected'>('idle');
  const [receivedStrokes, setReceivedStrokes] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const socketRef = useRef<MultiTabSocket | null>(null);
  const sharedWorkerSupported = useSyncExternalStore(
    () => () => {},
    supportsSharedWorker,
    () => true,
  );

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
      try {
        const result = await socket.emitWithAck('join-session');
        if (!live) return;
        setJoinResult(result);
        if (result.state) applyState(result.state);
        if (result.word) setWord(result.word);
        for (const segment of result.strokes ?? []) canvasRef.current?.draw(segment);
      } catch (error) {
        if (live) setConnectionError(error instanceof Error ? error.message : String(error));
      }
    };

    socket.on('connect', () => {
      if (!live) return;
      setConnected(true);
      setSocketId(socket.id ?? null);
      void join();
    });
    socket.on('connect_error', (error) => {
      if (live) setConnectionError(error.message);
    });
    socket.on('bridge_error', (error) => {
      if (live) setConnectionError(error.message);
    });
    socket.on('disconnect', () => {
      if (!live) return;
      setConnected(false);
      setSocketId(null);
    });
    socket.on('session-state', applyState);
    socket.on('round-started', () => setGuessAck('idle'));
    socket.on('word', setWord);
    socket.on('stroke', (segment: StrokePayload) => {
      canvasRef.current?.draw(segment);
      setReceivedStrokes((count) => count + 1);
    });
    socket.on('chat', (message) => setMessages((current) => [...current, message]));
    socket.on('round-ended', (result) => setEnded(result));

    if (socket.connected) void join();

    return () => {
      live = false;
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [connectionKey, seat, session, sharedWorkerSupported]);

  const admitted = joinResult?.accepted === true;
  const phase = state?.phase ?? 'waiting';
  const isDrawer = seat === 1;
  const canDraw = admitted && isDrawer && phase === 'active';
  const canGuess = admitted && !isDrawer && phase === 'active';
  const error = admissionMessage(joinResult)
    ?? connectionError
    ?? (!sharedWorkerSupported
      ? 'SharedWorker is unavailable here. Use Single tab in a desktop Chromium browser.'
      : null);

  const commit = useCallback((segment: StrokePayload | null) => {
    if (segment) socketRef.current?.emit('stroke', segment);
  }, []);

  const submit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    const socket = socketRef.current;
    if (!text || !socket || !canGuess) return;
    setInput('');
    const result = await socket.emitWithAck('guess', text);
    setGuessAck(result.accepted ? (result.correct ? 'correct' : 'wrong') : 'rejected');
  }, [canGuess, input]);

  const openSeat = (targetSeat: 2 | 3) => {
    const url = new URL('/demo/multi', window.location.origin);
    url.searchParams.set('session', session);
    url.searchParams.set('seat', String(targetSeat));
    if (recording) url.searchParams.set('recording', '1');
    window.open(url, '_blank', 'noopener');
  };

  const retry = () => {
    setConnected(false);
    setSocketId(null);
    setJoinResult(null);
    setState(null);
    setWord(null);
    setMessages([]);
    setEnded(null);
    setGuessAck('idle');
    setReceivedStrokes(0);
    setConnectionError(null);
    setConnectionKey((key) => key + 1);
  };

  return (
    <>
      <ModeSelector active="multi" compact={recording} />
      <main
        className={styles.page}
        data-testid="multi-tab-demo"
        data-session={session}
        data-seat={seat}
        data-socket-id={socketId ?? ''}
        data-connected={connected}
        data-admitted={admitted}
        data-player-count={state?.players.length ?? 0}
        data-phase={phase}
        data-stroke-count={receivedStrokes}
        data-guess-ack={guessAck}
        data-ended={ended !== null}
      >
        <header className={styles.intro}>
          <p className={styles.promise}>Build and preview a three-player realtime UI before the backend is ready.</p>
          <dl className={styles.facts} aria-label="Preview environment">
            <div><dt>3</dt><dd>browser tabs</dd></div>
            <div><dt>1</dt><dd>in-browser Smocket server</dd></div>
            <div><dt>0</dt><dd>separate Socket.IO backend processes</dd></div>
          </dl>
        </header>

        <div className={styles.workspace}>
          <section className={styles.game} aria-labelledby="multi-role-title">
            <header className={styles.gameHeader}>
              <div>
                <span className={styles.eyebrow}>Player {seat}</span>
                <h1 id="multi-role-title">{isDrawer ? 'Drawer' : 'Guesser'}</h1>
              </div>
              <p className={styles.connection} data-online={connected && admitted}>
                <span aria-hidden="true" />
                {connected && admitted ? `Connected · ${socketId?.slice(0, 8)}` : 'Connecting'}
              </p>
            </header>

            <p className={styles.word}>
              <span>word</span>
              <strong>{isDrawer ? (word ?? (phase === 'active' ? '…' : 'revealed when the round starts')) : (ended?.word ?? 'kept for the drawer')}</strong>
            </p>

            <div className={styles.surface}>
              <Canvas
                key={connectionKey}
                ref={canvasRef}
                onSegment={isDrawer ? commit : NO_SEGMENTS}
                disabled={!canDraw}
              />
              {phase === 'countdown' && state?.countdownEndsAt && <SharedCountdown endsAt={state.countdownEndsAt} />}
              {phase === 'waiting' && !error && (
                <div className={styles.waiting} role="status">
                  <strong>{state?.players.length ?? 0} / 3 players connected</strong>
                  <span>The round starts together when every real tab is ready.</span>
                </div>
              )}
              {error && (
                <div className={styles.error} role="alert">
                  <strong>Could not take Player {seat}</strong>
                  <span>{error}</span>
                  <button type="button" onClick={retry}>Retry this seat</button>
                </div>
              )}
              {ended && (
                <div className={styles.result} role="status">
                  <span>Player {ended.winnerSeat} got it</span>
                  <strong>{ended.word}</strong>
                </div>
              )}
            </div>

            {!isDrawer && (
              <form className={styles.chat} onSubmit={submit}>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={ended ? `Round over · ${ended.word}` : 'Guess from the drawing'}
                  aria-label="Guess"
                  disabled={!canGuess}
                />
                <button type="submit" disabled={!canGuess || !input.trim()}>Send</button>
                <output className={styles.ack} aria-live="polite">
                  {guessAck === 'wrong' ? 'Guess acknowledged — keep trying.' : guessAck === 'correct' ? 'Correct guess acknowledged.' : guessAck === 'rejected' ? 'The round is not accepting guesses.' : ''}
                </output>
              </form>
            )}

            {messages.length > 0 && (
              <div className={styles.feed} aria-label="Guesses">
                {messages.map((message, index) => <p key={`${message.from}-${index}`}><strong>Player {message.from}</strong>{message.text}</p>)}
              </div>
            )}
          </section>

          <aside className={styles.setup} aria-label="Session setup">
            <div className={styles.sessionHeading}>
              <span>session</span>
              <code>{session}</code>
            </div>
            <ol className={styles.seats}>
              {([1, 2, 3] as const).map((playerSeat) => {
                const player = state?.players.find((item) => item.seat === playerSeat);
                const current = playerSeat === seat;
                return (
                  <li key={playerSeat} data-ready={Boolean(player)} data-current={current}>
                    <span className={styles.seatNumber}>{playerSeat}</span>
                    <span><strong>Player {playerSeat}</strong><small>{playerSeat === 1 ? 'Drawer' : 'Guesser'}{current ? ' · this tab' : ''}</small></span>
                    <b>{player ? 'Ready' : 'Waiting'}</b>
                  </li>
                );
              })}
            </ol>

            {seat === 1 && (
              <div className={styles.openers}>
                <button type="button" onClick={() => openSeat(2)} disabled={Boolean(state?.players.some((player) => player.seat === 2))}>Open Player 2</button>
                <button type="button" onClick={() => openSeat(3)} disabled={Boolean(state?.players.some((player) => player.seat === 3))}>Open Player 3</button>
              </div>
            )}

            <p className={styles.scope}>Shared only by the same origin, browser profile, worker URL, and worker name.</p>
          </aside>
        </div>

        {ended && (
          <section className={styles.summary} aria-labelledby="multi-summary-title">
            <h2 id="multi-summary-title">One developer just reproduced a three-player realtime UI without a Socket.IO backend.</h2>
            <ul>
              <li>Scripted players in one page</li>
              <li>Real participants across browser tabs</li>
              <li>Socket.IO-shaped event code</li>
            </ul>
          </section>
        )}

        <details className={styles.support}>
          <summary>How it works and what this preview does not prove</summary>
          <p>One Smocket server lives in a SharedWorker for this browser profile and origin. Worker restarts clear its in-memory state. Different browsers and devices do not join this session. Production transport, authentication, databases, persistence, and reconnect behavior still belong to a real Socket.IO integration.</p>
        </details>
      </main>
    </>
  );
}
