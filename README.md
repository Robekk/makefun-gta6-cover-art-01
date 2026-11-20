[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Robekk/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Robekk/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Marina Heat — Cast Cover Studio

A fully offline web app that designs ensemble cast cover posters in the
grand-theft-auto cover tradition: a slanted multi-panel cast grid with gold
keylines, a chrome-gold masthead title, a script subtitle, and the full
magazine furniture — quote bar with five stars, ribbon, billing block,
COMING SOON, a gold seal and a barcode whose bars are derived from the
title itself. Everything is drawn on canvas by one renderer, so the live
preview and the exported PNGs are the same picture.

## The cast

Seven panels, seven players: **The Boss** Don Aurelio Marino, **The Driver**
Roxy Delmar, **The Fixer** Piper Voss, **The Insider** Madame Guile,
**The Lookout** Rio Ferraro, **The Captain** Elias Crowe and **The Getaway**,
a scarlet convertible. The landscape cover runs the five-panel cut (boss
hero down the middle, two panels a side); the square and portrait covers
seat all seven, with the captain and the getaway sharing the bottom row.

## The studio

- **Cast panels** — pick a panel, then assign it any of the nine bundled
  photos, or upload your own (read locally, never sent anywhere).
- **Reframe by hand** — drag on the cover to move the selected member's
  shot, scroll to zoom, or use the zoom slider; role tags and names are
  editable per panel.
- **Words & furniture** — title, subtitle, ribbon, quote, publisher,
  volume, billing block, COMING SOON and seal text are all live inputs.
- **Palettes** — Sunset Cinema, Neon Nights, Vice Pastel and Noir Gold
  re-grade every photo and re-ink the furniture.
- **Export** — one click renders a PNG at the exact size: 1920×1080,
  1080×1080 or 1080×1350.

## Running it

Open `app/index.html` in a browser, or serve the folder with the bundled
development server:

```sh
node serve.ts --port 8901   # http://localhost:8901
```

There is no build step and the app makes zero network requests: the fonts
(Anton and Yellowtail, under the SIL Open Font License in `app/fonts/`) and
every photo ship inside `app/`.

## The entry program

`main.ts` (Node 22, standard library only) assembles the submission:
it copies `app/` and `screenshots/` into the output directory and writes
`dossier.json` with the vendored `buildDossier`:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node --experimental-strip-types main.ts
```

The dossier is deterministic — the same tree writes the same bytes — and
the program refuses a dossier over the 1.5 MiB cap.
