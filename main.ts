// Marina Heat Cover Studio — handover program for the gta6-cover-art-01
// bounty (Node 22, standard library only).
//
// The entry itself is the static web app under app/: plain files a desktop
// browser runs offline, with the screenshots the maker took of it under
// screenshots/. This program's whole job is to hand that entry in — copy
// app/ and screenshots/ into the output directory and write the dossier
// the judge reads, using the kit's vendored buildDossier so the bytes are
// exactly the ones the gate rebuilds and compares.
//
// Run it the way the grader does, with MAKEFUN_OUTPUT_DIR standing in for
// /output outside the container:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the gate's own (see the kit's RULES.txt): the dossier
// is refused rather than truncated when the entry breaks them, so the
// program passes them through and lets buildDossier speak for the entry.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// Self-check before the entry leaves the bench: walk what was just written
// and hold it against the same caps the gate enforces, so an oversized
// screenshot or a swollen app/ fails here — where the maker can fix it —
// instead of at the scorer. The dossier's byte size is checked too.
function walk(dir, base, acc) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, rel, acc);
    else acc.push({ path: rel, bytes: stat.size });
  }
  return acc;
}

const appFiles = walk(join(outputDir, 'app'), 'app', []);
const appBytes = appFiles.reduce((sum, f) => sum + f.bytes, 0);
const shotFiles = existsSync(join(outputDir, 'screenshots'))
  ? walk(join(outputDir, 'screenshots'), 'screenshots', [])
  : [];
const dossierBytes = Buffer.byteLength(dossier);

const problems = [];
if (appFiles.length > 993) problems.push(`app/ holds ${appFiles.length} files, over the 993 cap`);
if (appBytes > 50331648) problems.push(`app/ totals ${appBytes} bytes, over the 48 MiB cap`);
if (shotFiles.length < 3 || shotFiles.length > 4) {
  problems.push(`screenshots/ holds ${shotFiles.length} images, outside the 3–4 the gate takes`);
}
for (const shot of shotFiles) {
  if (shot.bytes > 262144) problems.push(`${shot.path} is ${shot.bytes} bytes, over the 256 KiB cap`);
}
if (dossierBytes > 1572864) problems.push(`dossier.json is ${dossierBytes} bytes, over the 1.5 MiB cap`);

if (problems.length) {
  throw new Error(`entry self-check failed:\n - ${problems.join('\n - ')}`);
}
console.log(
  `marina-heat: handed in ${appFiles.length} app files (${appBytes} bytes), ` +
    `${shotFiles.length} screenshots, dossier ${dossierBytes} bytes`,
);
