// GOLDEN TIDE editor — loads the photos and fonts, wires the controls,
// draws the cover live and exports it as a PNG.
import { drawCover, renderCoverCanvas, GRADES, PANELS, DEFAULT_STATE, EXPORT_SIZES } from './cover.js';

const LS_KEY = 'golden-tide-v1';
const $ = (sel) => document.querySelector(sel);

const state = { ...DEFAULT_STATE };
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  Object.assign(state, saved);
} catch { /* a corrupt save falls back to the defaults */ }

const images = {};
let selectedPanel = 'hero';

function save() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* private mode: the app still works, it just forgets */ }
}

async function loadFonts() {
  const faces = [
    ['Anton', '/fonts/anton.woff2'],
    ['Bebas Neue', '/fonts/bebas-neue.woff2'],
    ['Pacifico', '/fonts/pacifico.woff2'],
  ];
  await Promise.all(
    faces.map(async ([family, url]) => {
      const face = new FontFace(family, `url(${url})`);
      await face.load();
      document.fonts.add(face);
    }),
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  await Promise.all(
    PANELS.map(async (p) => {
      images[p.key] = await loadImage(`/samples/${p.file}`);
    }),
  );
}

function currentSize() {
  return EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[2];
}

function render() {
  const size = currentSize();
  const canvas = $('#cover');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), size.w, size.h, images, state);
  $('#sizeLabel').textContent = `${size.label} · ${size.w}×${size.h}`;
  window.__rendered = true;
}

function buildThumbs() {
  const box = $('#thumbs');
  box.innerHTML = '';
  for (const p of PANELS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb' + (p.key === selectedPanel ? ' selected' : '');
    btn.dataset.key = p.key;
    const img = document.createElement('img');
    img.src = `/samples/${p.file}`;
    img.alt = p.tag;
    const span = document.createElement('span');
    span.textContent = p.tag;
    btn.append(img, span);
    btn.addEventListener('click', () => {
      selectedPanel = p.key;
      buildThumbs();
      $('#uploadHint').textContent = `Upload a photo for ${p.tag}`;
    });
    box.appendChild(btn);
  }
}

function buildGradeButtons() {
  const box = $('#grades');
  box.innerHTML = '';
  for (const [id, g] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade' + (id === state.grade ? ' selected' : '');
    btn.textContent = g.name;
    btn.addEventListener('click', () => {
      state.grade = id;
      save();
      buildGradeButtons();
      render();
    });
    box.appendChild(btn);
  }
}

function buildSizeButtons() {
  const box = $('#sizes');
  box.innerHTML = '';
  for (const s of EXPORT_SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'size' + (s.id === state.sizeId ? ' selected' : '');
    btn.textContent = s.label;
    btn.addEventListener('click', () => {
      state.sizeId = s.id;
      save();
      buildSizeButtons();
      render();
    });
    box.appendChild(btn);
  }
}

function wire() {
  const title = $('#title');
  const script = $('#script');
  const tagline = $('#tagline');
  title.value = state.title;
  script.value = state.script;
  tagline.value = state.tagline;
  title.addEventListener('input', () => {
    state.title = title.value.toUpperCase() || 'GOLDEN TIDE';
    save();
    render();
  });
  script.addEventListener('input', () => {
    state.script = script.value || 'one last wave';
    save();
    render();
  });
  tagline.addEventListener('input', () => {
    state.tagline = tagline.value.toUpperCase() || 'SEVEN TIDES · ONE COAST · NO WAY BACK';
    save();
    render();
  });
  $('#upload').addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    loadImage(url).then((img) => {
      images[selectedPanel] = img;
      buildThumbs();
      render();
    });
  });
  $('#export').addEventListener('click', () => {
    const size = currentSize();
    const canvas = renderCoverCanvas(size.w, size.h, images, state);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `golden-tide-${size.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  });
  $('#reset').addEventListener('click', () => {
    Object.assign(state, DEFAULT_STATE);
    save();
    title.value = state.title;
    script.value = state.script;
    tagline.value = state.tagline;
    buildGradeButtons();
    buildSizeButtons();
    loadSamples().then(render);
  });
}

async function boot() {
  try {
    await loadFonts();
  } catch { /* system fonts stand in if a woff2 fails to load */ }
  await loadSamples();
  buildThumbs();
  buildGradeButtons();
  buildSizeButtons();
  wire();
  render();
}

boot();
