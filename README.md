[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# NEON TIDE — GTA-style cover studio

A web app that turns a photo and a caption into GTA 6-style cover art: a
five-crew multi-panel poster (The Getaway, The Hacker, The Broker, The
Enforcer, The Fixer) with bold caption lettering and a neon Vice City grade,
exported as a PNG in 1080×1080, 1080×1350 or 1920×1080.

## How it works

- Open the app (it runs offline from its own files — no network, nothing is uploaded).
- Load your own photo, or pick one of the five crew sample photos.
- Choose which panel the photo fills, edit the title, script line and tagline.
- Pick an export size and hit **Export PNG**.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library.

## Design

- **NEON TIDE / After Midnight** — five crews, one harbor, no mercy.
- Five stars + "PURE COASTAL ADRENALINE" + ISSUE 04.
- Fonts: Anton, Bebas Neue and Pacifico (SIL Open Font License), shipped
  under `app/fonts/`.
- Sample photos: five panels cropped from an AI-generated poster made for
  this entry; no Rockstar logo, artwork or font anywhere.

Entry for [make.fun · gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).
