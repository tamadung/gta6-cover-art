# Build notes — Vice Coast Cover Studio (round 3)

Rebuilt from scratch in this session (2026-11-20) from the feature spec only — no old code was read or copied. Every text file was authored here; `app/src/main.js` and `app/src/cover.js` were each written and then revised again after testing.

## Files

- `app/index.html` — editor shell: stage canvas, export sizes, 5 control cards
- `app/style.css` — dark violet/neon theme, responsive, `shot-cover` / `shot-editor` modes
- `app/src/cover.js` — render engine: 6 layouts, 5 grades, caption + ribbon, grain, vignette
- `app/src/main.js` — UI: uploads, drag-drop, pan/zoom, undo/redo, export, demo photos, shot boot
- `app/src/shots.js` — `?shot=` presets (cover / editor / story)
- `app/fonts/` — Anton + Pacifico, downloaded from google/fonts during this session; OFL.txt included
- `app/samples/` — 4 AI-generated photos (boulevard, rooftop, neon, pier), ≤1200px, generated this session
- `main.ts` — Node 22 stdlib only; copies app/ + screenshots/ to the output dir, writes dossier.json via vendor/makefun-app.ts
- `serve.ts` — local static server on :8080
- `shots.json` — 3 screenshot scene definitions
- `screenshots/` — 3 JPEGs rendered from the app via headless Chromium (Puppeteer + SwiftShader)

## Checks

- `MAKEFUN_OUTPUT_DIR=out node main.ts` twice → dossier.json byte-identical (sha256 compared)
- App loads offline at http://localhost:8080 with no external requests
- Screenshots ≤256 KiB each, long side ≤1280, short side ≥480
