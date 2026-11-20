// Vice Coast Cover Studio — the editor UI.
// Owns the state, the panel picker, undo/redo history, photo loading and
// the one-click PNG exports. The drawing itself lives in cover.js.

import { LAYOUTS, GRADES, SIZES, defaultState, renderCover } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const ctx = canvas.getContext('2d');

const SAMPLES = [
  { key: 'boulevard', label: 'Boulevard' },
  { key: 'rooftop', label: 'Rooftop' },
  { key: 'neon', label: 'Neon Street' },
  { key: 'pier', label: 'Pier' },
];

let photos = []; // HTMLImageElement per slot, in SAMPLES order then uploads
let photoNames = [];
let state = defaultState();
let selectedPanel = 0;
let history = [];
let future = [];
let dragging = false;
let dragMoved = false;

function snapshot() {
  return JSON.stringify(state);
}
function pushHistory() {
  history.push(snapshot());
  if (history.length > 60) history.shift();
  future = [];
  updateUndoButtons();
}
function restore(json) {
  state = JSON.parse(json);
  syncControls();
  redraw();
}
function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  updateUndoButtons();
}
function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  updateUndoButtons();
}
function updateUndoButtons() {
  $('undo').disabled = !history.length;
  $('redo').disabled = !future.length;
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function panelCount() {
  return LAYOUTS[state.layout].panels(1, 1).length;
}
function ensurePanels() {
  const n = panelCount();
  while (state.panels.length < n) state.panels.push({ photo: state.panels.length % Math.max(1, photos.length), zoom: 1, ox: 0, oy: 0 });
  state.panels.length = n;
  if (selectedPanel >= n) selectedPanel = 0;
}

function redraw() {
  const size = SIZES[state.size];
  const coverShot = document.body.classList.contains('shot-cover');
  const scale = coverShot ? 1 : Math.min(1, 620 / Math.max(size.w, size.h));
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  ensurePanels();
  renderCover(ctx, canvas.width, canvas.height, state, photos);
  drawSelection();
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${panelCount()} — ${photoNames[state.panels[selectedPanel]?.photo] ?? 'empty'}`;
}

function drawSelection() {
  if (document.body.classList.contains('shot-cover')) return; // exported covers show no editor chrome
  const size = SIZES[state.size];
  const rects = LAYOUTS[state.layout].panels(canvas.width, canvas.height);
  const p = rects[selectedPanel];
  if (!p) return;
  ctx.save();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(p.x * canvas.width + 2, p.y * canvas.height + 2, p.w * canvas.width - 4, p.h * canvas.height - 4);
  ctx.restore();
}

// ---- photo loading -------------------------------------------------------

async function addPhotoFile(file) {
  const img = await loadImage(URL.createObjectURL(file));
  photos.push(img);
  photoNames.push(file.name.replace(/\.[^.]+$/, ''));
  rebuildPhotoPickers();
  pushHistory();
  redraw();
  setStatus(`Loaded ${file.name} — pick a panel, then drag to crop.`);
}

async function loadDemo() {
  const loaded = [];
  for (const s of SAMPLES) {
    loaded.push(await loadImage(`samples/${s.key}.jpg`));
  }
  photos = loaded;
  photoNames = SAMPLES.map((s) => s.label);
  state.panels = Array.from({ length: 9 }, (_, i) => ({ photo: i % 4, zoom: 1, ox: 0, oy: 0 }));
  state.title = 'NEON SHORE';
  state.subtitle = 'a vice city story';
  rebuildPhotoPickers();
  syncControls();
  redraw();
  setStatus('Demo photos loaded — 4 shots across 9 panels. Change the layout, grade or caption, then export.');
}

function rebuildPhotoPickers() {
  const sel = $('panelPhoto');
  sel.innerHTML = '';
  photoNames.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i + 1}. ${name}`;
    sel.appendChild(opt);
  });
  const thumbs = $('thumbs');
  thumbs.innerHTML = '';
  photos.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = photoNames[i];
    const t = document.createElement('img');
    t.src = img.src;
    t.alt = photoNames[i];
    b.appendChild(t);
    b.addEventListener('click', () => {
      pushHistory();
      state.panels[selectedPanel].photo = i;
      state.panels[selectedPanel].zoom = 1;
      state.panels[selectedPanel].ox = 0;
      state.panels[selectedPanel].oy = 0;
      redraw();
    });
    thumbs.appendChild(b);
  });
}

// ---- export ---------------------------------------------------------------

function renderAt(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off.getContext('2d'), size.w, size.h, state, photos);
  return off;
}

function downloadCanvas(off, filename) {
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve();
    }, 'image/png');
  });
}

async function exportOne(sizeKey) {
  const size = SIZES[sizeKey];
  await downloadCanvas(renderAt(sizeKey), `vice-coast-${size.w}x${size.h}.png`);
  setStatus(`Exported ${size.label} PNG.`);
}

async function exportAll() {
  for (const key of Object.keys(SIZES)) {
    const size = SIZES[key];
    await downloadCanvas(renderAt(key), `vice-coast-${size.w}x${size.h}.png`);
  }
  setStatus('Exported all three sizes: 1080 x 1080, 1080 x 1350 and 1920 x 1080.');
}

function setStatus(text) {
  $('status').textContent = text;
}

// ---- controls ---------------------------------------------------------------

function buildPickers() {
  const layoutBox = $('layouts');
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.layout = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      pushHistory();
      state.layout = key;
      selectedPanel = 0;
      syncControls();
      redraw();
    });
    layoutBox.appendChild(b);
  }
  const gradeBox = $('grades');
  for (const [key, def] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.grade = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = key;
      syncControls();
      redraw();
    });
    gradeBox.appendChild(b);
  }
  const sizeBox = $('sizes');
  for (const [key, def] of Object.entries(SIZES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.size = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      state.size = key;
      syncControls();
      redraw();
    });
    sizeBox.appendChild(b);
  }
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('titleColor').value = state.titleColor;
  $('titleSize').value = String(state.titleSize);
  $('titleSizeVal').textContent = `${state.titleSize}%`;
  $('outline').checked = state.outline;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('badge').checked = state.badge;
  const panel = state.panels[selectedPanel];
  if (panel) {
    $('panelPhoto').value = String(panel.photo);
    $('zoom').value = String(Math.round(panel.zoom * 100));
    $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  }
}

function bindControls() {
  $('upload').addEventListener('change', async (e) => {
    for (const file of e.target.files) await addPhotoFile(file);
    e.target.value = '';
  });
  $('demo').addEventListener('click', loadDemo);
  $('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('titleColor').addEventListener('input', (e) => { state.titleColor = e.target.value; redraw(); });
  $('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    $('titleSizeVal').textContent = `${state.titleSize}%`;
    redraw();
  });
  $('outline').addEventListener('change', (e) => { pushHistory(); state.outline = e.target.checked; redraw(); });
  $('grain').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; redraw(); });
  $('vignette').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; redraw(); });
  $('badge').addEventListener('change', (e) => { pushHistory(); state.badge = e.target.checked; redraw(); });
  $('panelPhoto').addEventListener('change', (e) => {
    pushHistory();
    state.panels[selectedPanel].photo = Number(e.target.value);
    redraw();
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value) / 100;
    $('zoomVal').textContent = `${e.target.value}%`;
    redraw();
  });
  $('zoom').addEventListener('change', pushHistory);
  $('fillAll').addEventListener('click', () => {
    pushHistory();
    const photo = state.panels[selectedPanel].photo;
    state.panels.forEach((p) => { p.photo = photo; });
    redraw();
    setStatus('Every panel now uses the selected photo.');
  });
  $('resetCrop').addEventListener('click', () => {
    pushHistory();
    const p = state.panels[selectedPanel];
    p.zoom = 1; p.ox = 0; p.oy = 0;
    redraw();
  });
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('exportOne').addEventListener('click', () => exportOne(state.size));
  $('exportAll').addEventListener('click', exportAll);

  // Drag on the preview: click picks a panel, drag pans its photo.
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    const rects = LAYOUTS[state.layout].panels(1, 1);
    const hit = rects.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
    if (hit >= 0) {
      selectedPanel = hit;
      dragging = true;
      dragMoved = false;
      canvas.setPointerCapture(e.pointerId);
      syncControls();
      redraw();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = state.panels[selectedPanel];
    const rects = LAYOUTS[state.layout].panels(1, 1);
    const r = rects[selectedPanel];
    panel.ox += (e.movementX / canvas.getBoundingClientRect().width) / r.w;
    panel.oy += (e.movementY / canvas.getBoundingClientRect().height) / r.h;
    panel.ox = Math.max(-1, Math.min(1, panel.ox));
    panel.oy = Math.max(-1, Math.min(1, panel.oy));
    dragMoved = true;
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging && dragMoved) pushHistory();
    dragging = false;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selectedPanel];
    panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    $('zoom').value = String(Math.round(panel.zoom * 100));
    $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
    redraw();
  }, { passive: false });

  // Drag-and-drop photos from the machine.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    for (const file of e.dataTransfer.files) {
      if (file.type.startsWith('image/')) await addPhotoFile(file);
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });
}

// Screenshot scenes: ?shot=editor loads the demo into the editor,
// ?shot=cover renders one exported cover full-frame. window.__shotReady
// flips once the paint is done so the screenshot script knows it is safe.
async function setupShot() {
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (!shot) return false;
  await runShot(shot, query, async (opts) => {
    await loadDemo();
    if (opts.layout) state.layout = opts.layout;
    if (opts.grade) state.grade = opts.grade;
    if (opts.size) state.size = opts.size;
    if (opts.title) state.title = opts.title;
    if (opts.subtitle !== undefined) state.subtitle = opts.subtitle;
    if (opts.photo !== undefined) {
      const idx = SAMPLES.findIndex((s) => s.key === opts.photo);
      if (idx >= 0) state.panels.forEach((p) => { p.photo = idx; });
    }
    ensurePanels();
    syncControls();
    redraw();
  });
  return true;
}

buildPickers();
bindControls();
syncControls();
updateUndoButtons();
rebuildPhotoPickers();
const shot = await setupShot();
if (!shot) {
  // No screenshot scene: start with the demo so the first paint already
  // shows a finished cover, not an empty frame.
  await loadDemo();
}
redraw();
