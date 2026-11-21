[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# GOLDEN TIDE — GTA-style cover studio

Turn any photo into a GTA 6 poster-style cover: a hero close-up in the
centre, six slanted panels around it, a huge striped chrome title, a pink
script subtitle, a tagline ribbon and a golden-hour grade. Export as a PNG
in Square 1:1 (1080×1080), Portrait 4:5 (1080×1350) or Wide 16:9 (1920×1080).

## Try it

```sh
node serve.ts --port 8081
# open http://localhost:8081/
```

## How it works

- `app/src/cover.js` — the renderer: hero-centre layout, slanted panels,
  striped chrome title (bands confined to the letters), sunset/gold/neon
  grades, top bar, bottom billing bar with barcode and gold seal.
- `app/src/main.js` — the editor: upload a photo for any panel, edit the
  title / subtitle / tagline, pick a grade and an export size, export PNG.
- `app/src/shots.js` + `shots.json` — the four dossier screenshots.
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the kit's `buildDossier`.

Sample photos are AI-made for this entry. Fonts (Anton, Bebas Neue,
Pacifico) are OFL, loaded from `app/fonts/`. No Rockstar logo, artwork or
font is used anywhere. Everything runs offline from static files.
