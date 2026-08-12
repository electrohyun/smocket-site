import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const EXPECTED_OBSERVATION_SHA256 =
  '414b07fb27b70cc836d8b71d78d63a0f530d2cae28dbd32b60e77462a64f4bad';
export const EXPECTED_APPLICATION_SHA256 =
  'e3884c42af5987b4db154c7f13538054e405e12b496803b8d321ac9a409b62d5';

const EXPECTED_TARGET_IDS = ['handwritten', 'published-smocket', 'socket-io'];

function fail(message) {
  throw new Error(`Invalid case study observations: ${message}`);
}

function object(value, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${path} must be an object`);
  }
  return value;
}

function array(value, path) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  return value;
}

function string(value, path) {
  if (typeof value !== 'string' || value.length === 0) fail(`${path} must be a non-empty string`);
  return value;
}

function validateObservation(observation, path) {
  const value = object(observation, path);
  array(value.joins, `${path}.joins`);
  object(value.welcomes, `${path}.welcomes`);
  object(value.messages, `${path}.messages`);
  object(value.rejectedAnnouncement, `${path}.rejectedAnnouncement`);
  object(value.announcementAcknowledgement, `${path}.announcementAcknowledgement`);
  object(value.announcements, `${path}.announcements`);
  object(value.departures, `${path}.departures`);
  const transcript = array(value.transcript, `${path}.transcript`);
  transcript.forEach((line, index) => string(line, `${path}.transcript[${index}]`));
}

export function validateObservationBytes(bytes, expectedHash = EXPECTED_OBSERVATION_SHA256) {
  const actualHash = createHash('sha256').update(bytes).digest('hex');
  if (actualHash !== expectedHash) {
    fail(`SHA-256 mismatch: expected ${expectedHash}, received ${actualHash}`);
  }

  let record;
  try {
    record = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(`JSON could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
  }

  object(record, 'root');
  if (record.schemaVersion !== 1) fail('schemaVersion must be 1');
  if (record.caseStudy !== 'moderated-chat-room') {
    fail('caseStudy must be moderated-chat-room');
  }
  string(record.recordedAt, 'recordedAt');

  const environment = object(record.environment, 'environment');
  for (const key of ['platform', 'architecture', 'node', 'npm']) {
    string(environment[key], `environment.${key}`);
  }

  const reproduction = object(record.reproduction, 'reproduction');
  for (const key of ['run', 'record', 'check']) {
    string(reproduction[key], `reproduction.${key}`);
  }
  const reproductionTargets = object(reproduction.targets, 'reproduction.targets');
  for (const id of EXPECTED_TARGET_IDS) {
    string(reproductionTargets[id], `reproduction.targets.${id}`);
  }

  const application = object(record.application, 'application');
  string(application.source, 'application.source');
  array(application.files, 'application.files');
  if (application.combinedSha256 !== EXPECTED_APPLICATION_SHA256) {
    fail(
      `application SHA-256 mismatch: expected ${EXPECTED_APPLICATION_SHA256}, received ${application.combinedSha256}`,
    );
  }

  const targets = array(record.targets, 'targets');
  const targetIds = targets.map((target, index) => string(object(target, `targets[${index}]`).id, `targets[${index}].id`));
  const sortedIds = [...targetIds].sort();
  if (!isDeepStrictEqual(sortedIds, EXPECTED_TARGET_IDS)) {
    fail(`target IDs must be ${EXPECTED_TARGET_IDS.join(', ')}`);
  }

  for (const [index, target] of targets.entries()) {
    const path = `targets[${index}]`;
    string(target.label, `${path}.label`);
    string(target.fixture, `${path}.fixture`);
    object(target.dependencies, `${path}.dependencies`);
    array(target.files, `${path}.files`);
    const result = object(target.result, `${path}.result`);
    if (result.assertions !== 'passed') fail(`${target.id} assertions must be passed`);
    if (result.repeatedRunMatches !== true) fail(`${target.id} repeated run must match`);
    validateObservation(result.observation, `${path}.result.observation`);
  }

  const referenceObservation = targets[0].result.observation;
  for (const target of targets.slice(1)) {
    if (!isDeepStrictEqual(referenceObservation, target.result.observation)) {
      fail(`observations differ between ${targets[0].id} and ${target.id}`);
    }
  }

  string(record.claimBoundary, 'claimBoundary');
  return record;
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  const observationUrl = new URL('../content/case-study-observations.json', import.meta.url);
  const bytes = await readFile(observationUrl);
  const record = validateObservationBytes(bytes);
  process.stdout.write(
    `Verified case study observation SHA-256: ${EXPECTED_OBSERVATION_SHA256}\n` +
      `Verified application source SHA-256: ${record.application.combinedSha256}\n`,
  );
}
