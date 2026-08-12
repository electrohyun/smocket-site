import { describe, expect, it } from 'vitest';
import observations from '../../../../content/case-study-observations.json';
import {
  classifyTranscriptLine,
  createCaseStudyModel,
  filterTranscript,
} from '../model';

const model = createCaseStudyModel(observations);

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
