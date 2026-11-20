// NEON TIDE editor: wires the controls to the cover renderer. Photos come
// from the user's own machine (file input) or from the five crew samples
// shipped with the app; nothing is uploaded. Export renders the poster at
// the chosen size and downloads it as a PNG.

import { CREWS, DEFAULT_STATE, drawCover, ensureFonts } from './cover.js';
import { markReady } from './shots.js';

const canvas = document.getElementById('poster');
const state = {
  title: DEFAULT_STATE.title,
  script: DEFAULT_STATE.script,
  tagline: DEFAULT_STATE.tagline,
  photos: { ...DEFAULT_STATE.photos },
};

let activePanel = 'hero';
let exportSize = '1080x1080';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function redraw() {
  await ensureFonts();
  drawCover(canvas, state);
}

function setPanelPhoto(img) {
  state.photos[activePanel] = img;
  redraw();
}

async function loadSample(name) {
  try {
    const img = await loadImage(`./samples/${name}`);
    setPanelPhoto(img);
  } catch (_) {
    // A missing sample leaves the panel on its gradient placeholder.
  }
}

// Crew sample strip.
const samplesEl = document.getElementById('samples');
for (const crew of CREWS) {
  const img = document.createElement('img');
  img.src = `./samples/${crew.sample}`;
  img.alt = crew.name;
  img.title = crew.name;
  img.addEventListener('click', () => loadSample(crew.sample));
  samplesEl.appendChild(img);
}

// Panel selector.
document.getElementById('panels').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-panel]');
  if (!btn) return;
  document.querySelectorAll('.panel-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  activePanel = btn.dataset.panel;
});

// Photo upload from the user's machine.
document.getElementById('photoFile').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const img = await loadImage(reader.result);
      setPanelPhoto(img);
    } catch (_) {}
  };
  reader.readAsDataURL(file);
});

// Caption inputs.
document.getElementById('titleInput').addEventListener('input', (e) => {
  state.title = e.target.value || 'NEON TIDE';
  redraw();
});
document.getElementById('scriptInput').addEventListener('input', (e) => {
  state.script = e.target.value || 'After Midnight';
  redraw();
});
document.getElementById('taglineInput').addEventListener('input', (e) => {
  state.tagline = e.target.value || 'FIVE CREWS · ONE HARBOR · NO MERCY';
  redraw();
});

// Export size.
document.getElementById('sizes').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-size]');
  if (!btn) return;
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  exportSize = btn.dataset.size;
});

// Export: render at the chosen size and download a PNG.
document.getElementById('exportBtn').addEventListener('click', async () => {
  const [w, h] = exportSize.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  await ensureFonts();
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-tide-${exportSize}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
});

// Screenshot mode (?shot=cover|editor&photo=<sample>&caption=<text>): load
// one sample into the hero panel and set the caption, so the shot script can
// capture the app in a known state.
async function applyShotParams() {
  const q = new URLSearchParams(location.search);
  const photo = q.get('photo');
  const caption = q.get('caption');
  if (caption) {
    state.title = caption;
    const t = document.getElementById('titleInput');
    if (t) t.value = caption;
  }
  if (photo) {
    try {
      const img = await loadImage(`./samples/${photo}.jpg`);
      state.photos.hero = img;
    } catch (_) {}
  }
}

// Boot: preload the five crew samples, then draw.
(async () => {
  for (const crew of CREWS) {
    try {
      state.photos[crew.key] = await loadImage(`./samples/${crew.sample}`);
    } catch (_) {}
  }
  await applyShotParams();
  await redraw();
  markReady();
})();
