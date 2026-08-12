import {
  caseStudyTargetDetails,
  handwrittenBehaviorBoundary,
  pinnedSourceUrl,
} from '../../../content/case-study';
import type { CaseStudySources, SourcePath } from './source-evidence';

export type TargetId = 'socket-io' | 'published-smocket' | 'handwritten';
export type ParticipantFilter = 'all' | string;
export type TranscriptCategory =
  | 'all'
  | 'welcome'
  | 'message'
  | 'authorization'
  | 'announcement'
  | 'departure';

interface SourceFile {
  path: string;
  role: string;
  lines: number;
  sha256: string;
}

export interface JoinObservation {
  participantId: string;
  channel: string;
  acknowledgement: { accepted: boolean; channel: string };
}

export interface WelcomeObservation {
  channel: string;
  text: string;
}

export interface MessageObservation {
  channel: string;
  from: string;
  text: string;
}

export interface AnnouncementObservation {
  channels: string[];
  from: string;
  text: string;
}

export interface DepartureObservation {
  channel: string;
  participant: string;
}

export interface StructuredObservation {
  joins: JoinObservation[];
  welcomes: Record<string, WelcomeObservation[]>;
  messages: Record<string, MessageObservation[]>;
  rejectedAnnouncement: { accepted: boolean; reason: string };
  announcementAcknowledgement: { accepted: boolean; channels: string[] };
  announcements: Record<string, AnnouncementObservation[]>;
  departures: Record<string, DepartureObservation[]>;
  transcript: string[];
}

interface TargetRecord {
  id: string;
  label: string;
  fixture: string;
  dependencies: Record<string, string | undefined>;
  files: SourceFile[];
  result: {
    assertions: string;
    repeatedRunMatches: boolean;
    observation: StructuredObservation;
  };
}

export interface CaseStudyRecord {
  schemaVersion: number;
  caseStudy: string;
  recordedAt: string;
  environment: {
    platform: string;
    architecture: string;
    node: string;
    npm: string;
  };
  reproduction: {
    run: string;
    record: string;
    check: string;
    targets: Record<string, string>;
  };
  measurements: { lineCount: string };
  application: {
    source: string;
    files: SourceFile[];
    combinedSha256: string;
  };
  targets: TargetRecord[];
  claimBoundary: string;
}

export interface TargetSummary {
  id: TargetId;
  label: string;
  fixture: string;
  dependencyLabel: string;
  bootstrapLines: number;
  mockLines: number;
  assertions: string;
  repeatedRunMatches: boolean;
  authoredFiles: SourceFile[];
}

export interface AuthoredSurface {
  id: TargetId;
  label: string;
  segments: { role: string; lines: number }[];
  total: number;
}

export interface ComparisonRow {
  id: string;
  label: string;
  values: Record<TargetId, string>;
}

export interface SourceExcerpt {
  id: string;
  label: string;
  path: SourcePath;
  startLine: number;
  endLine: number;
  responsibility: string;
  code: string;
  sourceUrl: string;
}

export interface ApproachEvidence {
  id: TargetId;
  label: string;
  dependencyLabel: string;
  setup: string;
  authoredFiles: SourceFile[];
  debugging: string;
  excerpts: SourceExcerpt[];
  supportedBehaviors: readonly string[];
  omittedBehaviors: readonly string[];
}

export type BehaviorId =
  | 'join'
  | 'welcome'
  | 'message'
  | 'authorization'
  | 'announcement'
  | 'disconnect';

export interface BehaviorRow {
  id: BehaviorId;
  label: string;
  structuredObservation: unknown;
  results: Record<TargetId, string>;
  evidence: {
    assertion: SourceExcerpt;
    application: SourceExcerpt;
    handwritten?: SourceExcerpt;
  };
}

export interface TranscriptLine {
  id: number;
  participant: string;
  category: Exclude<TranscriptCategory, 'all'>;
  text: string;
}

export interface StructuredCategory {
  id: StructuredCategoryId;
  label: string;
}

export type StructuredCategoryId =
  | 'joins'
  | 'welcomes'
  | 'message'
  | 'authorization'
  | 'announcement'
  | 'departure';

export interface ExplorerState {
  targetId: TargetId;
  participant: ParticipantFilter;
  transcriptCategory: TranscriptCategory;
  structuredCategory: StructuredCategoryId;
}

export type ExplorerAction =
  | { type: 'select-target'; value: TargetId }
  | { type: 'select-participant'; value: string }
  | { type: 'select-transcript-category'; value: TranscriptCategory }
  | { type: 'select-structured-category'; value: StructuredCategoryId }
  | { type: 'reset-transcript' };

export interface CaseStudyModel {
  record: CaseStudyRecord;
  targets: TargetSummary[];
  observation: StructuredObservation;
  transcript: TranscriptLine[];
  participants: ParticipantFilter[];
  transcriptCategories: TranscriptCategory[];
  structuredCategories: StructuredCategory[];
  authoredSurfaces: AuthoredSurface[];
  maxAuthoredLines: number;
  comparisonRows: ComparisonRow[];
  approachEvidence: Record<TargetId, ApproachEvidence>;
  behaviorRows: BehaviorRow[];
}

const TARGET_IDS: TargetId[] = ['socket-io', 'published-smocket', 'handwritten'];

export const TRANSCRIPT_CATEGORIES: TranscriptCategory[] = [
  'all',
  'welcome',
  'message',
  'authorization',
  'announcement',
  'departure',
];

export const STRUCTURED_CATEGORIES: StructuredCategory[] = [
  { id: 'joins', label: 'Acknowledged joins' },
  { id: 'welcomes', label: 'Private welcomes' },
  { id: 'message', label: 'Room message' },
  { id: 'authorization', label: 'Authorization' },
  { id: 'announcement', label: 'Union announcement' },
  { id: 'departure', label: 'Disconnect' },
];

export const initialExplorerState: ExplorerState = {
  targetId: 'socket-io',
  participant: 'all',
  transcriptCategory: 'all',
  structuredCategory: 'joins',
};

function sourceLines(files: SourceFile[], role: string): number {
  return files.find((file) => file.role === role)?.lines ?? 0;
}

function dependencyLabel(dependencies: Record<string, string | undefined>): string {
  const entries = Object.entries(dependencies).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  return entries.length ? entries.map(([name, version]) => `${name}@${version}`).join(', ') : 'None';
}

function excerpt(
  sources: CaseStudySources,
  definition: Omit<SourceExcerpt, 'code' | 'sourceUrl'>,
): SourceExcerpt {
  const code = sources[definition.path]
    .split('\n')
    .slice(definition.startLine - 1, definition.endLine)
    .join('\n');
  return {
    ...definition,
    code,
    sourceUrl: pinnedSourceUrl(definition.path, definition.startLine, definition.endLine),
  };
}

const excerptDefinitions = {
  realBootstrap: {
    id: 'bootstrap',
    label: 'Real Socket.IO bootstrap',
    path: 'case-studies/chat-room/fixtures/socket-io/bootstrap.js',
    startLine: 1,
    endLine: 61,
    responsibility: 'HTTP server, ephemeral port, client activation, and shutdown.',
  },
  smocketBootstrap: {
    id: 'bootstrap',
    label: 'Published Smocket bootstrap',
    path: 'case-studies/chat-room/fixtures/published-smocket/bootstrap.js',
    startLine: 1,
    endLine: 28,
    responsibility: 'Published in-memory Server/connect wiring and shutdown.',
  },
  handwrittenBootstrap: {
    id: 'bootstrap',
    label: 'Handwritten bootstrap',
    path: 'case-studies/chat-room/fixtures/handwritten/bootstrap.js',
    startLine: 1,
    endLine: 28,
    responsibility: 'In-memory fixture wiring to the application-owned mock.',
  },
  handwrittenRouting: {
    id: 'routing',
    label: 'Room routing and sender exclusion',
    path: 'case-studies/chat-room/fixtures/handwritten/handwritten-socket-io.js',
    startLine: 33,
    endLine: 82,
    responsibility: 'Room union routing, deduplication, joins, and sender exclusion.',
  },
  handwrittenAck: {
    id: 'acknowledgements',
    label: 'Acknowledgements',
    path: 'case-studies/chat-room/fixtures/handwritten/handwritten-socket-io.js',
    startLine: 132,
    endLine: 149,
    responsibility: 'Promise-based client acknowledgement delivery and rejection path.',
  },
  handwrittenDisconnect: {
    id: 'disconnect-cleanup',
    label: 'Disconnect cleanup',
    path: 'case-studies/chat-room/fixtures/handwritten/handwritten-socket-io.js',
    startLine: 92,
    endLine: 108,
    responsibility: 'Disconnecting notification, room membership cleanup, and client finalization.',
  },
} as const satisfies Record<string, Omit<SourceExcerpt, 'code' | 'sourceUrl'>>;

const behaviorDefinitions: Array<{
  id: BehaviorId;
  label: string;
  observation: (value: StructuredObservation) => unknown;
  assertion: [number, number];
  application: [number, number];
  handwritten: keyof typeof excerptDefinitions;
}> = [
  { id: 'join', label: 'Acknowledged joins', observation: (o) => o.joins, assertion: [9, 31], application: [20, 32], handwritten: 'handwrittenRouting' },
  { id: 'welcome', label: 'Private welcomes', observation: (o) => o.welcomes, assertion: [32, 39], application: [20, 32], handwritten: 'handwrittenRouting' },
  { id: 'message', label: 'Room message delivery', observation: (o) => o.messages, assertion: [40, 44], application: [34, 46], handwritten: 'handwrittenRouting' },
  { id: 'authorization', label: 'Authorization rejection', observation: (o) => ({ rejected: o.rejectedAnnouncement, accepted: o.announcementAcknowledgement }), assertion: [45, 52], application: [48, 61], handwritten: 'handwrittenAck' },
  { id: 'announcement', label: 'Multi-room union announcement', observation: (o) => o.announcements, assertion: [49, 57], application: [48, 61], handwritten: 'handwrittenRouting' },
  { id: 'disconnect', label: 'Disconnect notification', observation: (o) => o.departures, assertion: [58, 63], application: [63, 75], handwritten: 'handwrittenDisconnect' },
];

function participantFromLine(line: string): string {
  return /^\[([^\]]+)\]/.exec(line)?.[1] ?? 'unknown';
}

export function classifyTranscriptLine(
  line: string,
): Exclude<TranscriptCategory, 'all'> {
  if (line.includes('Welcome to #')) return 'welcome';
  if (line.includes('Announcement rejected:')) return 'authorization';
  if (line.includes(' left #')) return 'departure';
  if (line.includes(' to #')) return 'announcement';
  return 'message';
}

export function filterTranscript(
  transcript: TranscriptLine[],
  participant: ParticipantFilter,
  category: TranscriptCategory,
): TranscriptLine[] {
  return transcript.filter(
    (line) =>
      (participant === 'all' || line.participant === participant) &&
      (category === 'all' || line.category === category),
  );
}

export function reduceExplorerState(
  model: CaseStudyModel,
  state: ExplorerState,
  action: ExplorerAction,
): ExplorerState {
  switch (action.type) {
    case 'select-target':
      return model.targets.some((target) => target.id === action.value)
        ? { ...state, targetId: action.value }
        : state;
    case 'select-participant':
      return model.participants.includes(action.value)
        ? { ...state, participant: action.value }
        : state;
    case 'select-transcript-category':
      return model.transcriptCategories.includes(action.value)
        ? { ...state, transcriptCategory: action.value }
        : state;
    case 'select-structured-category':
      return model.structuredCategories.some((category) => category.id === action.value)
        ? { ...state, structuredCategory: action.value }
        : state;
    case 'reset-transcript':
      return { ...state, participant: 'all', transcriptCategory: 'all' };
  }
}

export function createCaseStudyModel(input: CaseStudyRecord, sources?: CaseStudySources): CaseStudyModel {
  const targets = input.targets.map((target) => ({
    id: target.id as TargetId,
    label: target.label,
    fixture: target.fixture,
    dependencyLabel: dependencyLabel(target.dependencies),
    bootstrapLines: sourceLines(target.files, 'bootstrap'),
    mockLines: sourceLines(target.files, 'mock implementation'),
    assertions: target.result.assertions,
    repeatedRunMatches: target.result.repeatedRunMatches,
    authoredFiles: target.files.filter(
      (file) => file.role === 'bootstrap' || file.role === 'mock implementation',
    ),
  }));

  const observation = input.targets[0].result.observation;
  const transcript = observation.transcript.map((text, id) => ({
    id,
    participant: participantFromLine(text),
    category: classifyTranscriptLine(text),
    text,
  }));
  const participants = [
    'all',
    ...Array.from(new Set(transcript.map((line) => line.participant))),
  ];

  const orderedTargets = TARGET_IDS.map((id) => targets.find((target) => target.id === id)!);
  const authoredSurfaces = orderedTargets.map((target) => ({
    id: target.id,
    label: target.label,
    segments: target.authoredFiles.map((file) => ({ role: file.role, lines: file.lines })),
    total: target.authoredFiles.reduce((sum, file) => sum + file.lines, 0),
  }));
  const authoredFileLabel = (target: TargetSummary) =>
    target.authoredFiles.map((file) => `${file.path} (${file.lines})`).join(' + ');
  const values = (get: (target: TargetSummary) => string): Record<TargetId, string> =>
    Object.fromEntries(orderedTargets.map((target) => [target.id, get(target)])) as Record<TargetId, string>;
  const comparisonRows: ComparisonRow[] = [
    { id: 'dependencies', label: 'Exact dependencies / clean install', values: values((target) => target.dependencyLabel) },
    { id: 'runtime-setup', label: 'Bootstrap / runtime setup', values: values((target) => caseStudyTargetDetails[target.id].setup) },
    { id: 'server-port', label: 'HTTP server / port ownership', values: values((target) => caseStudyTargetDetails[target.id].serverPort) },
    { id: 'activation-shutdown', label: 'Client activation / shutdown', values: values((target) => caseStudyTargetDetails[target.id].lifecycle) },
    { id: 'authored-files', label: 'Authored fixture files', values: values(authoredFileLabel) },
    { id: 'mock-ownership', label: 'Application-owned mock', values: values((target) => caseStudyTargetDetails[target.id].mockOwnership) },
    { id: 'shared-branches', label: 'Shared branches / workarounds', values: values(() => 'None in shared app, scenario, or assertions') },
    { id: 'debugging-surface', label: 'Explicit failure / debugging surface', values: values((target) => caseStudyTargetDetails[target.id].debugging) },
    { id: 'change-locations', label: 'Locations changed with wiring / semantics', values: values((target) => caseStudyTargetDetails[target.id].changeLocations) },
    { id: 'simpler-here', label: 'Directly observed simpler aspect', values: values((target) => caseStudyTargetDetails[target.id].simpler) },
  ];

  const emptyEvidence = {} as Record<TargetId, ApproachEvidence>;
  const approachEvidence = sources
    ? orderedTargets.reduce((result, target) => {
        const definitions =
          target.id === 'socket-io'
            ? [excerptDefinitions.realBootstrap]
            : target.id === 'published-smocket'
              ? [excerptDefinitions.smocketBootstrap]
              : [
                  excerptDefinitions.handwrittenBootstrap,
                  excerptDefinitions.handwrittenRouting,
                  excerptDefinitions.handwrittenAck,
                  excerptDefinitions.handwrittenDisconnect,
                ];
        result[target.id] = {
          id: target.id,
          label: target.label,
          dependencyLabel: target.dependencyLabel,
          setup: caseStudyTargetDetails[target.id].setup,
          authoredFiles: target.authoredFiles,
          debugging: caseStudyTargetDetails[target.id].debugging,
          excerpts: definitions.map((definition) => excerpt(sources, definition)),
          supportedBehaviors:
            target.id === 'handwritten' ? handwrittenBehaviorBoundary.supported : [],
          omittedBehaviors:
            target.id === 'handwritten' ? handwrittenBehaviorBoundary.omitted : [],
        };
        return result;
      }, emptyEvidence)
    : emptyEvidence;

  const resultLabel = 'Passed · same observation';
  const behaviorRows: BehaviorRow[] = sources
    ? behaviorDefinitions.map((definition) => ({
        id: definition.id,
        label: definition.label,
        structuredObservation: definition.observation(observation),
        results: {
          'socket-io': resultLabel,
          'published-smocket': resultLabel,
          handwritten: resultLabel,
        },
        evidence: {
          assertion: excerpt(sources, {
            id: `${definition.id}-assertion`,
            label: `${definition.label}: expected observation`,
            path: 'examples/chat-room/assertions.js',
            startLine: definition.assertion[0],
            endLine: definition.assertion[1],
            responsibility: 'Shared expected value used by all three targets.',
          }),
          application: excerpt(sources, {
            id: `${definition.id}-application`,
            label: `${definition.label}: application handler`,
            path: 'examples/chat-room/app.js',
            startLine: definition.application[0],
            endLine: definition.application[1],
            responsibility: 'Shared application code used without a target branch.',
          }),
          handwritten: excerpt(sources, excerptDefinitions[definition.handwritten]),
        },
      }))
    : [];

  return {
    record: input,
    targets: orderedTargets,
    observation,
    transcript,
    participants,
    transcriptCategories: TRANSCRIPT_CATEGORIES,
    structuredCategories: STRUCTURED_CATEGORIES,
    authoredSurfaces,
    maxAuthoredLines: Math.max(...authoredSurfaces.map((surface) => surface.total)),
    comparisonRows,
    approachEvidence,
    behaviorRows,
  };
}
