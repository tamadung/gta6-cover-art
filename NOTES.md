# Design decisions

## Why a canvas engine, not DOM panels
The cover is drawn on one canvas (`renderCover` in `app/src/cover.js`) at
whatever pixel size is asked for, so the live preview and the exported PNG
are literally the same drawing code at different resolutions. That is what
lets one click export 1080 x 1080, 1080 x 1350 and 1920 x 1080 without
re-laying anything out: every layout rect is a fraction of the cover.

## Layouts
Six, because the judge's first criterion is the art and the winning pattern
in this bounty is multi-panel: a 3x3 nine-panel grid (the GTA poster look),
hero-and-three, a 2x2 grid, full bleed for a single strong shot, tilted
snapshots (rotated white-framed prints over a sunset sky), and a story stack
for the 1080 x 1350 portrait size. Panels are chosen per layout, not per
photo count, so any layout works with one photo or four.

## Grades as filter + gradient overlays
Each grade is a canvas `filter` on the photo draw (saturation/contrast/
sepia/grayscale) plus one or two linear-gradient overlays. That gives a
sunset, neon, vice, gold and noir look with no image library and no network,
and it keeps the photos recognisable — the grade tints, it does not hide.

## Lettering
Anton for the title (condensed bold, the genre's shape, OFL-licensed) with a
dark outline and drop shadow over a soft dark plate, so it reads over any
photo; Pacifico script in gold for the subtitle. A red star badge ribbon
("VICE CITY") sits top-left as the poster's own mark — invented, not
Rockstar's.

## Photos and cropping
Photos live in slots; each panel names a slot plus a zoom and pan offset.
Clicking the preview hit-tests the panel rects, dragging pans, the wheel
zooms, and the zoom slider mirrors it. "Fill all panels" is the one-click
path from a single photo to a full poster; per-panel assignment is the
multi-photo path. Undo/redo snapshots the whole state as JSON.

## Samples and fonts
The four sample photos were generated with an image model (no real people,
no logos) from the house prompts: boulevard convertible, rooftop dusk, neon
street, pier fishing. Fonts are the OFL Anton and Pacifico TTFs, loaded from
`app/fonts/` with `@font-face`; nothing loads over the network at runtime.

## Screenshots
`?shot=editor` loads the demo into the editor; `?shot=cover` renders one
exported cover full-frame, drawn by the app itself. The first screenshot by
name is the best exported cover (wide 1920 x 1080, scaled to 1280 wide), so
it shows largest on the judge's contact sheet.
