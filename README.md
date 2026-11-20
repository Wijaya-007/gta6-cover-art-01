[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# NEON TIDE — five-crew GTA-style cover studio

A web app that turns a photo and a caption into a GTA 6-style poster:
five panels, bold lettering and a neon sunset grade, exported as a PNG
to share. Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

## The cover

NEON TIDE is a five-crew poster. A tall hero panel in the centre shows
**THE GETAWAY** (a woman in a beige blazer and sunglasses by a car), the
four corner panels show **THE HACKER** (arcade), **THE BROKER** (marina
dock), **THE ENFORCER** (motorcycle) and **THE FIXER** (neon street).
Across the top: five stars, **PURE COASTAL ADRENALINE**, the title
**NEON TIDE** and the script line **After Midnight**. Along the foot:
**FIVE CREWS · ONE HARBOR · NO MERCY** and the ISSUE 04 seal.

## How it works

1. Pick a crew photo from the five samples, or upload your own photo
   from your machine (photos stay on your machine — nothing is uploaded).
2. Choose which panel it fills: The Getaway, The Hacker, The Broker,
   The Enforcer or The Fixer.
3. Edit the title, the script line and the tagline — the live preview
   redraws with every change.
4. Pick an export size (1080 × 1080, 1080 × 1350 or 1920 × 1080) and
   hit **Export PNG**.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Files

- `app/` — the static app (index.html, style.css, src/cover.js,
  src/main.js, src/shots.js, five crew samples, three OFL fonts)
- `screenshots/` — four screenshots of the app at work
- `main.ts` — hands the app in: copies app/ + screenshots/ to /output
  and writes /output/dossier.json
- `serve.ts` — tiny static server for local testing
- `shots.json` — the four screenshot presets
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged

## Fonts

Anton, Bebas Neue and Pacifico, all under the SIL Open Font License,
shipped as WOFF2 files under `app/fonts/`. No Rockstar Games logo,
artwork or font is used anywhere in this entry.

## License

MIT — see LICENSE.
