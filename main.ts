// VICE HEAT — entrypoint (gta6-cover-art-01, Node 22, stdlib only).
// Copies app/ and screenshots/ into /output and writes the dossier the
// bounty scorer checks. Run: `node main.ts` from the repo root.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { buildDossier } from './vendor/makefun-app.ts';

const OUT = '/output';

function failFast(): void {
  // The dossier refuses an app without index.html and screenshots with no
  // image; catch those two mistakes here with a plain message instead.
  if (!existsSync('app/index.html')) {
    throw new Error('app/index.html is missing: the app is a directory of static files with its page at the root');
  }
  const shots = existsSync('screenshots') ? readdirSync('screenshots').filter((f) => /\.(png|jpe?g)$/i.test(f)) : [];
  if (shots.length === 0) {
    throw new Error('screenshots/ holds no PNG or JPEG: the dossier needs 3 or 4 renders');
  }
  console.log(`screenshots: ${shots.sort().join(', ')}`);
}

function main(): void {
  failFast();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  cpSync('app', `${OUT}/app`, { recursive: true });
  cpSync('screenshots', `${OUT}/screenshots`, { recursive: true });
  const dossier = buildDossier(OUT, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(`${OUT}/dossier.json`, dossier);
  console.log(`wrote ${OUT}/dossier.json (${dossier.length} bytes)`);
}

main();
