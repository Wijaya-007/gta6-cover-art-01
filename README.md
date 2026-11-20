[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# NEON TIDE — Five-Crew GTA-Style Cover Studio

A web app that turns a photo and a caption into cover art in the style of
GTA 6's posters: a five-panel neon poster with bold lettering, a Vice City
sunset grade, and the crews — THE GETAWAY, THE HACKER, THE BROKER, THE
ENFORCER, THE FIXER — under the title NEON TIDE, "After Midnight",
ISSUE 04, and the tagline "FIVE CREWS · ONE HARBOR · NO MERCY".

## How it works

1. Load a photo (your own, from your machine — it never leaves your browser)
   or start from one of the five crew samples.
2. Choose which panel it fills, or fill all five with one photo.
3. Edit the title, the script line, and the tagline.
4. Pick an export size — 1080×1080, 1080×1350, or 1920×1080 — and export a PNG.

Everything runs offline from static files under `app/`; no network request.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Entry

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Competition: https://make.fun/bounty/gta6-cover-art-01
Referral: https://make.fun/r/9yzb6a2n

## Fonts

Anton, Bebas Neue, and Pacifico are SIL Open Font License files under
`app/fonts/`. The five crew samples under `app/samples/` are crops of a
poster made with an image model for this entry. No Rockstar Games logo,
artwork, or font is used anywhere.
