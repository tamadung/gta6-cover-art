// Vice Coast Cover Studio — the cover engine.
// Draws a multi-panel GTA-poster-style cover from the editor state onto any
// 2D canvas context, at any pixel size. Layouts, colour grades, lettering,
// grain and vignette all live here; main.js owns the UI and the state.

// Six layouts. Each returns panel rects as fractions of the cover (x, y, w, h
// plus an optional tilt in degrees) and a title zone (fractions too).
export const LAYOUTS = {
  ninePanel: {
    label: 'Nine-Panel Grid',
    panels(w, h) {
      const cells = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        cells.push({ x: c / 3, y: r / 3, w: 1 / 3, h: 1 / 3, rot: 0 });
      }
      return cells;
    },
    title: { x: 0.03, y: 0.78, w: 0.94, h: 0.19 },
  },
  heroThree: {
    label: 'Hero + Three',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 0.62, h: 1, rot: 0 },
        { x: 0.62, y: 0, w: 0.38, h: 1 / 3, rot: 0 },
        { x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3, rot: 0 },
        { x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3, rot: 0 },
      ];
    },
    title: { x: 0.03, y: 0.80, w: 0.56, h: 0.17 },
  },
  fourPanel: {
    label: 'Four-Panel Grid',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 0.5, h: 0.5, rot: 0 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5, rot: 0 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5, rot: 0 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5, rot: 0 },
      ];
    },
    title: { x: 0.04, y: 0.76, w: 0.92, h: 0.20 },
  },
  fullBleed: {
    label: 'Full Bleed',
    panels(w, h) {
      return [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }];
    },
    title: { x: 0.04, y: 0.74, w: 0.92, h: 0.22 },
  },
  collage: {
    label: 'Tilted Snapshots',
    panels(w, h) {
      return [
        { x: 0.04, y: 0.05, w: 0.52, h: 0.58, rot: -6 },
        { x: 0.46, y: 0.10, w: 0.50, h: 0.55, rot: 5 },
        { x: 0.22, y: 0.48, w: 0.56, h: 0.48, rot: -2 },
      ];
    },
    title: { x: 0.05, y: 0.84, w: 0.90, h: 0.13 },
  },
  story: {
    label: 'Story Stack',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: 1, h: 0.55, rot: 0 },
        { x: 0, y: 0.55, w: 0.5, h: 0.45, rot: 0 },
        { x: 0.5, y: 0.55, w: 0.5, h: 0.45, rot: 0 },
      ];
    },
    title: { x: 0.04, y: 0.40, w: 0.92, h: 0.14 },
  },
};

// Five colour grades. `filter` is applied while the photo is drawn;
// `stops` are gradient overlays painted over the photo afterwards.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.25) contrast(1.08)',
    stops: [
      { from: [255, 122, 26, 0], to: [255, 45, 120, 0.38], dir: 'v' },
      { from: [255, 190, 80, 0.10], to: [120, 20, 90, 0.22], dir: 'v' },
    ],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.55) contrast(1.14)',
    stops: [
      { from: [255, 45, 149, 0.30], to: [0, 229, 255, 0.30], dir: 'h' },
      { from: [20, 0, 60, 0.18], to: [0, 0, 0, 0.05], dir: 'v' },
    ],
  },
  vice: {
    label: 'Vice',
    filter: 'saturate(1.35) contrast(1.1)',
    stops: [
      { from: [168, 85, 247, 0.32], to: [255, 122, 89, 0.28], dir: 'v' },
      { from: [45, 212, 191, 0.16], to: [0, 0, 0, 0.10], dir: 'h' },
    ],
  },
  gold: {
    label: 'Gold Hour',
    filter: 'saturate(1.15) contrast(1.05) sepia(0.28)',
    stops: [
      { from: [255, 200, 90, 0.22], to: [180, 90, 10, 0.30], dir: 'v' },
    ],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(1.05)',
    stops: [
      { from: [255, 255, 255, 0.06], to: [0, 0, 0, 0.35], dir: 'v' },
    ],
  },
};

// The three post sizes the app exports.
export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  story: { label: 'Story 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

const GAP = 0.008; // white gutter between panels, as a fraction of width

// A blank state: one demo title, sunset grade, nine-panel grid.
export function defaultState() {
  return {
    layout: 'ninePanel',
    grade: 'sunset',
    size: 'square',
    title: 'NEON SHORE',
    subtitle: 'a vice city story',
    titleColor: '#ffffff',
    titleSize: 100,
    outline: true,
    grain: true,
    vignette: true,
    badge: true,
    panels: Array.from({ length: 9 }, (_, i) => ({
      photo: i % 4, zoom: 1, ox: 0, oy: 0,
    })),
  };
}

// Cover-fit draw of one photo into a rect, with the panel's zoom and pan.
export function drawPhotoInto(ctx, img, rect, panel, grade) {
  const { x, y, w, h } = rect;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = x + (w - pw) / 2 + (panel.ox || 0) * w;
  const dy = y + (h - ph) / 2 + (panel.oy || 0) * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.filter = 'none';
  for (const stop of grade.stops) {
    const g = stop.dir === 'h'
      ? ctx.createLinearGradient(x, y, x + w, y)
      : ctx.createLinearGradient(x, y, x, y + h);
    const [r1, g1, b1, a1] = stop.from;
    const [r2, g2, b2, a2] = stop.to;
    g.addColorStop(0, `rgba(${r1},${g1},${b1},${a1})`);
    g.addColorStop(1, `rgba(${r2},${g2},${b2},${a2})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

// One grain tile, built once and reused as a repeating pattern.
let grainTile = null;
export function makeGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 160; c.height = 160;
  const g = c.getContext('2d');
  const data = g.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v;
    data.data[i + 3] = 22;
  }
  g.putImageData(data, 0, 0);
  grainTile = c;
  return c;
}

// The title block: Anton capitals with an outline and shadow, Pacifico
// subtitle beneath, plus the star heat-meter and badge ribbon.
export function drawTitleBlock(ctx, w, h, state) {
  const zone = LAYOUTS[state.layout].title;
  const zx = zone.x * w, zy = zone.y * h, zw = zone.w * w, zh = zone.h * h;
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  if (!title && !sub) return;
  // Soft dark plate behind the lettering so it reads over any photo.
  const plate = ctx.createLinearGradient(0, zy - zh * 0.25, 0, zy + zh);
  plate.addColorStop(0, 'rgba(10,4,20,0)');
  plate.addColorStop(1, 'rgba(10,4,20,0.62)');
  ctx.fillStyle = plate;
  ctx.fillRect(0, zy - zh * 0.25, w, zh * 1.25);

  if (title) {
    let size = (h * 0.11 * state.titleSize) / 100;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${size}px Anton, sans-serif`;
    while (ctx.measureText(title).width > zw && size > 14) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    const cy = zy + zh * 0.38;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.05;
    if (state.outline) {
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeStyle = '#14061f';
      ctx.lineJoin = 'round';
      ctx.strokeText(title, w / 2, cy);
    }
    ctx.fillStyle = state.titleColor || '#ffffff';
    ctx.fillText(title, w / 2, cy);
    ctx.restore();
    if (sub) {
      const subSize = Math.max(16, size * 0.34);
      ctx.font = `${subSize}px Pacifico, cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = subSize * 0.2;
      ctx.fillStyle = '#ffd166';
      ctx.fillText(sub, w / 2, cy + size * 0.62);
      ctx.restore();
    }
  }
  if (state.badge) {
    const bw = w * 0.30, bh = Math.max(22, h * 0.032);
    const bx = w * 0.035, by = h * 0.028;
    ctx.save();
    ctx.fillStyle = '#ff2e63';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw - bh * 0.5, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(13, bh * 0.52)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ ★ ★ ★ ★  VICE CITY', bx + bw / 2, by + bh / 2 + 1);
    ctx.restore();
  }
}

// Renders the whole cover from `state` and the loaded `photos` (HTMLImages).
export function renderCover(ctx, w, h, state, photos) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.ninePanel;
  const grade = GRADES[state.grade] || GRADES.sunset;
  // Sunset-sky backdrop: shows through the gutters and behind tilted panels.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#7597de');
  sky.addColorStop(0.7, '#ff7e5f');
  sky.addColorStop(1, '#feb47b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rects = layout.panels(w, h);
  const gap = GAP * w;
  rects.forEach((p, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = photos[panel.photo];
    const rx = p.x * w + gap / 2, ry = p.y * h + gap / 2;
    const rw = p.w * w - gap, rh = p.h * h - gap;
    ctx.save();
    if (p.rot) {
      ctx.translate(rx + rw / 2, ry + rh / 2);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.translate(-rw / 2, -rh / 2);
    } else {
      ctx.translate(rx, ry);
    }
    // White snapshot frame.
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(-gap * 0.9, -gap * 0.9, rw + gap * 1.8, rh + gap * 1.8);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = w * 0.02;
    ctx.shadowOffsetY = w * 0.006;
    if (img) drawPhotoInto(ctx, img, { x: 0, y: 0, w: rw, h: rh }, panel, grade);
    else {
      ctx.fillStyle = '#3a2b4d';
      ctx.fillRect(0, 0, rw, rh);
    }
    ctx.restore();
  });

  drawTitleBlock(ctx, w, h, state);

  if (state.vignette) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  if (state.grain) {
    const tile = makeGrainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  // Thin outer poster frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}
