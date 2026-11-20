// Vice Heat — a gta6-cover-art-01 entry (Node 22, standard library only).
// The app is this directory's app/ folder: plain static files a desktop
// browser loads offline (index.html, its ES modules, OFL fonts and sample
// photos, no network request). This program hands it in: it copies app/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json
// with the vendored make.fun library, after checking the screenshots meet the
// gate's own caps (3 or 4 files, each at most 256 KiB).
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function checkScreenshots(dir) {
  const names = readdirSync(dir).filter((n) => !n.startsWith('.')).sort();
  if (names.length < 3 || names.length > 4) {
    throw new Error(`screenshots/ must hold 3 or 4 images, found ${names.length}`);
  }
  for (const name of names) {
    const size = statSync(join(dir, name)).size;
    if (size > 262144) throw new Error(`screenshot ${name} is ${size} bytes, over the 256 KiB cap`);
  }
  return names;
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
let shotNames = [];
if (existsSync(join(here, 'screenshots'))) {
  shotNames = checkScreenshots(join(here, 'screenshots'));
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
} else {
  throw new Error('screenshots/ is missing: the entry needs 3 or 4 screenshots');
}

// The gate's caps, as the scorer reads them: at most 4 screenshots of at most
// 256 KiB, app/ at most 993 files and 48 MiB, and the dossier text at most
// 160 KiB. The dossier is byte for byte what buildDossier writes from the
// files handed in, so both grader runs produce the same bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.error(`handed in app/ and ${shotNames.length} screenshots (${shotNames.join(', ')})`);
