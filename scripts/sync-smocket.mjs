// TEMPORARY. Rebuilds the sibling smocket checkout, packs it, and installs the
// tarball into this site.
//
// It exists because the demo needs smocket APIs that are on `main` but not in
// any npm release yet (see smocket_데모_구현계획_2026-08-05.md §0, §2). The moment
// those ship, this script and vendor/*.tgz both go away and the dependency
// becomes a plain version range. The completion criterion "package.json
// dependency is not a vendor/ path" is what forces that cleanup.
//
// Assumes smocket sits next to this repo; override with an argument:
//   node scripts/sync-smocket.mjs ../some/other/smocket

import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const smocketRoot = resolve(siteRoot, process.argv[2] ?? '../smocket');
const vendorDir = join(siteRoot, 'vendor');

const git = (...args) =>
  execFileSync('git', ['-C', smocketRoot, ...args])
    .toString()
    .trim();
const run = (command, cwd) => execSync(command, { cwd, stdio: 'inherit' });

const sha = git('rev-parse', '--short', 'HEAD');
const branch = git('rev-parse', '--abbrev-ref', 'HEAD').replace(/[^\w.-]/g, '-');
const { version } = JSON.parse(readFileSync(join(smocketRoot, 'package.json'), 'utf8'));

// A dirty checkout packs code that the sha in the filename does not describe,
// which is exactly the confusion the sha is there to prevent.
if (git('status', '--porcelain')) {
  console.error(`${smocketRoot} has uncommitted changes. Commit or stash them first.`);
  process.exit(1);
}

console.log(`smocket ${version} @ ${branch} ${sha}`);
run('pnpm build', smocketRoot);
run(`pnpm pack --pack-destination "${vendorDir}"`, smocketRoot);

// pnpm names the tarball from package.json alone, so `main` and the npm release
// of the same version would produce the same filename. The sha disambiguates them.
const packed = join(vendorDir, `smocket-${version}.tgz`);
const name = `smocket-${version}-${branch}.${sha}.tgz`;
renameSync(packed, join(vendorDir, name));

/* The specifier is written straight into the manifest rather than going through
   `pnpm add`, for two reasons this script hit in its first real use:

   - `pnpm add` re-resolves every dependency before adding anything, including the
     smocket entry still pointing at the tarball being replaced. Once that file is
     gone the command cannot run at all, and it is the only thing that could
     replace the entry — a deadlock with no way out but hand-editing.
   - `pnpm add` also rewrites the path with the platform separator, so on Windows
     the entry came back with a backslash that no Linux build can resolve.

   Writing the string ourselves settles both: the manifest never names a file that
   is not there, and the separator is the one we chose. */
const manifestPath = join(siteRoot, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.dependencies.smocket = `file:vendor/${name}`;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

run('pnpm install', siteRoot);

// Only once the new tarball is the installed one, so a failed install leaves a
// working tree behind rather than no tarball and a manifest pointing at nothing.
for (const file of readdirSync(vendorDir)) {
  if (file.endsWith('.tgz') && file !== name) rmSync(join(vendorDir, file));
}

console.log(`\nvendor/${name} installed.`);
