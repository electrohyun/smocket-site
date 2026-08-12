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

export function createCaseStudyModel(input: CaseStudyRecord): CaseStudyModel {
  const targets = input.targets.map((target) => ({
    id: target.id as TargetId,
    label: target.label,
    fixture: target.fixture,
    dependencyLabel: dependencyLabel(target.dependencies),
    bootstrapLines: sourceLines(target.files, 'bootstrap'),
    mockLines: sourceLines(target.files, 'mock implementation'),
    assertions: target.result.assertions,
    repeatedRunMatches: target.result.repeatedRunMatches,
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

  return {
    record: input,
    targets: TARGET_IDS.map((id) => targets.find((target) => target.id === id)!),
    observation,
    transcript,
    participants,
    transcriptCategories: TRANSCRIPT_CATEGORIES,
    structuredCategories: STRUCTURED_CATEGORIES,
  };
}
