[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Wijaya-007/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# VICE HEAT — Cover Studio

Turn your own photos into a framed crime-epic key art cover: one hero
close-up, six cast panels with name tags, a striped chrome title, a pink
script subtitle, a tagline ribbon, a five-star press bar, a billing block,
a barcode and a gold seal. Upload a photo into any panel, edit the title
and captions, pick one of five colour grades (Sunset, Neon, Gold, Teal,
Noir), and export the poster as a PNG in three sizes — Square 1:1
(1080×1080), Portrait 4:5 (1080×1350) and Wide 16:9 (1920×1080).

## Run it

```sh
node serve.ts --port 8081
# open http://127.0.0.1:8081/
```

Offline static app: `app/index.html` + `app/src/*.js` + `app/style.css`,
seven golden-hour sample photos under `app/samples/`, OFL fonts
(Anton, Bebas Neue, Pacifico) under `app/fonts/`. No network, no upload.

## Build the dossier

```sh
node main.ts   # writes /output/dossier.json
```

## About

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01)
— a $250 prize for the best GTA 6 cover art studio. All artwork in this
repo is original; no Rockstar logo, artwork or font is used anywhere.

Referral: https://make.fun/r/9yzb6a2n
