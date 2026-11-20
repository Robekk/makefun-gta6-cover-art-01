// Marina Heat — Cast Cover Studio: the make.fun entry program.
// Copies app/ and screenshots/ into the output directory and writes the
// dossier the scorer rebuilds: dossier.json is buildDossier's canonical
// bytes over that output, so the same tree always writes the same dossier.
// Node 22, standard library only.

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/** The most bytes a dossier may hold for this bounty: 1.5 MiB. */
const DOSSIER_CAP_BYTES = 1572864;

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly on a checkout that is missing a tree the entry is made of,
// instead of copying half an entry and writing a dossier over the gap.
for (const name of ['app', 'screenshots']) {
  const dir = join(root, name);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`main.ts: ${name}/ is missing from the repository root (${dir})`);
  }
}

// A clean output directory: no stale file from an earlier run may leak in.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// The page the whole entry hangs on must have made the trip.
if (!existsSync(join(outDir, 'app', 'index.html'))) {
  throw new Error('main.ts: app/index.html did not land in the output directory');
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
if (dossier.length > DOSSIER_CAP_BYTES) {
  throw new Error(
    `main.ts: dossier.json would be ${dossier.length} bytes, over the ${DOSSIER_CAP_BYTES}-byte cap`,
  );
}
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`dossier.json: ${dossier.length} bytes -> ${join(outDir, 'dossier.json')}`);
