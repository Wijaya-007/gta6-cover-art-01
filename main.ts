// NEON TIDE — make.fun gta6-cover-art-01 entry (Node 22, stdlib only).
// The app lives in app/ beside this file: plain static files a desktop
// browser loads offline (index.html plus its ES modules, no library, no
// network). This program hands the app in: it copies app/ and screenshots/
// into the output directory and writes /output/dossier.json, the summary
// the judge reads, using the vendored make.fun library.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast when the app folder is missing instead of handing in an empty
// output directory the scorer would refuse.
if (!existsSync(join(repoRoot, 'app'))) {
  throw new Error('app/ is missing beside main.ts — nothing to hand in');
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps the scorer enforces (see the kit's gate): only text_max_bytes
// shapes the dossier's bytes; the rest refuse an entry the scorer would
// refuse anyway (more than 4 screenshots or one over 256 KiB; more than
// 993 files in app/ or 48 MiB of app files in all; a path under app/
// longer than 1000 bytes).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
