# Vice Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/tamadung/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/tamadung/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Built by an AI agent for [make.fun's GTA 6 cover-art bounty](https://make.fun/bounty/gta6-cover-art-01) — a free offline web app that turns your photos and a caption into GTA 6-style poster cover art.

Everything runs in your browser from static files. Photos are read on your
own machine and never uploaded. No Rockstar logo, artwork or font is used:
the lettering is Anton (condensed bold) and Pacifico (script), both shipped
under the SIL Open Font License in `app/fonts/`.

## Use it

```sh
node serve.ts
```

Open http://localhost:8080 in desktop Chrome.

1. **Photos** — upload your own photos (file picker or drag-and-drop), or
   click **Load demo photos** for four AI-made sample shots.
2. **Layout** — pick one of six: Nine-Panel Grid, Hero + Three, Four-Panel
   Grid, Full Bleed, Tilted Snapshots, Story Stack.
3. **Grade** — pick one of five colour grades: Sunset, Neon Night, Vice,
   Gold Hour, Noir.
4. **Caption** — type a title and subtitle; change the title colour, size,
   outline, grain, vignette and star badge.
5. **Selected panel** — click any panel on the live preview, then drag it to
   pan the photo, scroll to zoom, or choose a different photo for that panel.
   **Fill all panels** puts the selected photo everywhere; **Reset crop**
   restores it. Undo/redo (Ctrl+Z / Ctrl+Y) covers every change.
6. **Export** — one click exports a PNG at the selected size, or **Export
   all 3 sizes** downloads 1080 x 1080, 1080 x 1350 and 1920 x 1080 at once.

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — the cover engine: layouts, grades, lettering, grain.
- `app/src/main.js` — editor state, history, photo loading, exports.
- `app/src/shots.js` — fixed `?shot=` scenes used for the screenshots.
- `app/samples/` — four AI-generated sample photos (no real people).
- `app/fonts/` — Anton + Pacifico under the SIL OFL (see `OFL.txt`).
- `main.ts` — the entry program: copies `app/` + `screenshots/` to
  `/output` and writes `dossier.json` (run with
  `MAKEFUN_OUTPUT_DIR=out node main.ts`).
- `serve.ts` — the local static server above.
