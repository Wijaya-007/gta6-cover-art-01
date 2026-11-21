// VICE HEAT — entrypoint (gta6-cover-art-01, Node 22, stdlib only).
// Copies app/ and screenshots/ into /output and writes the dossier the
// bounty scorer checks. Run: `node main.ts` from the repo root.
// Rebuild #10: Golden Mile hero-centre layout, wide main cover shot.

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
  if (shots.length < 3) {
    throw new Error(`screenshots/ holds only ${shots.length} image(s): the dossier needs 3 or 4 renders`);
  }
  if (shots.length > 4) {
    throw new Error(`screenshots/ holds ${shots.length} image(s): the dossier allows at most 4 renders`);
  }
  // The poster text renders with the app's own OFL fonts; without them the
  // title falls back to a system face and the dossier screenshots look off.
  const fonts = existsSync('app/fonts') ? readdirSync('app/fonts').filter((f) => /\.woff2$/i.test(f)) : [];
  if (fonts.length < 3) {
    throw new Error(`app/fonts/ holds only ${fonts.length} WOFF2 file(s): the app needs Anton, Bebas Neue and Pacifico`);
  }
  // The main cover shot is the wide hero-centre render: the dossier's
  // first image must show the game-cover layout, not the editor.
  if (!existsSync('screenshots/1-cover.jpg')) {
    throw new Error('screenshots/1-cover.jpg is missing: the wide hero-centre cover shot is the dossier\'s first image');
  }
  // Seven sample photos feed the seven panels; a missing one renders as
  // an empty dark panel in every screenshot.
  const samples = existsSync('app/samples') ? readdirSync('app/samples').filter((f) => /\.(png|jpe?g)$/i.test(f)) : [];
  if (samples.length < 7) {
    throw new Error(`app/samples/ holds only ${samples.length} photo(s): the cover needs all seven panels`);
  }
  console.log(`samples: ${samples.sort().join(', ')}`);
  console.log(`screenshots: ${shots.sort().join(', ')}`);
  console.log(`fonts: ${fonts.sort().join(', ')}`);
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
