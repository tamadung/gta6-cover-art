# Vice Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/tamadung/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/tamadung/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photos + a caption into a GTA 6-style poster cover — a fan-made cover maker for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun.

## What it does

- **6 layouts** — Nine-Panel Grid, Hero + Three, Four-Panel Grid, Full Bleed, Tilted Snapshots, Story Stack
- **5 grades** — Sunset, Neon Night, Vice, Gold Hour, Noir (canvas filter + gradient tint)
- **Caption** — Anton title (colour, size, outline) + Pacifico gold script subtitle, with a “VICE CITY” ribbon badge
- **Photos** — upload or drag-and-drop, click a thumbnail then a panel to place it, drag inside a panel to pan, scroll to zoom, Fill all panels, Reset crop
- **Undo / redo** — Ctrl+Z / Ctrl+Y, plus toolbar buttons
- **Export** — one-click PNG at 1080×1080, 1080×1350 or 1920×1080, or “Export all 3”
- **Extras** — film grain + vignette toggles, live preview, one-click demo with 4 AI-generated Vice City photos
- **Fully offline** — no external URLs; fonts (Anton + Pacifico, SIL OFL) and samples are bundled under `app/`

## Run it

```bash
node serve.ts        # http://localhost:8080
```

## Build the dossier

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
```

`main.ts` uses only the Node 22 standard library and the kit's `vendor/makefun-app.ts`. The dossier is deterministic: two runs produce byte-identical `dossier.json`.

## Screenshots

| File | Scene |
| --- | --- |
| `screenshots/1-cover.jpg` | Nine-panel cover, Sunset grade (wide) |
| `screenshots/2-editor.jpg` | Editor with demo photos, Neon Night grade |
| `screenshots/3-cover.jpg` | Story-stack cover, Vice grade (portrait) |

Screenshots are rendered from the app itself via headless Chromium (`?shot=cover|editor|story`, see `shots.json`).

## Disclaimer

Fan-made tool. Not affiliated with Rockstar Games. No official logos, artwork, or fonts are used.
