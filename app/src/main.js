// NEON TIDE editor: photo upload, crew samples, caption, size, PNG export.
// All local and offline: photos are read on the user's machine and never
// uploaded. The cover is drawn by src/cover.js on the preview canvas.
import { drawCover, CREWS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('titleInput');
const scriptInput = document.getElementById('scriptInput');
const tagInput = document.getElementById('tagInput');
const sizeSelect = document.getElementById('sizeSelect');
const panelSelect = document.getElementById('panelSelect');
const photoFile = document.getElementById('photoFile');
const exportBtn = document.getElementById('exportBtn');
const samplesBox = document.getElementById('samples');

// One loaded image per crew panel; a sample or the user's photo fills them.
const images = {};
for (const crew of CREWS) images[crew.key] = null;

let heroCrew = 'hero';
let uploaded = null; // the user's photo, when one is loaded

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (const crew of CREWS) {
    try {
      images[crew.key] = await loadImage(`samples/${crew.file}`);
    } catch {
      images[crew.key] = null;
    }
  }
}

function render() {
  drawCover(canvas, images, {
    title: titleInput.value.trim() || 'NEON TIDE',
    script: scriptInput.value.trim() || 'After Midnight',
    tagline: tagInput.value.trim() || 'FIVE CREWS · ONE HARBOR · NO MERCY',
    heroCrew,
  });
}

function applySize() {
  const [w, h] = sizeSelect.value.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  render();
}

function buildSamplePicker() {
  for (const crew of CREWS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = crew.label;
    btn.setAttribute('aria-label', `Use the ${crew.label} sample`);
    const img = document.createElement('img');
    img.src = `samples/${crew.file}`;
    img.alt = crew.label;
    btn.appendChild(img);
    btn.addEventListener('click', async () => {
      try {
        const imgEl = await loadImage(`samples/${crew.file}`);
        placePhoto(imgEl);
        document.querySelectorAll('.samples button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      } catch { /* sample missing: keep the current cover */ }
    });
    samplesBox.appendChild(btn);
  }
}

// Put a photo into the chosen panel(s), then redraw.
function placePhoto(imgEl) {
  uploaded = imgEl;
  const target = panelSelect.value;
  if (target === 'all') {
    for (const crew of CREWS) images[crew.key] = imgEl;
  } else {
    images[target] = imgEl;
  }
  render();
}

photoFile.addEventListener('change', async () => {
  const file = photoFile.files && photoFile.files[0];
  if (!file) return;
  try {
    const url = URL.createObjectURL(file);
    const imgEl = await loadImage(url);
    placePhoto(imgEl);
  } catch { /* unreadable file: keep the current cover */ }
});

panelSelect.addEventListener('change', () => { if (uploaded) placePhoto(uploaded); });
titleInput.addEventListener('input', render);
scriptInput.addEventListener('input', render);
tagInput.addEventListener('input', render);
sizeSelect.addEventListener('change', applySize);

exportBtn.addEventListener('click', () => {
  const [w, h] = sizeSelect.value.split('x').map(Number);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  drawCover(out, images, {
    title: titleInput.value.trim() || 'NEON TIDE',
    script: scriptInput.value.trim() || 'After Midnight',
    tagline: tagInput.value.trim() || 'FIVE CREWS · ONE HARBOR · NO MERCY',
    heroCrew,
  });
  const a = document.createElement('a');
  a.download = `neon-tide-${w}x${h}.png`;
  a.href = out.toDataURL('image/png');
  a.click();
});

// The hero crew follows the panel selector's center choice.
panelSelect.addEventListener('change', () => {
  if (panelSelect.value !== 'all') heroCrew = panelSelect.value;
  render();
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  // Screenshot mode: the shot module picks the scene and sets __shotReady.
  document.body.classList.add('shot-cover');
  if (query.get('crew')) heroCrew = query.get('crew');
  if (query.get('title')) titleInput.value = query.get('title');
  if (query.get('format') === 'portrait') { canvas.width = 1080; canvas.height = 1350; }
  await loadSamples();
  buildSamplePicker();
  await runShot(shot, query, async (src, caption) => {
    const imgEl = await loadImage(src);
    images.hero = imgEl;
    if (caption) titleInput.value = caption;
    render();
  });
} else {
  await loadSamples();
  buildSamplePicker();
  render();
}
