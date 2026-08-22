import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const PUBLICATION_COMMIT = '169b400939592c305b29c2a11e3e7e33f2943404';
export const PUBLICATION_SHA256 =
  'e8144887bfbf97eaec9976c26cc6ed9ae30e9279744cc6816a9152a89117780c';

export const CANONICAL_ARTIFACTS = [
  {
    id: 'golden-snippets',
    path: 'examples/drawing-game/snippets.generated.json',
    purpose: 'Executable TypeScript application and target-bootstrap snippets.',
    schemaVersion: 1,
    sha256: 'b34391543f1b9b12a6776b58e80fec33b63eec4dc589812c3763324129923c65',
  },
  {
    id: 'comparison-observations',
    path: 'case-studies/drawing-game/observations.generated.json',
    purpose: 'Real oracle and Smocket or competitor step results.',
    schemaVersion: 1,
    sha256: '87ed7244e42edae96268ece1bcd196c603f62eaa91db50f4343594ef266f037f',
  },
  {
    id: 'comparison-snippets',
    path: 'case-studies/drawing-game/snippets.generated.json',
    purpose: 'Executable source snippets indexed by target and workflow step.',
    schemaVersion: 1,
    sha256: '461f5f1c4ca874d3a4b22b24e941389d3ecbf5626056a614f814dd9cb0908866',
  },
  {
    id: 'maintenance-measurement',
    path: 'case-studies/drawing-game/maintenance.generated.json',
    purpose: 'Staged handwritten LOC, diffs, source closures, and assertions.',
    schemaVersion: 2,
    sha256: '735b2bdd2e6a2153a44c49243a1cc05fd6830e2bdbeb3bba630c83a917ceb209',
  },
  {
    id: 'maintenance-snippets',
    path: 'case-studies/drawing-game/maintenance-snippets.generated.json',
    purpose: 'Executable handwritten stage and Smocket integration snippets.',
    schemaVersion: 2,
    sha256: '5002eae5be52af231b99f45fdf4c2b141ea5aacf076dec64f5d1fcf58e6badba',
  },
];

export const PUBLICATION_PATH = 'case-studies/drawing-game/publication.generated.json';
export const EXPECTED_SNAPSHOT_MANIFEST = {
  schemaVersion: 1,
  sourceRepository: 'https://github.com/electrohyun/smocket',
  publicationCommit: PUBLICATION_COMMIT,
  regenerateWith: 'pnpm drawing-game:snapshot:sync',
  publication: {
    path: PUBLICATION_PATH,
    sha256: PUBLICATION_SHA256,
  },
  canonicalArtifacts: CANONICAL_ARTIFACTS,
};

export const EXPECTED_SNAPSHOT_MANIFEST_BYTES = Buffer.from(
  `${JSON.stringify(EXPECTED_SNAPSHOT_MANIFEST, null, 2)}\n`,
);

const CONTENT_ROOT = new URL('../content/drawing-game-publication/', import.meta.url);

function fail(message) {
  throw new Error(`Invalid drawing-game publication snapshot: ${message}`);
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
  if (typeof value !== 'string' || value.length === 0) {
    fail(`${path} must be a non-empty string`);
  }
  return value;
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseJson(bytes, path) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(`${path} could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function verifyHash(bytes, expectedHash, path) {
  const actualHash = sha256(bytes);
  if (actualHash !== expectedHash) {
    fail(`${path} SHA-256 mismatch: expected ${expectedHash}, received ${actualHash}`);
  }
}

function resolveJsonPointer(document, pointer, path) {
  if (pointer === '') return document;
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) {
    fail(`${path} must be an empty pointer or begin with /`);
  }

  let current = document;
  for (const rawToken of pointer.slice(1).split('/')) {
    const token = rawToken.replaceAll('~1', '/').replaceAll('~0', '~');
    if (current === null || typeof current !== 'object' || !(token in current)) {
      fail(`${path} does not resolve: ${pointer}`);
    }
    current = current[token];
  }
  return current;
}

function validateSnippet(snippet, path) {
  const value = object(snippet, path);
  string(value.id, `${path}.id`);
  string(value.language, `${path}.language`);
  string(value.code, `${path}.code`);
  string(value.purpose, `${path}.purpose`);

  if (value.language === 'diff') {
    string(value.previousSourceFile, `${path}.previousSourceFile`);
    string(value.currentSourceFile, `${path}.currentSourceFile`);
  } else {
    string(value.sourceFile, `${path}.sourceFile`);
  }
}

function validateArtifactSchema(record, expected, path) {
  const value = object(record, path);
  if (value.schemaVersion !== expected.schemaVersion) {
    fail(`${path}.schemaVersion must be ${expected.schemaVersion}`);
  }

  if (expected.id.endsWith('snippets')) {
    const snippets = array(value.snippets, `${path}.snippets`);
    snippets.forEach((snippet, index) => validateSnippet(snippet, `${path}.snippets[${index}]`));
  }

  if (
    expected.id === 'comparison-observations' &&
    value.caseStudy !== 'drawing-game-compatibility'
  ) {
    fail(`${path}.caseStudy must be drawing-game-compatibility`);
  }
  if (expected.id === 'maintenance-measurement') {
    if (value.caseStudy !== 'drawing-game-maintenance-surface') {
      fail(`${path}.caseStudy must be drawing-game-maintenance-surface`);
    }
    array(value.stages, `${path}.stages`);
    object(value.finalWorkflow, `${path}.finalWorkflow`);
  }
}

function collectReferences(value, path, visit) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectReferences(item, `${path}[${index}]`, visit));
    return;
  }
  if (value === null || typeof value !== 'object') return;

  visit(value, path);
  for (const [key, child] of Object.entries(value)) {
    collectReferences(child, `${path}.${key}`, visit);
  }
}

export function validateCodePanelConfig(config, snippetIndex) {
  const value = object(config, 'code-panel');
  if (value.schemaVersion !== 2) fail('code-panel.schemaVersion must be 2');
  const samples = object(value.samples, 'code-panel.samples');

  for (const sampleId of ['drawing', 'chat']) {
    const sample = object(samples[sampleId], `code-panel.samples.${sampleId}`);
    string(sample.title, `code-panel.samples.${sampleId}.title`);
    string(sample.description, `code-panel.samples.${sampleId}.description`);
    for (const field of ['realSnippetId', 'smocketSnippetId']) {
      const id = string(sample[field], `code-panel.samples.${sampleId}.${field}`);
      if (!snippetIndex.has(id)) {
        fail(`code-panel.samples.${sampleId}.${field} does not exist: ${id}`);
      }
    }

    const handwritten = object(sample.handwritten, `code-panel.samples.${sampleId}.handwritten`);
    string(handwritten.stageId, `code-panel.samples.${sampleId}.handwritten.stageId`);
    string(
      handwritten.supportDescription,
      `code-panel.samples.${sampleId}.handwritten.supportDescription`,
    );
    const focusText = string(
      handwritten.focusText,
      `code-panel.samples.${sampleId}.handwritten.focusText`,
    );
    const sourceSnippetId = string(
      handwritten.sourceSnippetId,
      `code-panel.samples.${sampleId}.handwritten.sourceSnippetId`,
    );
    if (!snippetIndex.has(sourceSnippetId)) {
      fail(
        `code-panel.samples.${sampleId}.handwritten.sourceSnippetId does not exist: ${sourceSnippetId}`,
      );
    }
    if (!snippetIndex.get(sourceSnippetId).code.includes(focusText)) {
      fail(
        `code-panel.samples.${sampleId}.handwritten.focusText does not exist in ${sourceSnippetId}`,
      );
    }
    const diffSnippetIds = array(
      handwritten.diffSnippetIds,
      `code-panel.samples.${sampleId}.handwritten.diffSnippetIds`,
    );
    if (diffSnippetIds.length === 0) {
      fail(`code-panel.samples.${sampleId}.handwritten.diffSnippetIds must not be empty`);
    }
    for (const [index, rawId] of diffSnippetIds.entries()) {
      const id = string(
        rawId,
        `code-panel.samples.${sampleId}.handwritten.diffSnippetIds[${index}]`,
      );
      if (!snippetIndex.has(id)) {
        fail(
          `code-panel.samples.${sampleId}.handwritten.diffSnippetIds[${index}] does not exist: ${id}`,
        );
      }
    }
  }

  return value;
}

export function validatePublicationRecords(publication, artifactRecords, codePanel) {
  const publicationValue = object(publication, 'publication');
  if (publicationValue.schemaVersion !== 1) fail('publication.schemaVersion must be 1');
  if (publicationValue.publication !== 'drawing-game') {
    fail('publication.publication must be drawing-game');
  }
  string(publicationValue.sourceRevision, 'publication.sourceRevision');

  if (!isDeepStrictEqual(publicationValue.canonicalArtifacts, CANONICAL_ARTIFACTS)) {
    fail('publication.canonicalArtifacts do not match the pinned artifact list');
  }

  const artifactById = new Map();
  for (const expected of CANONICAL_ARTIFACTS) {
    const record = artifactRecords.get(expected.id);
    if (!record) fail(`canonical artifact is missing: ${expected.id}`);
    validateArtifactSchema(record, expected, expected.path);
    artifactById.set(expected.id, record);
  }

  const snippetIndex = new Map();
  for (const artifact of CANONICAL_ARTIFACTS.filter(({ id }) => id.endsWith('snippets'))) {
    const record = artifactById.get(artifact.id);
    for (const snippet of record.snippets) {
      if (snippetIndex.has(snippet.id)) fail(`duplicate snippet id: ${snippet.id}`);
      snippetIndex.set(snippet.id, snippet);
    }
  }

  const catalogs = array(publicationValue.snippets?.catalogs, 'publication.snippets.catalogs');
  for (const [index, catalog] of catalogs.entries()) {
    const path = `publication.snippets.catalogs[${index}]`;
    const value = object(catalog, path);
    const artifactId = string(value.artifactId, `${path}.artifactId`);
    const artifact = artifactById.get(artifactId);
    if (!artifact?.snippets) fail(`${path}.artifactId must reference a snippet artifact`);
    const actualIds = artifact.snippets.map((snippet) => snippet.id);
    if (!isDeepStrictEqual(value.snippetIds, actualIds)) {
      fail(`${path}.snippetIds do not match ${artifactId}`);
    }
  }

  collectReferences(publicationValue, 'publication', (reference, path) => {
    if ('artifactId' in reference) {
      const artifactId = string(reference.artifactId, `${path}.artifactId`);
      const artifact = artifactById.get(artifactId);
      if (!artifact) fail(`${path}.artifactId does not exist: ${artifactId}`);
      if ('jsonPointer' in reference) {
        resolveJsonPointer(artifact, reference.jsonPointer, `${path}.jsonPointer`);
      }
    }
    if ('snippetIds' in reference) {
      for (const [index, id] of array(reference.snippetIds, `${path}.snippetIds`).entries()) {
        string(id, `${path}.snippetIds[${index}]`);
        if (!snippetIndex.has(id)) fail(`${path}.snippetIds[${index}] does not exist: ${id}`);
      }
    }
  });

  validateCodePanelConfig(codePanel, snippetIndex);
  return { artifactById, snippetIndex };
}

async function readVendoredFile(path) {
  return readFile(new URL(path, CONTENT_ROOT));
}

export async function validateDrawingGameSnapshot(read = readVendoredFile) {
  const manifestBytes = await read('snapshot-manifest.json');
  if (!manifestBytes.equals(EXPECTED_SNAPSHOT_MANIFEST_BYTES)) {
    fail(
      'snapshot-manifest.json is stale or was edited by hand; regenerate it with pnpm drawing-game:snapshot:sync',
    );
  }
  const manifest = parseJson(manifestBytes, 'snapshot-manifest.json');
  if (!isDeepStrictEqual(manifest, EXPECTED_SNAPSHOT_MANIFEST)) {
    fail('snapshot-manifest.json does not match the pinned publication');
  }

  const publicationBytes = await read(`snapshot/${PUBLICATION_PATH}`);
  verifyHash(publicationBytes, PUBLICATION_SHA256, PUBLICATION_PATH);
  const publication = parseJson(publicationBytes, PUBLICATION_PATH);

  const artifactRecords = new Map();
  for (const artifact of CANONICAL_ARTIFACTS) {
    const bytes = await read(`snapshot/${artifact.path}`);
    verifyHash(bytes, artifact.sha256, artifact.path);
    artifactRecords.set(artifact.id, parseJson(bytes, artifact.path));
  }

  const codePanel = parseJson(await read('code-panel.json'), 'code-panel.json');
  const indexes = validatePublicationRecords(publication, artifactRecords, codePanel);

  return { manifest, publication, artifactRecords, codePanel, ...indexes };
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  const result = await validateDrawingGameSnapshot();
  process.stdout.write(
    `Verified drawing-game publication ${PUBLICATION_COMMIT}.\n` +
      `Verified publication SHA-256: ${PUBLICATION_SHA256}\n` +
      `Verified ${result.artifactRecords.size} canonical artifacts and ${result.snippetIndex.size} snippet ids.\n`,
  );
}
