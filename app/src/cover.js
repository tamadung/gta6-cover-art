// Vice Coast Cover Studio — cover rendering engine.
// Pure canvas drawing: layouts, grades, caption, ribbon, grain, vignette.
// No DOM here except the canvas passed in, so export reuses the same code.

export const LAYOUTS = [
  { id: 'nine',   name: 'Nine-Panel Grid', slots: gridSlots(3, 3) },
  { id: 'hero3',  name: 'Hero + Three',    slots: heroSlots() },
  { id: 'four',   name: 'Four-Panel Grid', slots: gridSlots(2, 2) },
  { id: 'full',   name: 'Full Bleed',      slots: [{ x: 0, y: 0, w: 1, h: 1 }] },
  { id: 'tilted', name: 'Tilted Snapshots', slots: tiltedSlots(), tilt: true },
  { id: 'stack',  name: 'Story Stack',     slots: gridSlots(1, 3) },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset',     filter: 'saturate(1.25) contrast(1.08) sepia(0.18)', top: 'rgba(255,110,80,0.16)', bottom: 'rgba(120,20,90,0.34)' },
  { id: 'neon',   name: 'Neon Night', filter: 'saturate(1.6) contrast(1.14) hue-rotate(-12deg)', top: 'rgba(0,220,255,0.14)', bottom: 'rgba(90,0,160,0.38)' },
  { id: 'vice',   name: 'Vice',       filter: 'saturate(1.45) contrast(1.05)', top: 'rgba(255,80,180,0.20)', bottom: 'rgba(0,180,200,0.26)' },
  { id: 'gold',   name: 'Gold Hour',  filter: 'saturate(1.3) contrast(1.06) sepia(0.32)', top: 'rgba(255,190,60,0.22)', bottom: 'rgba(120,50,0,0.30)' },
  { id: 'noir',   name: 'Noir',       filter: 'grayscale(0.9) contrast(1.22) brightness(0.94)', top: 'rgba(255,255,255,0.05)', bottom: 'rgba(0,0,0,0.42)' },
];

export function layoutById(id) { return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0]; }
export function gradeById(id) { return GRADES.find((g) => g.id === id) || GRADES[0]; }

function gridSlots(cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    out.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows });
  return out;
}
function heroSlots() {
  return [
    { x: 0, y: 0, w: 1, h: 0.62 },
    { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
    { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
    { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
  ];
}
function tiltedSlots() {
  return [
    { x: 0.06, y: 0.07, w: 0.5, h: 0.55, rot: -4 },
    { x: 0.46, y: 0.05, w: 0.5, h: 0.55, rot: 3 },
    { x: 0.24, y: 0.48, w: 0.54, h: 0.5, rot: -1.5 },
  ];
}

export function defaultState() {
  return {
    layout: 'nine', grade: 'sunset',
    title: 'VICE COAST', subtitle: 'sunset over the city',
    titleColor: '#ffd166', titleSize: 104, outline: true, ribbon: true,
    grain: true, vignette: true,
    // per-slot crop: { photo: index into photos, ox, oy (pan -0.5..0.5), zoom }
    crops: [],
  };
}

const GAP = 6;

/** Draw one photo into a slot rect, cover-fit with pan/zoom. */
function drawPhoto(ctx, img, slot, crop, W, H) {
  const sx = slot.x * W, sy = slot.y * H, sw = slot.w * W, sh = slot.h * H;
  const pad = GAP / 2;
  const dx = sx + pad, dy = sy + pad, dw = sw - GAP, dh = sh - GAP;
  const zoom = crop?.zoom || 1;
  const scale = Math.max(dw / img.width, dh / img.height) * zoom;
  const pw = img.width * scale, ph = img.height * scale;
  const ox = (crop?.ox || 0) * dw, oy = (crop?.oy || 0) * dh;
  ctx.save();
  ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
  ctx.drawImage(img, dx + (dw - pw) / 2 + ox, dy + (dh - ph) / 2 + oy, pw, ph);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(2, W / 540);
  ctx.strokeRect(dx, dy, dw, dh);
  return { x: dx, y: dy, w: dw, h: dh };
}

function drawGrain(ctx, W, H, seed) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.save(); ctx.globalAlpha = 0.07;
  for (let i = 0; i < 2600; i++) {
    const v = Math.floor(rnd() * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
  }
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function drawCaption(ctx, st, W, H) {
  const scale = W / 1080;
  // Bottom scrim so the caption reads over any photo.
  const scrim = ctx.createLinearGradient(0, H * 0.62, 0, H);
  scrim.addColorStop(0, 'rgba(10,4,24,0)'); scrim.addColorStop(1, 'rgba(10,4,24,0.82)');
  ctx.fillStyle = scrim; ctx.fillRect(0, H * 0.62, W, H * 0.38);

  const cx = W / 2;
  let titleSize = st.titleSize * scale * (W / H > 1.4 ? 1 : W / H < 0.9 ? 0.8 : 0.9);
  const titleY = H - 118 * scale;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Shrink long titles so they never overflow the canvas edges.
  ctx.font = `${titleSize}px Anton, 'Arial Black', sans-serif`;
  const maxTitleW = W * 0.92;
  const titleW = ctx.measureText(st.title.toUpperCase()).width;
  if (titleW > maxTitleW) titleSize *= maxTitleW / titleW;
  ctx.font = `${titleSize}px Anton, 'Arial Black', sans-serif`;
  if (st.outline) {
    ctx.lineWidth = Math.max(4, titleSize * 0.09); ctx.strokeStyle = '#160a24';
    ctx.strokeText(st.title.toUpperCase(), cx, titleY);
  }
  ctx.fillStyle = st.titleColor || '#ffd166';
  ctx.fillText(st.title.toUpperCase(), cx, titleY);

  const subSize = Math.max(22, 44 * scale);
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.fillStyle = '#ffe9a8';
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12 * scale; ctx.shadowOffsetY = 3 * scale;
  ctx.fillText(st.subtitle, cx, titleY + titleSize * 0.62 + subSize * 0.4);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  if (st.ribbon) {
    const label = '★ VICE CITY ★';
    ctx.font = `${Math.max(18, 26 * scale)}px Anton, 'Arial Black', sans-serif`;
    const tw = ctx.measureText(label).width;
    const rw = tw + 44 * scale, rh = 44 * scale;
    const rx = cx - rw / 2, ry = 30 * scale;
    ctx.save();
    ctx.fillStyle = '#ff2e7e';
    ctx.beginPath();
    ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw - 12 * scale, ry + rh / 2);
    ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + 12 * scale, ry + rh / 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(label, cx, ry + rh / 2 + 1);
    ctx.restore();
  }
}

/**
 * Render the cover onto `canvas` (its width/height are the export size).
 * `photos` is an array of HTMLImageElement (or null slots).
 * Returns the pixel rects of the slots, for hit-testing.
 */
export function renderCover(canvas, st, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const layout = layoutById(st.layout);
  const grade = gradeById(st.grade);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#160a24'; ctx.fillRect(0, 0, W, H);
  ctx.filter = grade.filter;

  const rects = layout.slots.map((slot, i) => {
    const crop = st.crops[i];
    const img = crop && photos[crop.photo] ? photos[crop.photo] : null;
    const base = { x: slot.x * W, y: slot.y * H, w: slot.w * W, h: slot.h * H };
    if (!img) {
      const hue = [328, 190, 45, 265, 15, 150, 210, 300, 90][i % 9];
      const g = ctx.createLinearGradient(base.x, base.y, base.x + base.w, base.y + base.h);
      g.addColorStop(0, `hsl(${hue}, 70%, 42%)`); g.addColorStop(1, `hsl(${(hue + 40) % 360}, 75%, 22%)`);
      ctx.fillStyle = g; ctx.fillRect(base.x + GAP / 2, base.y + GAP / 2, base.w - GAP, base.h - GAP);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `${Math.max(16, W / 34)}px Anton, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`PANEL ${i + 1}`, base.x + base.w / 2, base.y + base.h / 2);
      return base;
    }
    if (slot.rot) {
      ctx.save();
      ctx.translate(base.x + base.w / 2, base.y + base.h / 2);
      ctx.rotate((slot.rot * Math.PI) / 180);
      ctx.translate(-(base.x + base.w / 2), -(base.y + base.h / 2));
      const r = drawPhoto(ctx, img, slot, crop, W, H);
      ctx.restore();
      return r;
    }
    return drawPhoto(ctx, img, slot, crop, W, H);
  });

  ctx.filter = 'none';
  const tint = ctx.createLinearGradient(0, 0, 0, H);
  tint.addColorStop(0, grade.top); tint.addColorStop(1, grade.bottom);
  ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H);
  if (st.grain) drawGrain(ctx, W, H, 1234567);
  if (st.vignette) drawVignette(ctx, W, H);
  drawCaption(ctx, st, W, H);
  return rects;
}

/** Parse "1080x1350" into [w, h]. */
export function parseSize(s) { const [w, h] = s.split('x').map(Number); return [w, h]; }
