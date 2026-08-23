// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
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
});
