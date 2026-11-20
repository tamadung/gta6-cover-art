// Vice Coast Cover Studio — UI wiring: state, uploads, pan/zoom, undo/redo, export.
import { LAYOUTS, GRADES, layoutById, gradeById, defaultState, renderCover, parseSize } from './cover.js';
import { shotFromUrl } from './shots.js';

const $ = (sel) => document.querySelector(sel);
const canvas = $('#coverCanvas');
const stageWrap = $('#stageWrap');
const thumbsEl = $('#thumbs');

const SAMPLES = ['samples/boulevard.jpg', 'samples/rooftop.jpg', 'samples/neon.jpg', 'samples/pier.jpg'];

const state = defaultState();
let photos = [];          // HTMLImageElement[]
let photoNames = [];
let selectedSlot = -1;    // slot index being edited
let pickedPhoto = -1;     // thumbnail picked to place
let slotRects = [];
let history = [];
let future = [];

function snapshot() { return JSON.stringify({ state, photoNames, selectedSlot }); }
function pushHistory() { history.push(snapshot()); if (history.length > 60) history.shift(); future = []; syncUndo(); }
function restore(json) {
  const data = JSON.parse(json);
  Object.assign(state, data.state);
  state.crops = data.state.crops;
  selectedSlot = data.selectedSlot;
  syncControls(); render();
}
function syncUndo() {
  $('#undoBtn').disabled = history.length === 0;
  $('#redoBtn').disabled = future.length === 0;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function addPhoto(img, name) {
  photos.push(img); photoNames.push(name);
  renderThumbs();
  if (state.crops.length === 0) fillAllPanels(false);
  render();
}

async function loadDemo() {
  pushHistory();
  photos = []; photoNames = [];
  for (const src of SAMPLES) {
    try { photos.push(await loadImage(src)); photoNames.push(src.split('/').pop()); }
    catch { /* a missing sample just skips */ }
  }
  fillAllPanels(false);
  stageWrap.classList.add('has-photos');
  renderThumbs(); render();
}

function fillAllPanels(record = true) {
  if (record) pushHistory();
  const slots = layoutById(state.layout).slots;
  state.crops = slots.map((_, i) => ({
    photo: photos.length ? i % photos.length : 0, ox: 0, oy: 0, zoom: 1,
  }));
  if (photos.length) stageWrap.classList.add('has-photos');
  renderThumbs(); render();
}

function resetCrop() {
  pushHistory();
  if (selectedSlot < 0) { state.crops.forEach((c) => { c.ox = 0; c.oy = 0; c.zoom = 1; }); }
  else { const c = state.crops[selectedSlot]; if (c) { c.ox = 0; c.oy = 0; c.zoom = 1; } }
  syncZoomSlider(); render();
}

function renderThumbs() {
  thumbsEl.innerHTML = '';
  photos.forEach((img, i) => {
    const used = state.crops.some((c) => c.photo === i);
    const el = document.createElement('img');
    el.src = img.src; el.alt = photoNames[i] || `Photo ${i + 1}`;
    el.title = photoNames[i] || `Photo ${i + 1}`;
    el.className = (pickedPhoto === i ? 'selected ' : '') + (used ? 'used' : '');
    el.addEventListener('click', () => {
      pickedPhoto = pickedPhoto === i ? -1 : i;
      renderThumbs();
      if (pickedPhoto >= 0 && selectedSlot >= 0) placePhoto(selectedSlot, pickedPhoto);
    });
    thumbsEl.appendChild(el);
  });
}

function placePhoto(slot, photoIdx) {
  pushHistory();
  if (!state.crops[slot]) state.crops[slot] = { photo: photoIdx, ox: 0, oy: 0, zoom: 1 };
  else state.crops[slot].photo = photoIdx;
  pickedPhoto = -1;
  renderThumbs(); render();
}

function render() {
  slotRects = renderCover(canvas, state, photos);
  $('#slotLabel').textContent = selectedSlot >= 0 ? `panel ${selectedSlot + 1}` : 'none';
}

function syncControls() {
  document.querySelectorAll('#layoutBtns button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.layout));
  document.querySelectorAll('#gradeBtns button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.grade));
  $('#titleInput').value = state.title;
  $('#subtitleInput').value = state.subtitle;
  $('#titleColor').value = state.titleColor;
  $('#titleSize').value = state.titleSize;
  $('#outlineChk').checked = state.outline;
  $('#ribbonChk').checked = state.ribbon;
  $('#grainChk').checked = state.grain;
  $('#vignetteChk').checked = state.vignette;
  syncZoomSlider();
}

function syncZoomSlider() {
  const c = selectedSlot >= 0 ? state.crops[selectedSlot] : null;
  $('#zoomRange').value = c ? c.zoom : 1;
}

function buildButtons() {
  const lb = $('#layoutBtns');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = l.name; b.dataset.id = l.id;
    b.addEventListener('click', () => { pushHistory(); state.layout = l.id; fillAllPanels(false); syncControls(); render(); });
    lb.appendChild(b);
  });
  const gb = $('#gradeBtns');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = g.name; b.dataset.id = g.id;
    b.addEventListener('click', () => { pushHistory(); state.grade = g.id; syncControls(); render(); });
    gb.appendChild(b);
  });
}

// ---- canvas interaction: click to select, drag to pan, wheel to zoom ----
function slotAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = (clientX - r.left) * (canvas.width / r.width);
  const y = (clientY - r.top) * (canvas.height / r.height);
  return { idx: slotRects.findIndex((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h), x, y };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const { idx, x, y } = slotAt(e.clientX, e.clientY);
  if (idx < 0) return;
  selectedSlot = idx;
  if (pickedPhoto >= 0) { placePhoto(idx, pickedPhoto); return; }
  const crop = state.crops[idx];
  drag = { idx, startX: x, startY: y, ox: crop?.ox || 0, oy: crop?.oy || 0, moved: false };
  canvas.setPointerCapture(e.pointerId);
  syncZoomSlider(); render();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  const rect = slotRects[drag.idx];
  if (!rect) return;
  const crop = state.crops[drag.idx];
  if (!crop) return;
  const dx = (x - drag.startX) / rect.w, dy = (y - drag.startY) / rect.h;
  if (Math.abs(dx) + Math.abs(dy) > 0.005) drag.moved = true;
  crop.ox = Math.max(-0.5, Math.min(0.5, drag.ox + dx));
  crop.oy = Math.max(-0.5, Math.min(0.5, drag.oy + dy));
  render();
});
canvas.addEventListener('pointerup', () => {
  if (drag?.moved) pushHistory();
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { idx } = slotAt(e.clientX, e.clientY);
  if (idx < 0) return;
  const crop = state.crops[idx];
  if (!crop) return;
  selectedSlot = idx;
  crop.zoom = Math.max(1, Math.min(3, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  syncZoomSlider(); render();
}, { passive: false });

// ---- export ----
function exportCanvas(w, h, filename) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  renderCover(off, state, photos);
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

async function exportOne() {
  const [w, h] = parseSize($('#exportSize').value);
  await exportCanvas(w, h, `vice-coast-${w}x${h}.png`);
}
async function exportAll() {
  for (const s of ['1080x1080', '1080x1350', '1920x1080']) {
    const [w, h] = parseSize(s);
    await exportCanvas(w, h, `vice-coast-${w}x${h}.png`);
    await new Promise((r) => setTimeout(r, 350));
  }
}

// ---- wire controls ----
function wire() {
  buildButtons();
  $('#fileInput').addEventListener('change', async (e) => {
    pushHistory();
    for (const file of e.target.files) {
      const url = URL.createObjectURL(file);
      try { await addPhoto(await loadImage(url), file.name); } catch { /* skip unreadable */ }
    }
    e.target.value = '';
  });
  ['dragover', 'dragenter'].forEach((ev) => stageWrap.addEventListener(ev, (e) => e.preventDefault()));
  stageWrap.addEventListener('drop', async (e) => {
    e.preventDefault();
    pushHistory();
    for (const file of e.dataTransfer.files) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try { await addPhoto(await loadImage(url), file.name); } catch { /* skip */ }
    }
  });
  $('#demoBtn').addEventListener('click', loadDemo);
  $('#fillAllBtn').addEventListener('click', () => fillAllPanels(true));
  $('#resetCropBtn').addEventListener('click', resetCrop);
  $('#zoomRange').addEventListener('input', (e) => {
    if (selectedSlot < 0) return;
    const c = state.crops[selectedSlot];
    if (c) { c.zoom = Number(e.target.value); render(); }
  });
  $('#zoomRange').addEventListener('change', () => pushHistory());
  $('#titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('#subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('#titleColor').addEventListener('input', (e) => { state.titleColor = e.target.value; render(); });
  $('#titleSize').addEventListener('input', (e) => { state.titleSize = Number(e.target.value); render(); });
  $('#outlineChk').addEventListener('change', (e) => { state.outline = e.target.checked; render(); });
  $('#ribbonChk').addEventListener('change', (e) => { state.ribbon = e.target.checked; render(); });
  $('#grainChk').addEventListener('change', (e) => { state.grain = e.target.checked; render(); });
  $('#vignetteChk').addEventListener('change', (e) => { state.vignette = e.target.checked; render(); });
  $('#exportBtn').addEventListener('click', exportOne);
  $('#exportAllBtn').addEventListener('click', exportAll);
  document.querySelectorAll('.size-btn[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.size-btn[data-size]').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      $('#exportSize').value = b.dataset.size;
    });
  });
  $('#undoBtn').addEventListener('click', undo);
  $('#redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });
}

function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  syncUndo();
}
function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  syncUndo();
}

// ---- boot ----
async function boot() {
  wire();
  fillAllPanels(false);
  syncControls();
  render();
  const shot = shotFromUrl(location.href);
  if (shot) {
    document.body.classList.add(shot.coverOnly ? 'shot-cover' : 'shot-editor');
    state.layout = shot.layout; state.grade = shot.grade;
    state.title = shot.title; state.subtitle = shot.subtitle;
    if (shot.demo) await loadDemo();
    const [w, h] = shot.size;
    canvas.width = w; canvas.height = h;
    fillAllPanels(false);
    syncControls(); render();
  }
  try { await document.fonts.ready; } catch { /* fonts are local; continue */ }
  await new Promise((r) => setTimeout(r, 150));
  render();
  window.__shotReady = true;
}

boot();
