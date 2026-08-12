import { describe, expect, it } from 'vitest';
import { roadmap, roadmapLinks } from '../roadmap';

describe('public roadmap content', () => {
  it('points readers to the canonical roadmap and governing release sources', () => {
    expect(roadmapLinks.canonical).toBe(
      'https://github.com/electrohyun/smocket/blob/main/docs/roadmap.md',
    );
    expect(roadmapLinks.milestone).toBe('https://github.com/electrohyun/smocket/milestone/3');
    expect(roadmapLinks.adr0019).toBe(
      'https://github.com/electrohyun/smocket/blob/main/docs/decisions/0019-what-counts-as-a-breaking-change.md',
    );
  });

  it('keeps the documented guarantee and non-goals intact', () => {
    expect(roadmap.guarantee).toContain('stable observable behavior and public types');
    expect(roadmap.guarantee).toContain('documented Socket.IO logic-layer subset');
    expect(roadmap.nonGoals.map((item) => item.id)).toEqual([
      'transport',
      'heartbeat',
      'reconnection',
      'multi-server',
      'binary',
    ]);
  });

  it('classifies findings without turning them into live status', () => {
    expect(roadmap.classifications.map((item) => item.id)).toEqual([
      'required',
      'optional',
      'post-v1',
      'out-of-scope',
    ]);
    expect(JSON.stringify(roadmap)).not.toMatch(
      /percentage|progress|openIssues|closedIssues|dueDate/i,
    );
  });

  it('keeps the conditional release explicit in the documented sequence', () => {
    expect(roadmap.releaseStages.map((stage) => stage.id)).toEqual([
      'v0.4.2',
      'review',
      'classify',
      'v0.4.3',
      'v0.5.0',
      'stabilization',
      'v1.0.0',
    ]);
    expect(roadmap.releaseStages.find((stage) => stage.id === 'v0.5.0')).toMatchObject({
      label: 'Conditional v0.5.0',
      conditional: true,
    });
    expect(roadmap.releaseStages.map((stage) => stage.next)).toEqual([
      'Begin Fidelity & Extensibility review',
      'Classify each finding',
      'Route required patch work to v0.4.3',
      'Ask whether a pre-v1 minor is required',
      'Rejoin the path at stabilization',
      'Finalize the documented v1 guarantee',
      'Stable destination',
    ]);
  });

  it('links every material dependency back to smocket', () => {
    const hrefs = roadmap.dependencies.flatMap((group) => group.links.map((link) => link.href));

    expect(hrefs).toEqual(
      expect.arrayContaining([
        'https://github.com/electrohyun/smocket/issues/113',
        'https://github.com/electrohyun/smocket/issues/208',
        'https://github.com/electrohyun/smocket/issues/218',
        'https://github.com/electrohyun/smocket/issues/250',
        'https://github.com/electrohyun/smocket/issues/254',
        'https://github.com/electrohyun/smocket/blob/main/docs/decisions/0025-built-in-adapter-observation-stays-rooms-only.md',
      ]),
    );
  });
});
