import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  CANONICAL_ARTIFACTS,
  EXPECTED_SNAPSHOT_MANIFEST_BYTES,
  PUBLICATION_COMMIT,
  PUBLICATION_PATH,
  PUBLICATION_SHA256,
  sha256,
} from './validate-drawing-game-publication.mjs';

const execFileAsync = promisify(execFile);
const siteRoot = fileURLToPath(new URL('..', import.meta.url));
const contentRoot = fileURLToPath(new URL('../content/drawing-game-publication/', import.meta.url));

function parseArguments(argv) {
  const mode = argv.includes('--write') ? 'write' : argv.includes('--check') ? 'check' : null;
  const sourceIndex = argv.indexOf('--source');
  if (!mode) throw new Error('Pass --write to sync or --check to detect a stale snapshot.');
  if (argv.includes('--write') && argv.includes('--check')) {
    throw new Error('Choose either --write or --check.');
  }
  return {
    mode,
    sourceRoot:
      sourceIndex === -1 ? resolve(siteRoot, '..', 'smocket') : resolve(argv[sourceIndex + 1]),
  };
}

async function readCommittedFile(sourceRoot, path) {
  const safeDirectory = sourceRoot.replaceAll('\\', '/');
  const { stdout } = await execFileAsync(
    'git',
    [
      '-c',
      `safe.directory=${safeDirectory}`,
      '-C',
      sourceRoot,
      'show',
      `${PUBLICATION_COMMIT}:${path}`,
    ],
    { encoding: 'buffer', maxBuffer: 2 * 1024 * 1024 },
  );
  return stdout;
}

async function assertPinnedSource(sourceRoot) {
  const publication = await readCommittedFile(sourceRoot, PUBLICATION_PATH);
  const actualHash = sha256(publication);
  if (actualHash !== PUBLICATION_SHA256) {
    throw new Error(
      `Pinned publication ${PUBLICATION_COMMIT} has SHA-256 ${actualHash}, expected ${PUBLICATION_SHA256}.`,
    );
  }
  return publication;
}

async function sameBytes(path, expected) {
  try {
    return (await readFile(path)).equals(expected);
  } catch {
    return false;
  }
}

async function syncFile(mode, relativePath, bytes) {
  const destination = resolve(contentRoot, relativePath);
  if (mode === 'check') {
    if (!(await sameBytes(destination, bytes))) {
      throw new Error(
        `${relativePath} is stale; run pnpm drawing-game:snapshot:sync to regenerate it.`,
      );
    }
    return;
  }

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}

const { mode, sourceRoot } = parseArguments(process.argv.slice(2));
const publication = await assertPinnedSource(sourceRoot);
const files = [
  { path: PUBLICATION_PATH, bytes: publication },
  ...(await Promise.all(
    CANONICAL_ARTIFACTS.map(async (artifact) => ({
      path: artifact.path,
      bytes: await readCommittedFile(sourceRoot, artifact.path),
      expectedHash: artifact.sha256,
    })),
  )),
];

for (const file of files) {
  if (file.expectedHash && sha256(file.bytes) !== file.expectedHash) {
    throw new Error(`${file.path} does not match its hash in the pinned publication.`);
  }
  await syncFile(mode, `snapshot/${file.path}`, file.bytes);
}
await syncFile(mode, 'snapshot-manifest.json', EXPECTED_SNAPSHOT_MANIFEST_BYTES);

process.stdout.write(
  mode === 'write'
    ? `Synced drawing-game publication ${PUBLICATION_COMMIT} from ${sourceRoot}.\n`
    : `Drawing-game snapshot matches ${PUBLICATION_COMMIT} (${files.length} files).\n`,
);
