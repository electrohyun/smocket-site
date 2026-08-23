import { describe, expect, it, vi } from 'vitest';
import type { createGameClient as createClient } from '../client';
import {
  realTarget,
  runDualTargetScenario,
  smocketTarget,
  type ScenarioObservation,
  type ScenarioTarget,
} from './dual-target-scenario';

type CreateGameClient = typeof createClient;

const expected: ScenarioObservation = {
  connections: [
    { label: 'A', socketId: 'sid_A' },
    { label: 'B', socketId: 'sid_B' },
    { label: 'C', socketId: 'sid_C' },
  ],
  distinctSocketIds: true,
  joins: [
    { label: 'A', acknowledgement: { accepted: true, room: 'room-1' } },
    { label: 'B', acknowledgement: { accepted: true, room: 'room-1' } },
    { label: 'C', acknowledgement: { accepted: true, room: 'room-1' } },
  ],
  events: {
    A: [
      { event: 'chat', payload: { from: 'B', text: 'zebra' } },
      { event: 'announce', payload: { winner: 'C', word: 'giraffe' } },
    ],
    B: [
      { event: 'stroke', payload: { id: 1, pts: [[0.1, 0.2], [0.3, 0.4]] } },
      { event: 'chat', payload: { from: 'B', text: 'zebra' } },
      { event: 'announce', payload: { winner: 'C', word: 'giraffe' } },
      { event: 'stroke', payload: { id: 2, pts: [[0.5, 0.6]], end: true } },
    ],
    C: [
      { event: 'stroke', payload: { id: 1, pts: [[0.1, 0.2], [0.3, 0.4]] } },
      { event: 'chat', payload: { from: 'B', text: 'zebra' } },
      { event: 'correct', payload: { word: 'giraffe' } },
      { event: 'announce', payload: { winner: 'C', word: 'giraffe' } },
    ],
  },
  acknowledgements: [
    { from: 'B', value: false },
    { from: 'C', value: true },
  ],
  deliveries: [
    {
      event: 'stroke',
      payload: { id: 1, pts: [[0.1, 0.2], [0.3, 0.4]] },
      recipients: ['B', 'C'],
      senderExcluded: 'A',
    },
    {
      event: 'chat',
      payload: { from: 'B', text: 'zebra' },
      recipients: ['A', 'B', 'C'],
    },
    { event: 'correct', payload: { word: 'giraffe' }, recipients: ['C'] },
    {
      event: 'announce',
      payload: { winner: 'C', word: 'giraffe' },
      recipients: ['A', 'B', 'C'],
    },
    {
      event: 'stroke',
      payload: { id: 2, pts: [[0.5, 0.6]], end: true },
      recipients: ['B'],
      senderExcluded: 'A',
      disconnected: ['C'],
    },
  ],
  disconnect: {
    label: 'C',
    serverObserved: true,
    connectedAfter: false,
    remaining: ['A', 'B'],
  },
};

async function loadClient(target: ScenarioTarget): Promise<CreateGameClient> {
  vi.resetModules();
  if (target.id === 'smocket') {
    vi.doMock('socket.io-client', () => import('smocket-client'));
  } else {
    vi.doUnmock('socket.io-client');
  }
  return (await import('../client')).createGameClient;
}

async function observe(target: ScenarioTarget): Promise<ScenarioObservation> {
  const observation = await runDualTargetScenario(target, await loadClient(target));
  expect(observation).toEqual(expected);
  return observation;
}

describe.sequential('the drawing and chat application on both socket targets', () => {
  it('runs over a real Socket.IO server and three real socket.io clients', async () => {
    await observe(realTarget);
  });

  it('runs in memory after socket.io-client is mapped to smocket-client', async () => {
    await observe(smocketTarget);
  });

  it('produces deeply equal complete observations', async () => {
    const real = await observe(realTarget);
    const smocket = await observe(smocketTarget);

    expect(smocket).toEqual(real);
  });
});
