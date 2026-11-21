// GOLDEN TIDE entrypoint: copies app/ and screenshots/ into the output
// directory and writes dossier.json with the kit's buildDossier.
// Run: MAKEFUN_OUTPUT_DIR=out node main.ts   (the grader uses /output).
import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

// Fail fast: the app, its cover shot and every sample photo must be there.
if (!existsSync(join(appDir, 'index.html'))) throw new Error('app/index.html is missing');
if (!existsSync(join(shotsDir, '1-cover.jpg'))) throw new Error('screenshots/1-cover.jpg is missing');
for (const key of ['hero', 'insider', 'rider', 'courier', 'fixer', 'boss', 'lookout']) {
  const p = join(appDir, 'samples', `${key}.jpg`);
  if (!existsSync(p)) throw new Error(`app/samples/${key}.jpg is missing`);
  if (statSync(p).size < 10000) throw new Error(`app/samples/${key}.jpg is too small (${statSync(p).size} bytes): a truncated sample`);
}

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
