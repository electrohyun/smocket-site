import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EXPECTED_OBSERVATION_SHA256,
  validateObservationBytes,
} from '../validate-case-study-observations.mjs';

const observationPath = fileURLToPath(
  new URL('../../content/case-study-observations.json', import.meta.url),
);
const canonicalBytes = await readFile(observationPath);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function mutate(change) {
  const record = JSON.parse(canonicalBytes.toString('utf8'));
  change(record);
  const bytes = Buffer.from(JSON.stringify(record));
  return { bytes, hash: sha256(bytes) };
}

describe('validateObservationBytes', () => {
  it('accepts the pinned observation artifact', () => {
    const record = validateObservationBytes(canonicalBytes);

    expect(record.caseStudy).toBe('moderated-chat-room');
    expect(record.targets).toHaveLength(3);
    expect(sha256(canonicalBytes)).toBe(EXPECTED_OBSERVATION_SHA256);
  });

  it('rejects bytes that do not match the pinned SHA-256', () => {
    const changed = Buffer.concat([canonicalBytes, Buffer.from(' ')]);

    expect(() => validateObservationBytes(changed)).toThrow(/SHA-256/);
  });

  it('rejects an unsupported schema version', () => {
    const { bytes, hash } = mutate((record) => {
      record.schemaVersion = 2;
    });

    expect(() => validateObservationBytes(bytes, hash)).toThrow(/schemaVersion/);
  });

  it('rejects a changed combined application hash', () => {
    const { bytes, hash } = mutate((record) => {
      record.application.combinedSha256 = '0'.repeat(64);
    });

    expect(() => validateObservationBytes(bytes, hash)).toThrow(/application.*SHA-256/i);
  });

  it('rejects a missing required observation field', () => {
    const { bytes, hash } = mutate((record) => {
      delete record.targets[0].result.observation.transcript;
    });

    expect(() => validateObservationBytes(bytes, hash)).toThrow(/transcript/);
  });

  it('rejects an unexpected target set', () => {
    const { bytes, hash } = mutate((record) => {
      record.targets[0].id = 'unexpected';
    });

    expect(() => validateObservationBytes(bytes, hash)).toThrow(/target IDs/);
  });

  it('rejects a target whose assertions did not pass', () => {
    const { bytes, hash } = mutate((record) => {
      record.targets[1].result.assertions = 'failed';
    });

    expect(() => validateObservationBytes(bytes, hash)).toThrow(/assertions/);
  });

  it('rejects a target whose repeated run differed', () => {
    const { bytes, hash } = mutate((record) => {
      record.targets[2].result.repeatedRunMatches = false;
    });

    expect(() => validateObservationBytes(bytes, hash)).toThrow(/repeated run/);
  });

  it('rejects behavioral observations that differ by target', () => {
    const { bytes, hash } = mutate((record) => {
      record.targets[2].result.observation.transcript[0] = '[alice] Different result.';
    });

    expect(() => validateObservationBytes(bytes, hash)).toThrow(/observations differ/);
  });
});
