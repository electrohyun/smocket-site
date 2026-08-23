// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const browserSupport = vi.hoisted(() => ({ value: true }));
const listeners = new Map<string, (...args: never[]) => void>();
const emitWithAck = vi.fn().mockResolvedValue({
  accepted: true,
  state: { session: 'reconnect-test', phase: 'waiting', players: [] },
  strokes: [],
});
const socket = {
  connected: true,
  id: 'socket-one',
  on: vi.fn((event: string, listener: (...args: never[]) => void) => {
    listeners.set(event, listener);
    return socket;
  }),
  emit: vi.fn(),
  emitWithAck,
  disconnect: vi.fn(),
};

vi.mock('../../lib/multi-client', () => ({
  createMultiTabClient: () => socket,
  supportsSharedWorker: () => browserSupport.value,
}));
vi.mock('../ModeSelector', () => ({ default: () => null }));
vi.mock('../Canvas', () => ({
  default: forwardRef(function CanvasMock(_props, ref) {
    useImperativeHandle(ref, () => ({ draw: vi.fn() }));
    return <div aria-label="Drawing surface" />;
  }),
}));

import MultiTabView from '../MultiTabView';

afterEach(() => {
  cleanup();
  listeners.clear();
  emitWithAck.mockClear();
  socket.on.mockClear();
  socket.disconnect.mockClear();
  browserSupport.value = true;
  vi.useRealTimers();
});

describe('MultiTabView connection lifecycle', () => {
  it('joins again when the SharedWorker facade reconnects', async () => {
    render(
      <MultiTabView
        session="reconnect-test"
        updateSessionUrl={false}
        seat={1}
        recording={false}
      />,
    );

    await waitFor(() => expect(emitWithAck).toHaveBeenCalledTimes(1));
    listeners.get('connect')?.();
    await waitFor(() => expect(emitWithAck).toHaveBeenCalledTimes(2));
  });

  it('hydrates without a mismatch before showing unsupported-browser guidance', async () => {
    browserSupport.value = false;
    const props = {
      session: 'unsupported-test',
      updateSessionUrl: false,
      seat: 1 as const,
      recording: false,
    };
    const container = document.createElement('div');
    container.innerHTML = renderToString(<MultiTabView {...props} />);
    document.body.append(container);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const root = hydrateRoot(container, <MultiTabView {...props} />);
    await waitFor(() => expect(container).toHaveTextContent('SharedWorker is unavailable here.'));

    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/hydration|did not match/i);
    root.unmount();
    consoleError.mockRestore();
    container.remove();
  });

  it('announces countdown seconds and surfaces a failed guess acknowledgement', async () => {
    emitWithAck
      .mockResolvedValueOnce({
        accepted: true,
        state: {
          session: 'ack-test',
          phase: 'active',
          players: [
            { seat: 1, role: 'drawer', socketId: 'socket-drawer' },
            { seat: 2, role: 'guesser', socketId: 'socket-one' },
          ],
        },
        strokes: [],
      })
      .mockImplementationOnce(() => new Promise(() => {}));

    render(
      <MultiTabView
        session="ack-test"
        updateSessionUrl={false}
        seat={2}
        recording={false}
      />,
    );

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Guess' })).toBeEnabled());
    listeners.get('session-state')?.({
      session: 'ack-test',
      phase: 'countdown',
      players: [
        { seat: 1, role: 'drawer', socketId: 'socket-drawer' },
        { seat: 2, role: 'guesser', socketId: 'socket-one' },
        { seat: 3, role: 'guesser', socketId: 'socket-three' },
      ],
      countdownEndsAt: Date.now() + 3_000,
    } as never);
    expect(await screen.findByRole('timer')).toHaveAccessibleName(/Round starts in \d seconds/);

    act(() => listeners.get('session-state')?.({
      session: 'ack-test',
      phase: 'active',
      players: [
        { seat: 1, role: 'drawer', socketId: 'socket-drawer' },
        { seat: 2, role: 'guesser', socketId: 'socket-one' },
        { seat: 3, role: 'guesser', socketId: 'socket-three' },
      ],
    } as never));
    fireEvent.change(screen.getByRole('textbox', { name: 'Guess' }), { target: { value: 'giraffe' } });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await act(async () => vi.advanceTimersByTimeAsync(5_000));

    expect(screen.getByRole('alert')).toHaveTextContent('Guess acknowledgement timed out');
  });
});
