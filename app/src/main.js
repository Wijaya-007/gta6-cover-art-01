// Vice Heat editor: wires the controls to the cover renderer. The state holds
// the five panels (each with its photo, callout label, zoom and pan), the
// lettering and the grade; every change redraws the preview canvas at the
// chosen export size, and Export downloads exactly that drawing as a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCoverArt, layoutFor, panelAt, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

// Five panels, each with a default sample photo, a callout role and a focus
// point (the face, as a fraction of the photo's height) the crop centres on.
const PANEL_DEFS = [
  { id: 'hero', label: 'THE DRIVER', sample: 'hero.jpg', oy: 0, focus: 0.30 },
  { id: 'insider', label: 'THE INSIDER', sample: 'insider.jpg', oy: 0, focus: 0.30 },
  { id: 'boss', label: 'THE BOSS', sample: 'pier.jpg', oy: 0, focus: 0.22 },
  { id: 'rider', label: 'THE RIDER', sample: 'rider.jpg', oy: 0, focus: 0.28 },
  { id: 'courier', label: 'THE COURIER', sample: 'courier.jpg', oy: 0.08, focus: 0.28 },
];

const state = {
  sizeKey: 'landscape',
  grade: 'sunset',
  title: 'VICE HEAT',
  subtitle: 'one last ride',
  tagline: 'FIVE FRIENDS · ONE COAST · NO WAY BACK',
  quote: 'PURE GOLDEN-HOUR MAYHEM',
  studio: 'A SUNSET PICTURES PRODUCTION · STARRING YOU',
  panels: PANEL_DEFS.map((d) => ({ ...d, photo: null, zoom: 1, ox: 0, oy: d.oy ?? 0 })),
};

let selected = 'hero';
let dragging = null;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function currentSize() {
  return SIZES[state.sizeKey];
}

function redraw() {
  drawCoverArt(canvas, { ...state, size: currentSize() });
}

function panelById(id) {
  return state.panels.find((p) => p.id === id);
}

// --- panel list in the sidebar -------------------------------------------
const panelList = document.getElementById('panels');

function buildPanelList() {
  panelList.innerHTML = '';
  for (const def of PANEL_DEFS) {
    const p = panelById(def.id);
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.dataset.id = def.id;
    row.innerHTML = `
      <button type="button" class="panel-pick">${def.label}</button>
      <input type="text" class="panel-label" maxlength="16" value="${p.label}" aria-label="Callout for ${def.id}">
      <label class="panel-file">Photo <input type="file" accept="image/*"></label>
      <label class="panel-zoom">Zoom <input type="range" min="1" max="2.5" step="0.05" value="${p.zoom}"></label>
      <button type="button" class="panel-sample">Use sample</button>`;
    row.querySelector('.panel-pick').addEventListener('click', () => selectPanel(def.id));
    row.querySelector('.panel-label').addEventListener('input', (e) => {
      p.label = e.target.value;
      redraw();
    });
    row.querySelector('.panel-file input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      p.photo = await loadImage(URL.createObjectURL(file));
      p.zoom = 1; p.ox = 0; p.oy = 0;
      selectPanel(def.id);
      status.textContent = `${def.label} photo loaded.`;
    });
    row.querySelector('.panel-zoom input').addEventListener('input', (e) => {
      p.zoom = Number(e.target.value);
      selectPanel(def.id);
    });
    row.querySelector('.panel-sample').addEventListener('click', async () => {
      p.photo = await loadImage(`samples/${def.sample}`);
      p.zoom = 1; p.ox = 0; p.oy = 0;
      selectPanel(def.id);
    });
    panelList.appendChild(row);
  }
  markSelected();
}

function markSelected() {
  for (const row of panelList.querySelectorAll('.panel-row')) {
    row.classList.toggle('selected', row.dataset.id === selected);
  }
}

function selectPanel(id) {
  selected = id;
  markSelected();
  redraw();
}

// --- canvas picking and dragging ------------------------------------------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
}

canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const id = panelAt(layoutFor(canvas.width, canvas.height), pt.x, pt.y);
  if (!id) return;
  selectPanel(id);
  dragging = { id, x: pt.x, y: pt.y, ox: panelById(id).ox, oy: panelById(id).oy };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const pt = canvasPoint(e);
  const p = panelById(dragging.id);
  const rect = layoutFor(canvas.width, canvas.height).panels.find((r) => r.id === dragging.id);
  p.ox = dragging.ox + (pt.x - dragging.x) / rect.w;
  p.oy = dragging.oy + (pt.y - dragging.y) / rect.h;
  redraw();
});

canvas.addEventListener('pointerup', () => { dragging = null; });

// --- lettering, grade, size, export ---------------------------------------
function bindText(id, key) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { state[key] = el.value; redraw(); });
}
bindText('title', 'title');
bindText('subtitle', 'subtitle');
bindText('tagline', 'tagline');
bindText('quote', 'quote');
bindText('studio', 'studio');

const sizeBox = document.getElementById('sizes');
for (const [key, s] of Object.entries(SIZES)) {
  const label = document.createElement('label');
  label.innerHTML = `<input type="radio" name="size" value="${key}" ${key === state.sizeKey ? 'checked' : ''}> ${s.label}`;
  label.querySelector('input').addEventListener('change', () => {
    state.sizeKey = key;
    redraw();
  });
  sizeBox.appendChild(label);
}

const gradeBox = document.getElementById('grades');
for (const [key, g] of Object.entries(GRADES)) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = g.name;
  btn.dataset.grade = key;
  btn.addEventListener('click', () => {
    state.grade = key;
    for (const b of gradeBox.querySelectorAll('button')) b.classList.toggle('active', b === btn);
    redraw();
  });
  if (key === state.grade) btn.classList.add('active');
  gradeBox.appendChild(btn);
}

document.getElementById('fill-all').addEventListener('click', () => {
  const hero = panelById('hero');
  if (!hero.photo) { status.textContent = 'Load a hero photo first.'; return; }
  for (const p of state.panels) {
    p.photo = hero.photo;
    p.zoom = 1; p.ox = 0; p.oy = 0;
  }
  redraw();
  status.textContent = 'All five panels now use the hero photo.';
});

document.getElementById('export').addEventListener('click', () => {
  redraw();
  canvas.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const s = currentSize();
    a.download = `vice-heat-${s.w}x${s.h}.png`;
    a.click();
    status.textContent = `Saved vice-heat-${s.w}x${s.h}.png`;
  }, 'image/png');
});

// --- boot ------------------------------------------------------------------
async function boot() {
  buildPanelList();
  // The lettering fonts are local OFL files; wait until they can be drawn.
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.load('20px "Bebas Neue"'),
    ]);
  } catch { /* fall back to system fonts if a file fails to load */ }
  for (const p of state.panels) {
    const def = PANEL_DEFS.find((d) => d.id === p.id);
    try { p.photo = await loadImage(`samples/${def.sample}`); } catch { /* panel stays empty */ }
  }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, { redraw, loadImage });
  } else {
    redraw();
  }
}

boot();
