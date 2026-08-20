import { describe, expect, it } from 'vitest';
import observations from '../../../content/case-study-observations.json';
import { createEvidenceOverview, unmeasuredTargets } from '../model';
import { parseEvidenceRecord } from '../schema';

function cloneObservation(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(observations)) as Record<string, unknown>;
}

describe('evidence record boundary', () => {
  it('accepts the pinned chat-room record and exposes the shared schema fields', () => {
    const record = parseEvidenceRecord(observations);

    expect(record.schemaVersion).toBe(1);
    expect(record.caseStudy).toBe('moderated-chat-room');
    expect(record.targets).toHaveLength(3);
    expect(record.claimBoundary).toContain('recorded chat-room workflow');
  });

  it('rejects malformed generated records before rendering', () => {
    const malformed = cloneObservation();
    const targets = malformed.targets as Array<Record<string, unknown>>;
    const result = targets[0].result as Record<string, unknown>;
    const observation = result.observation as Record<string, unknown>;
    delete observation.transcript;

    expect(() => parseEvidenceRecord(malformed)).toThrow(
      'targets[0].result.observation.transcript must be an array',
    );
  });

  it('rejects duplicate target IDs', () => {
    const malformed = cloneObservation();
    const targets = malformed.targets as Array<Record<string, unknown>>;
    targets[1].id = targets[0].id;

    expect(() => parseEvidenceRecord(malformed)).toThrow('targets[1].id must be unique');
  });
});

describe('evidence overview', () => {
  it('derives landing counts, exact targets, and match state from the record', () => {
    const overview = createEvidenceOverview();

    expect(overview.measuredReportCount).toBe(1);
    expect(overview.comparedTargetCount).toBe(3);
    expect(overview.reports[0]).toMatchObject({
      id: 'moderated-chat-room',
      route: '/case-study',
      observationsMatch: true,
      schemaVersion: 1,
    });
    expect(overview.reports[0].targets.map((target) => target.dependencies)).toEqual([
      ['socket.io@4.8.3', 'socket.io-client@4.8.3'],
      ['smocket@0.4.2'],
      [],
    ]);
    expect(overview.unmeasuredTargets).toEqual(unmeasuredTargets);
  });

  it('accepts a second scenario through the registry boundary without changing the renderer', () => {
    const second = cloneObservation();
    second.caseStudy = 'second-recorded-scenario';
    const overview = createEvidenceOverview([
      { title: 'First', route: '/case-study', record: observations },
      { title: 'Second', route: '/case-study/second', record: second },
    ]);

    expect(overview.reports.map((report) => report.id)).toEqual([
      'moderated-chat-room',
      'second-recorded-scenario',
    ]);
    expect(overview.measuredReportCount).toBe(2);
  });
});
