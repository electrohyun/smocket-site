import chatRoomObservation from '../../content/case-study-observations.json';
import { parseEvidenceRecord, type EvidenceRecord } from './schema';

export interface EvidenceInput {
  title: string;
  route: string;
  record: unknown;
}

export interface EvidenceTargetSummary {
  id: string;
  label: string;
  dependencies: string[];
}

export interface EvidenceReportSummary {
  id: string;
  title: string;
  route: string;
  recordedDate: string;
  schemaVersion: number;
  targets: EvidenceTargetSummary[];
  observationsMatch: boolean;
  environment: string;
  lineCountDefinition: string;
  claimBoundary: string;
}

export interface EvidenceOverview {
  reports: EvidenceReportSummary[];
  measuredReportCount: number;
  comparedTargetCount: number;
  unmeasuredTargets: string[];
}

export const evidenceInputs: EvidenceInput[] = [
  {
    title: 'Moderated chat-room workflow',
    route: '/case-study',
    record: chatRoomObservation,
  },
];

export const unmeasuredTargets = [
  'mock-socket',
  '@mswjs/socket.io-binding',
  'socket.io-mock',
] as const;

function dependencies(record: EvidenceRecord['targets'][number]): string[] {
  return Object.entries(record.dependencies)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([name, version]) => `${name}@${version}`);
}

function sameObservation(record: EvidenceRecord): boolean {
  const expected = JSON.stringify(record.targets[0].result.observation);
  return record.targets.every(
    (target) =>
      target.result.assertions === 'passed' &&
      target.result.repeatedRunMatches &&
      JSON.stringify(target.result.observation) === expected,
  );
}

export function createEvidenceOverview(inputs: EvidenceInput[] = evidenceInputs): EvidenceOverview {
  const reports = inputs.map((input) => {
    const record = parseEvidenceRecord(input.record);
    return {
      id: record.caseStudy,
      title: input.title,
      route: input.route,
      recordedDate: record.recordedAt.slice(0, 10),
      schemaVersion: record.schemaVersion,
      targets: record.targets.map((target) => ({
        id: target.id,
        label: target.label,
        dependencies: dependencies(target),
      })),
      observationsMatch: sameObservation(record),
      environment: `${record.environment.platform} ${record.environment.architecture} · Node ${record.environment.node}`,
      lineCountDefinition: record.measurements.lineCount,
      claimBoundary: record.claimBoundary,
    };
  });

  return {
    reports,
    measuredReportCount: reports.length,
    comparedTargetCount: new Set(reports.flatMap((report) => report.targets.map((target) => target.id)))
      .size,
    unmeasuredTargets: [...unmeasuredTargets],
  };
}
