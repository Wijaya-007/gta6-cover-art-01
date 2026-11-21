// VICE HEAT — cover studio editor (rebuild #11, fresh photos).
// Upload your own photos (or keep the seven golden-hour samples), edit the
// title, tagline and captions, pick one of five colour grades, then export
// the poster as a PNG in three sizes. Everything runs offline in the page.
// The cover is a hero-centre game cover: one large hero close-up in the
// middle, six panels around it at slight alternating tilts, a huge striped
// chrome title overlapping the hero. Samples mix four character portraits
// with three action scenes (police, helicopter, speedboat). Every sample
// photo in this build was generated fresh from scratch — new faces, new
// scenes, same seven roles.

import { drawCover, GRADES, PANELS, DEFAULT_STATE, EXPORT_SIZES } from './cover.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const SAMPLE_SRC = {
  hero: 'samples/hero.jpg',
  insider: 'samples/insider.jpg',
  boss: 'samples/boss.jpg',
  rider: 'samples/rider.jpg',
  courier: 'samples/courier.jpg',
  fixer: 'samples/fixer.jpg',
  lookout: 'samples/lookout.jpg',
};

const LS_KEY = 'vice-heat-studio-v11';

// The editor opens on the Wide export: the hero-centre game cover reads
// best wide, and every fallback below points here so a future reorder of
// EXPORT_SIZES cannot silently change the default.
const DEFAULT_SIZE_ID = 'wide';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

function readState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

function defaultState() {
  const focus = {};
  for (const p of PANELS) focus[p.key] = [...p.focus];
  return {
    ...DEFAULT_STATE,
    sizeId: DEFAULT_SIZE_ID,
    grade: 'sunset',
    focus,
    uploads: {},
    captions: {},
  };
}

let state = { ...defaultState(), ...(readState() || {}) };
if (!state.focus) state.focus = defaultState().focus;
if (!state.uploads) state.uploads = {};
if (!state.captions) state.captions = {};

function saveState() {
  try {
    const copy = { ...state };
    delete copy.uploads; // data URLs are heavy; samples reload instead
    localStorage.setItem(LS_KEY, JSON.stringify(copy));
  } catch {
    // storage full or unavailable: the editor still works in-memory
  }
}

// The live image set: uploaded photos win, samples are the fallback.
const images = {};
const uploadUrls = {};

async function loadAllImages() {
  for (const key of Object.keys(SAMPLE_SRC)) {
    try {
      images[key] = await loadImage(SAMPLE_SRC[key]);
    } catch {
      images[key] = null;
    }
  }
}

function currentImages() {
  const out = {};
  for (const key of Object.keys(images)) out[key] = images[key];
  return out;
}

function currentOpts() {
  return {
    title: state.title,
    subtitle: state.subtitle,
    tagline: state.tagline,
    quote: state.quote,
    vol: state.vol,
    grade: state.grade,
    seed: state.seed,
  };
}

function renderPreview() {
  const canvas = $('#poster');
  if (!canvas) return;
  const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES.find((s) => s.id === DEFAULT_SIZE_ID);
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, size.w, size.h, currentImages(), currentOpts());
  const label = $('#size-label');
  if (label) label.textContent = `${size.label} · ${size.w}×${size.h}`;
}

// --- editor UI ------------------------------------------------------------

function buildPanelCards() {
  const wrap = $('#panels');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const p of PANELS) {
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `
      <div class="panel-thumb"><img alt="${p.tag}"></div>
      <div class="panel-name">${p.tag}</div>
      <label class="panel-upload">Upload photo
        <input type="file" accept="image/*" data-panel="${p.key}" hidden>
      </label>
      <label class="panel-focus">Face position
        <input type="range" min="0" max="100" value="${Math.round((state.focus[p.key]?.[1] ?? 0.35) * 100)}" data-focus="${p.key}">
      </label>`;
    wrap.appendChild(card);
  }
  // thumbnails mirror the current images
  for (const p of PANELS) {
    const img = wrap.querySelector(`img[alt="${p.tag}"]`);
    if (img && images[p.key]) img.src = images[p.key].src;
  }
  wrap.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        loadImage(reader.result)
          .then((img) => {
            images[input.dataset.panel] = img;
            uploadUrls[input.dataset.panel] = reader.result;
            buildPanelCards();
            renderPreview();
          })
          .catch(() => alert('That file could not be read as an image.'));
      };
      reader.readAsDataURL(file);
    });
  });
  wrap.querySelectorAll('input[data-focus]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.focus;
      const fy = Number(input.value) / 100;
      state.focus[key] = [0.5, fy];
      saveState();
      renderPreview();
    });
  });
}

function buildGradeButtons() {
  const wrap = $('#grades');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const g of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-btn' + (state.grade === g.id ? ' active' : '');
    btn.dataset.grade = g.id;
    btn.style.setProperty('--grade-tint', g.tint);
    btn.textContent = g.name;
    btn.addEventListener('click', () => {
      state.grade = g.id;
      saveState();
      buildGradeButtons();
      renderPreview();
    });
    wrap.appendChild(btn);
  }
}

function buildSizeButtons() {
  const wrap = $('#sizes');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const s of EXPORT_SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'size-btn' + (state.sizeId === s.id ? ' active' : '');
    btn.dataset.size = s.id;
    btn.textContent = `${s.label} · ${s.w}×${s.h}`;
    btn.addEventListener('click', () => {
      state.sizeId = s.id;
      saveState();
      buildSizeButtons();
      renderPreview();
    });
    wrap.appendChild(btn);
  }
}

function bindTextInputs() {
  const fields = [
    ['#title-input', 'title'],
    ['#subtitle-input', 'subtitle'],
    ['#tagline-input', 'tagline'],
    ['#quote-input', 'quote'],
  ];
  for (const [sel, key] of fields) {
    const el = $(sel);
    if (!el) continue;
    el.value = state[key] ?? '';
    el.addEventListener('input', () => {
      state[key] = el.value;
      saveState();
      renderPreview();
    });
  }
}

// --- export ---------------------------------------------------------------

function exportPng(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, size.w, size.h, currentImages(), currentOpts());
  const a = document.createElement('a');
  a.download = `vice-heat-${size.id}-${size.w}x${size.h}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function bindExport() {
  const one = $('#export-one');
  if (one) {
    one.addEventListener('click', () => {
      const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES.find((s) => s.id === DEFAULT_SIZE_ID);
      exportPng(size);
    });
  }
  const all = $('#export-all');
  if (all) {
    all.addEventListener('click', () => {
      // One file per click is the browser-safe path; stagger the three.
      EXPORT_SIZES.forEach((size, i) => {
        setTimeout(() => exportPng(size), i * 450);
      });
    });
  }
  const reset = $('#reset-all');
  if (reset) {
    reset.addEventListener('click', () => {
      localStorage.removeItem(LS_KEY);
      state = defaultState();
      loadAllImages().then(() => {
        buildPanelCards();
        buildGradeButtons();
        buildSizeButtons();
        bindTextInputs();
        renderPreview();
      });
    });
  }
}

// --- shot mode (for scripted screenshots) ---------------------------------
// ?shot=cover renders the poster alone at the shot's size, no editor chrome.
// The screenshot runner loads the page with this param and captures #poster.

export function shotFromQuery() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const map = {
    // Rebuild #11: the main cover shot is WIDE (1280x720) — the hero-centre
    // game-cover layout reads best wide, like the top-1 reference.
    '1-cover': { sizeId: 'wide', grade: 'sunset' },
    '2-editor': null, // full editor, captured as-is
    '3-cover-portrait': { sizeId: 'portrait', grade: 'gold' },
    '4-cover-square': { sizeId: 'square', grade: 'neon' },
  };
  return { name: shot, ...(map[shot] || { sizeId: 'wide', grade: 'sunset' }) };
}

async function boot() {
  await loadAllImages();
  buildPanelCards();
  buildGradeButtons();
  buildSizeButtons();
  bindTextInputs();
  bindExport();
  const shot = shotFromQuery();
  if (shot) {
    // Shot mode hides the editor chrome so the poster fills the frame —
    // but NOT for the 2-editor shot, which must show the full editor UI.
    if (shot.name !== '2-editor') {
      document.body.classList.add('shot-mode');
      state.sizeId = shot.sizeId;
      state.grade = shot.grade;
    }
  }
  // Wait for the OFL fonts so the title renders in Anton/Bebas/Pacifico
  // instead of a fallback face on the first paint.
  try { await document.fonts.ready; } catch { /* fonts are optional */ }
  renderPreview();
  document.body.classList.add('ready');
  // Signal for the screenshot runner: the poster is painted.
  window.__shotReady = true;
}

boot();
