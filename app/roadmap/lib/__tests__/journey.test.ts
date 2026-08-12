import { describe, expect, it } from 'vitest';
import { deriveJourneyState } from '../journey';

const stops = [
  { id: 'guarantee', top: 800 },
  { id: 'classification', top: 1800 },
  { id: 'sequence', top: 3000 },
  { id: 'dependencies', top: 5200 },
  { id: 'sources', top: 6800 },
] as const;

describe('deriveJourneyState', () => {
  it('starts at the first stop with zero reading position', () => {
    expect(deriveJourneyState(0, 900, 8000, stops)).toEqual({
      progress: 0,
      currentId: 'guarantee',
    });
  });

  it('selects the last stop above the viewport focus line', () => {
    const state = deriveJourneyState(2800, 900, 8000, stops);

    expect(state.progress).toBeCloseTo(2800 / 7100, 4);
    expect(state.currentId).toBe('sequence');
  });

  it('clamps the end of the document to the final stop', () => {
    expect(deriveJourneyState(9000, 900, 8000, stops)).toEqual({
      progress: 1,
      currentId: 'sources',
    });
  });

  it('returns a stable empty state before stop geometry is available', () => {
    expect(deriveJourneyState(300, 900, 8000, [])).toEqual({
      progress: 300 / 7100,
      currentId: '',
    });
  });
});
