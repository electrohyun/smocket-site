export interface EvidenceSourceFile {
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

export interface EvidenceTargetRecord {
  id: string;
  label: string;
  fixture: string;
  dependencies: Record<string, string | undefined>;
  files: EvidenceSourceFile[];
  result: {
    assertions: string;
    repeatedRunMatches: boolean;
    observation: StructuredObservation;
  };
}

export interface EvidenceRecord {
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
    files: EvidenceSourceFile[];
    combinedSha256: string;
  };
  targets: EvidenceTargetRecord[];
  claimBoundary: string;
}

type UnknownRecord = Record<string, unknown>;

function fail(path: string, expectation: string): never {
  throw new Error(`Invalid observation record: ${path} ${expectation}`);
}

function object(value: unknown, path: string): UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(path, 'must be an object');
  }
  return value as UnknownRecord;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  return value;
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    fail(path, 'must be a non-empty string');
  }
  return value;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'must be a boolean');
  return value;
}

function sourceFile(value: unknown, path: string): void {
  const file = object(value, path);
  string(file.path, `${path}.path`);
  string(file.role, `${path}.role`);
  if (!Number.isInteger(file.lines) || Number(file.lines) < 0) {
    fail(`${path}.lines`, 'must be a non-negative integer');
  }
  string(file.sha256, `${path}.sha256`);
}

function stringMap(value: unknown, path: string): void {
  for (const [key, entry] of Object.entries(object(value, path))) {
    string(entry, `${path}.${key}`);
  }
}

function observation(value: unknown, path: string): void {
  const entry = object(value, path);
  array(entry.joins, `${path}.joins`);
  object(entry.welcomes, `${path}.welcomes`);
  object(entry.messages, `${path}.messages`);
  object(entry.rejectedAnnouncement, `${path}.rejectedAnnouncement`);
  object(entry.announcementAcknowledgement, `${path}.announcementAcknowledgement`);
  object(entry.announcements, `${path}.announcements`);
  object(entry.departures, `${path}.departures`);
  array(entry.transcript, `${path}.transcript`).forEach((line, index) =>
    string(line, `${path}.transcript[${index}]`),
  );
}

/**
 * Checks the shared, scenario-agnostic boundary consumed by the site. The
 * pinned chat-room validator adds stricter hash and target checks on top.
 */
export function parseEvidenceRecord(value: unknown): EvidenceRecord {
  const record = object(value, 'root');
  if (!Number.isInteger(record.schemaVersion) || Number(record.schemaVersion) < 1) {
    fail('schemaVersion', 'must be a positive integer');
  }
  string(record.caseStudy, 'caseStudy');
  string(record.recordedAt, 'recordedAt');

  const environment = object(record.environment, 'environment');
  for (const key of ['platform', 'architecture', 'node', 'npm']) {
    string(environment[key], `environment.${key}`);
  }

  const reproduction = object(record.reproduction, 'reproduction');
  for (const key of ['run', 'record', 'check']) {
    string(reproduction[key], `reproduction.${key}`);
  }
  stringMap(reproduction.targets, 'reproduction.targets');

  const measurements = object(record.measurements, 'measurements');
  string(measurements.lineCount, 'measurements.lineCount');

  const application = object(record.application, 'application');
  string(application.source, 'application.source');
  array(application.files, 'application.files').forEach((file, index) =>
    sourceFile(file, `application.files[${index}]`),
  );
  string(application.combinedSha256, 'application.combinedSha256');

  const ids = new Set<string>();
  const targets = array(record.targets, 'targets');
  if (targets.length === 0) fail('targets', 'must contain at least one target');
  targets.forEach((value, index) => {
    const path = `targets[${index}]`;
    const target = object(value, path);
    const id = string(target.id, `${path}.id`);
    if (ids.has(id)) fail(`${path}.id`, 'must be unique');
    ids.add(id);
    string(target.label, `${path}.label`);
    string(target.fixture, `${path}.fixture`);
    const dependencies = object(target.dependencies, `${path}.dependencies`);
    for (const [name, version] of Object.entries(dependencies)) {
      if (version !== undefined) string(version, `${path}.dependencies.${name}`);
    }
    array(target.files, `${path}.files`).forEach((file, fileIndex) =>
      sourceFile(file, `${path}.files[${fileIndex}]`),
    );
    const result = object(target.result, `${path}.result`);
    string(result.assertions, `${path}.result.assertions`);
    boolean(result.repeatedRunMatches, `${path}.result.repeatedRunMatches`);
    observation(result.observation, `${path}.result.observation`);
  });

  string(record.claimBoundary, 'claimBoundary');
  return value as EvidenceRecord;
}
