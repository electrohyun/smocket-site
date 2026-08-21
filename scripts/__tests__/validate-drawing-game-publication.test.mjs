import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ARTIFACTS,
  EXPECTED_SNAPSHOT_MANIFEST,
  PUBLICATION_COMMIT,
  PUBLICATION_PATH,
  PUBLICATION_SHA256,
  validateDrawingGameSnapshot,
  validatePublicationRecords,
} from '../validate-drawing-game-publication.mjs';

const contentRoot = new URL('../../content/drawing-game-publication/', import.meta.url);
const readVendored = (path) => readFile(new URL(path, contentRoot));

async function loadRecords() {
  const publication = JSON.parse(
    (await readVendored(`snapshot/${PUBLICATION_PATH}`)).toString('utf8'),
  );
  const artifactRecords = new Map();
  for (const artifact of CANONICAL_ARTIFACTS) {
    artifactRecords.set(
      artifact.id,
      JSON.parse((await readVendored(`snapshot/${artifact.path}`)).toString('utf8')),
    );
  }
  const codePanel = JSON.parse((await readVendored('code-panel.json')).toString('utf8'));
  return { publication, artifactRecords, codePanel };
}

describe('drawing-game publication snapshot', () => {
  it('validates the pinned publication, five canonical artifacts, and every snippet id', async () => {
    const result = await validateDrawingGameSnapshot(readVendored);

    expect(result.manifest).toEqual(EXPECTED_SNAPSHOT_MANIFEST);
    expect(result.manifest.publicationCommit).toBe(PUBLICATION_COMMIT);
    expect(result.manifest.publication.sha256).toBe(PUBLICATION_SHA256);
    expect(result.artifactRecords.size).toBe(5);
    expect(result.snippetIndex.size).toBe(68);
  });

  it('rejects a direct edit to a generated artifact', async () => {
    await expect(
      validateDrawingGameSnapshot(async (path) => {
        const bytes = await readVendored(path);
        return path.endsWith('snippets.generated.json')
          ? Buffer.concat([bytes, Buffer.from(' ')])
          : bytes;
      }),
    ).rejects.toThrow(/SHA-256 mismatch/);
  });

  it('rejects a hand-edited snapshot manifest even when its JSON meaning is unchanged', async () => {
    await expect(
      validateDrawingGameSnapshot(async (path) => {
        const bytes = await readVendored(path);
        return path === 'snapshot-manifest.json'
          ? Buffer.concat([bytes, Buffer.from('\n')])
          : bytes;
      }),
    ).rejects.toThrow(/manifest.*edited by hand/i);
  });

  it('rejects duplicate snippet ids across canonical catalogs', async () => {
    const records = await loadRecords();
    const maintenance = structuredClone(records.artifactRecords.get('maintenance-snippets'));
    maintenance.snippets[0].id = 'drawing-server-handler';
    records.artifactRecords.set('maintenance-snippets', maintenance);

    expect(() =>
      validatePublicationRecords(records.publication, records.artifactRecords, records.codePanel),
    ).toThrow(/duplicate snippet id/i);
  });

  it('rejects unresolved publication artifact pointers', async () => {
    const records = await loadRecords();
    const publication = structuredClone(records.publication);
    publication.maintenance.definition.jsonPointer = '/does-not-exist';

    expect(() =>
      validatePublicationRecords(publication, records.artifactRecords, records.codePanel),
    ).toThrow(/does not resolve/i);
  });

  it('rejects a code panel selection that is absent from the publication catalogs', async () => {
    const records = await loadRecords();
    const codePanel = structuredClone(records.codePanel);
    codePanel.samples.drawing.cards[0].snippets[0].id = 'missing-snippet';

    expect(() =>
      validatePublicationRecords(records.publication, records.artifactRecords, codePanel),
    ).toThrow(/does not exist: missing-snippet/i);
  });
});
