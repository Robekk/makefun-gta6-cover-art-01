# Marina Heat — Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Robekk/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Robekk/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your photos and a caption into multi-panel,
GTA-style cover art — posterized, duotone-graded, halftone-screened and
lettered — and exports it as a PNG in the common post sizes. An entry for
the make.fun bounty [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo.** Add your own photos (read locally, never uploaded) or start
  from the three bundled samples. Every panel of the grid takes any photo;
  click a panel to select it, click a photo to fill it, drag to position the
  crop, scroll or use the slider to zoom.
- **Five panel layouts** in the classic cover grammar: Showcase (hero +
  stacked plates + foot strip), Mosaic (tall plate, small-plate column and a
  title plate of its own), Strips, Duo + Title Band, and Solo Full-Bleed.
- **A real grade, not a CSS filter.** Each photo is posterized and
  gradient-mapped pixel by pixel through the chosen palette — Heatwave,
  Sunset, Neon Nights, Golden Hour, Lagoon — with a halftone dot screen
  pressed into the dark tones, a per-panel vignette and film grain over the
  finished cover. Grade strength and the halftone screen are adjustable.
- **A lettering system.** Kicker, two lines of gradient block type with a
  heavy ink outline, a script subtitle, a tagline bar and a starburst badge —
  every word editable, all drawn fresh on the canvas for each cover.
- **One-click export** at 1080 × 1080, 1080 × 1350 and 1920 × 1080. The PNG
  the app writes is rendered by the same code as the live preview, so what
  you see is exactly what you share.
- **Original throughout.** No Rockstar logo, artwork or fonts; the title
  treatments, layouts and port-side city of Marina Heat are the studio's own.

## Run it

The app is plain static files under `app/` — serve that folder with any
static file server, or just open it through one, and it works fully offline:

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Three steps: pick photos, pick a layout and a grade, export the PNG.

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the kit's vendored
`buildDossier`, then self-checks the tree against the gate's caps:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

- `screenshots/1-cover.jpg` — a 1920 × 1080 cover the app exported
  (Showcase layout, Heatwave grade), shown at 1280 × 720.
- `screenshots/2-editor.jpg` — the editor with the samples loaded and the
  Showcase cover in the live preview, panel 1 selected.
- `screenshots/3-cover-square.jpg` — a 1080 × 1080 cover the app exported
  (Mosaic layout with its own title plate, Sunset grade).
- `screenshots/4-editor-panels.jpg` — the editor on the Strips layout with
  the Neon Nights grade at the 1080 × 1350 size.

## Credits

- Display fonts: **Anton** and **Yellowtail**, both under the SIL Open Font
  License 1.1 (license text in `app/fonts/OFL.txt`), bundled as files under
  `app/fonts/`.
- Sample photos: `boulevard.jpg` and `pier.jpg` ship with the bounty kit and
  were made with an image model for make.fun, free to use;
  `convertible.jpg` was made with an image model for this entry.
- Everything else — the grading pipeline, layouts, lettering and editor —
  was written for this entry.
