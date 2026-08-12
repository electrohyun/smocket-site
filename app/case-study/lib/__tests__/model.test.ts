import { describe, expect, it } from 'vitest';
import observations from '../../../../content/case-study-observations.json';
import {
  classifyTranscriptLine,
  createCaseStudyModel,
  filterTranscript,
  initialExplorerState,
  reduceExplorerState,
} from '../model';
import { loadCaseStudySources } from '../source-evidence';

const model = createCaseStudyModel(observations, loadCaseStudySources());

describe('createCaseStudyModel', () => {
  it('derives the ordered target comparison from the observation record', () => {
    expect(model.targets.map((target) => target.id)).toEqual([
      'socket-io',
      'published-smocket',
      'handwritten',
    ]);
    expect(model.targets.map((target) => target.dependencyLabel)).toEqual([
      'socket.io@4.8.3, socket.io-client@4.8.3',
      'smocket@0.4.2',
      'None',
    ]);
    expect(model.targets.map((target) => target.bootstrapLines)).toEqual([61, 28, 28]);
    expect(model.targets.map((target) => target.mockLines)).toEqual([0, 0, 212]);
  });

  it('exposes one shared transcript with derived participants', () => {
    expect(model.transcript).toHaveLength(10);
    expect(model.participants).toEqual(['all', 'alice', 'bob', 'carol']);
    expect(model.transcript[0]).toMatchObject({
      participant: 'alice',
      category: 'welcome',
      text: '[alice] Welcome to #general.',
    });
  });

  it('provides structured observation categories without target duplication', () => {
    expect(model.structuredCategories.map((category) => category.id)).toEqual([
      'joins',
      'welcomes',
      'message',
      'authorization',
      'announcement',
      'departure',
    ]);
    expect(model.observation).toBe(observations.targets[0].result.observation);
  });

  it('derives authored target surfaces on one shared scale', () => {
    expect(model.authoredSurfaces).toEqual([
      {
        id: 'socket-io',
        label: 'Real Socket.IO',
        segments: [{ role: 'bootstrap', lines: 61 }],
        total: 61,
      },
      {
        id: 'published-smocket',
        label: 'Exact published Smocket',
        segments: [{ role: 'bootstrap', lines: 28 }],
        total: 28,
      },
      {
        id: 'handwritten',
        label: 'Handwritten mock',
        segments: [
          { role: 'bootstrap', lines: 28 },
          { role: 'mock implementation', lines: 212 },
        ],
        total: 240,
      },
    ]);
    expect(model.maxAuthoredLines).toBe(240);
  });

  it('maps the research-question comparison rows across all targets', () => {
    expect(model.comparisonRows.map((row) => row.id)).toEqual([
      'dependencies',
      'runtime-setup',
      'server-port',
      'activation-shutdown',
      'authored-files',
      'mock-ownership',
      'shared-branches',
      'debugging-surface',
      'change-locations',
      'simpler-here',
    ]);
    expect(model.comparisonRows.find((row) => row.id === 'shared-branches')?.values).toEqual({
      'socket-io': 'None in shared app, scenario, or assertions',
      'published-smocket': 'None in shared app, scenario, or assertions',
      handwritten: 'None in shared app, scenario, or assertions',
    });
  });

  it('derives pinned approach excerpts from the vendored source files', () => {
    expect(model.approachEvidence['socket-io'].excerpts[0]).toMatchObject({
      path: 'case-studies/chat-room/fixtures/socket-io/bootstrap.js',
      startLine: 1,
      endLine: 61,
    });
    expect(model.approachEvidence['socket-io'].excerpts[0].code).toContain(
      "import { createServer } from 'node:http';",
    );
    expect(model.approachEvidence.handwritten.excerpts.map((excerpt) => excerpt.id)).toEqual([
      'bootstrap',
      'routing',
      'acknowledgements',
      'disconnect-cleanup',
    ]);
    expect(model.approachEvidence.handwritten.omittedBehaviors).toEqual([
      'Namespaces',
      'Middleware',
      'Reconnection',
      'Transport behavior',
      'All other unexercised Socket.IO APIs',
    ]);
  });

  it('maps six workflow behaviors to shared and handwritten evidence', () => {
    expect(model.behaviorRows.map((row) => row.id)).toEqual([
      'join',
      'welcome',
      'message',
      'authorization',
      'announcement',
      'disconnect',
    ]);
    for (const row of model.behaviorRows) {
      expect(Object.values(row.results)).toEqual([
        'Passed · same observation',
        'Passed · same observation',
        'Passed · same observation',
      ]);
      expect(row.evidence.assertion.code.length).toBeGreaterThan(0);
      expect(row.evidence.application.code.length).toBeGreaterThan(0);
    }
    expect(model.behaviorRows.find((row) => row.id === 'message')?.evidence.handwritten?.code)
      .toContain('excludedSocketIds');
  });
});

describe('transcript classification', () => {
  it.each([
    ['[alice] Welcome to #general.', 'welcome'],
    ['[alice] Bob in #general: Hello, everyone!', 'message'],
    ['[bob] Announcement rejected: moderator-only', 'authorization'],
    ['[carol] Alice to #general, #support: Maintenance starts at 18:00.', 'announcement'],
    ['[alice] Bob left #general.', 'departure'],
  ] as const)('classifies %s as %s', (line, category) => {
    expect(classifyTranscriptLine(line)).toBe(category);
  });

  it('preserves order while combining participant and category filters', () => {
    expect(filterTranscript(model.transcript, 'bob', 'all').map((line) => line.text)).toEqual([
      '[bob] Welcome to #general.',
      '[bob] Announcement rejected: moderator-only',
      '[bob] Alice to #general, #support: Maintenance starts at 18:00.',
    ]);
    expect(filterTranscript(model.transcript, 'alice', 'announcement').map((line) => line.text)).toEqual([
      '[alice] Alice to #general, #support: Maintenance starts at 18:00.',
    ]);
    expect(filterTranscript(model.transcript, 'carol', 'message')).toEqual([]);
  });
});

describe('reduceExplorerState', () => {
  it('selects a target without changing the shared evidence filters', () => {
    expect(
      reduceExplorerState(model, initialExplorerState, {
        type: 'select-target',
        value: 'handwritten',
      }),
    ).toEqual({ ...initialExplorerState, targetId: 'handwritten' });
  });

  it('combines participant, transcript, and structured category selections', () => {
    const participantState = reduceExplorerState(model, initialExplorerState, {
      type: 'select-participant',
      value: 'bob',
    });
    const transcriptState = reduceExplorerState(model, participantState, {
      type: 'select-transcript-category',
      value: 'authorization',
    });
    const structuredState = reduceExplorerState(model, transcriptState, {
      type: 'select-structured-category',
      value: 'announcement',
    });

    expect(structuredState).toEqual({
      ...initialExplorerState,
      participant: 'bob',
      transcriptCategory: 'authorization',
      structuredCategory: 'announcement',
    });
  });

  it('resets transcript filters without changing the inspected target or structured category', () => {
    const selected = {
      targetId: 'published-smocket' as const,
      participant: 'carol',
      transcriptCategory: 'announcement' as const,
      structuredCategory: 'departure' as const,
    };

    expect(reduceExplorerState(model, selected, { type: 'reset-transcript' })).toEqual({
      ...selected,
      participant: 'all',
      transcriptCategory: 'all',
    });
  });

  it('ignores IDs that are absent from the validated model', () => {
    expect(
      reduceExplorerState(model, initialExplorerState, {
        type: 'select-target',
        value: 'unknown' as 'socket-io',
      }),
    ).toBe(initialExplorerState);
    expect(
      reduceExplorerState(model, initialExplorerState, {
        type: 'select-participant',
        value: 'mallory',
      }),
    ).toBe(initialExplorerState);
  });
});
