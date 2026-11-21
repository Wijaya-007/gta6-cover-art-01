// GOLDEN TIDE — GTA-style cover renderer.
// Hero-centre Golden Mile formula: one large cinematic face in the centre,
// seven panels around it, slightly slanted (never a rigid grid), a huge
// striped chrome title overlapping the hero and the panels, a pink script
// subtitle, a tagline ribbon, a top bar and a bottom billing bar.
// Runs in a desktop browser; no network, no dependencies.

export const GRADES = {
  sunset: { name: 'Sunset', alpha: 0.10, warm: 0.12, tint: '#ff9a3c' },
  gold: { name: 'Gold', alpha: 0.12, warm: 0.14, tint: '#ffb347' },
  neon: { name: 'Neon', alpha: 0.10, warm: 0.08, tint: '#ff5e8a' },
};

export const PANELS = [
  { key: 'hero', tag: 'THE DRIVER', file: 'hero.jpg' },
  { key: 'insider', tag: 'THE INSIDER', file: 'insider.jpg' },
  { key: 'rider', tag: 'THE RIDER', file: 'rider.jpg' },
  { key: 'courier', tag: 'THE COURIER', file: 'courier.jpg' },
  { key: 'fixer', tag: 'THE LAW', file: 'fixer.jpg' },
  { key: 'boss', tag: 'THE PILOT', file: 'boss.jpg' },
  { key: 'lookout', tag: 'THE CAPTAIN', file: 'lookout.jpg' },
];

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1:1', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 4:5', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 16:9', w: 1920, h: 1080 },
];

export const DEFAULT_STATE = {
  title: 'GOLDEN TIDE',
  script: 'one last wave',
  tagline: 'SEVEN TIDES · ONE COAST · NO WAY BACK',
  quote: 'THE GOLDEN-HOUR CRIME EPIC',
  gazette: 'THE TIDE GAZETTE',
  grade: 'sunset',
  sizeId: 'wide',
};

// Slant per panel, in degrees, alternating so the layout feels dynamic
// without any two neighbours leaning the same way.
const SLANTS = { hero: -1, insider: -2.5, rider: 2.5, courier: -3, fixer: 2.5, boss: -2.5, lookout: 3 };

// ---------------------------------------------------------------- helpers

/** Draws img covering rect (x, y, w, h), cropping the overflow.
 * focusY (0..1) biases the crop vertically: 0.5 centres it, a smaller
 * value keeps the top of the photo (where a portrait's face sits). */
function coverCrop(ctx, img, x, y, w, h, focusY = 0.5) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * focusY));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** One slanted panel: photo, gold frame and a name-tag chip.
 * focusY biases the photo crop vertically (the hero keeps its face). */
function drawPanel(ctx, img, x, y, w, h, angleDeg, tag, u, focusY = 0.5) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  // Oversize the photo so the rotation never opens a triangular gap.
  const pad = Math.max(w, h) * 0.06;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  coverCrop(ctx, img, -w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2, focusY);
  ctx.lineWidth = Math.max(2, 3 * u);
  ctx.strokeStyle = '#f7c948';
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  // Name-tag chip, top-left inside the frame.
  const tagPx = Math.max(13, h * 0.085);
  ctx.font = `${tagPx}px "Bebas Neue", sans-serif`;
  const tw = ctx.measureText(tag).width;
  const chipW = tw + tagPx * 1.1;
  const chipH = tagPx * 1.5;
  ctx.fillStyle = 'rgba(8, 6, 18, 0.92)';
  ctx.fillRect(-w / 2 + 6 * u, -h / 2 + 6 * u, chipW, chipH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, -w / 2 + 6 * u + tagPx * 0.55, -h / 2 + 6 * u + chipH / 2 + 1);
  ctx.restore();
}

/** Five gold stars in a row. */
function drawStars(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = '#f7c948';
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', x, y);
  ctx.restore();
}

/** A deterministic barcode (fixed seed, so every render matches). */
function drawBarcode(ctx, x, y, w, h) {
  let seed = 1234567;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  ctx.save();
  ctx.fillStyle = '#f4f1e8';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  let bx = x + 4;
  while (bx < x + w - 4) {
    const bw = 1 + Math.floor(next() * 4);
    if (next() > 0.42) ctx.fillRect(bx, y + 3, bw, h - 12);
    bx += bw + 1 + Math.floor(next() * 3);
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(8, h * 0.16)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('0 5027 68911', x + w / 2, y + h - 2);
  ctx.restore();
}

/** Gold serrated seal with two lines of text. */
function drawSeal(ctx, cx, cy, r, line1, line2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const teeth = 24;
  for (let i = 0; i < teeth * 2; i++) {
    const ang = (i / (teeth * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? r : r * 0.88;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
  grad.addColorStop(0, '#ffe9a3');
  grad.addColorStop(1, '#d9a521');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = '#f7c948';
  ctx.fill();
  ctx.fillStyle = '#3a2503';
  ctx.font = `bold ${r * 0.24}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(line1, 0, -r * 0.16);
  ctx.fillText(line2, 0, r * 0.16);
  ctx.restore();
}

/** Warm sunset wash + soft vignette over the photos only (text stays crisp). */
function gradeWash(ctx, W, H, grade) {
  ctx.save();
  ctx.globalAlpha = grade.alpha + 0.1;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(20, 8, 30, 0)');
  vig.addColorStop(1, `rgba(20, 8, 30, ${grade.warm * 0.25})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------- title

const TITLE_BANDS = ['#f7d774', '#f08a4b', '#e56b9d', '#9b7ed9'];

/** The title as an offscreen canvas: horizontal chrome bands, inside the letters only. */
function stripedTitleCanvas(text, px) {
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `${px}px Anton, sans-serif`;
  const w = Math.ceil(measure.measureText(text).width) + px * 0.1;
  const h = Math.ceil(px * 1.25);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.font = `${px}px Anton, sans-serif`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.fillText(text, px * 0.05, h / 2);
  g.globalCompositeOperation = 'source-in';
  const grad = g.createLinearGradient(0, 0, 0, h);
  TITLE_BANDS.forEach((col, i) => {
    grad.addColorStop(i / TITLE_BANDS.length, col);
    grad.addColorStop((i + 1) / TITLE_BANDS.length, col);
  });
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  return c;
}

/** Draws the striped chrome title centred at (cx, cy), dark outline behind it. */
function drawStripedTitle(ctx, text, cx, cy, px) {
  const off = stripedTitleCanvas(text, px);
  ctx.save();
  ctx.font = `${px}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, px * 0.07);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1a0b2e';
  ctx.strokeText(text, cx, cy);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = px * 0.1;
  ctx.shadowOffsetY = px * 0.03;
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
  ctx.restore();
}

// ---------------------------------------------------------------- layout

/**
 * Rects for a hero-centre layout. Landscape: hero large in the centre,
 * three panels stacked on each side. Square/portrait: hero large on top,
 * a 3x2 grid below. All panels slanted; the title overlaps hero + panels.
 */
function layoutFor(W, H) {
  const u = W / 1080;
  const v = H / 1080;
  const mx = 30 * u;
  const my = 24 * v;
  const topBarH = 52 * v;
  const bottomBarH = 66 * v;
  const gap = 10 * u;
  const contentTop = my + topBarH + 8 * v;
  const contentBottom = H - my - bottomBarH;
  const contentH = contentBottom - contentTop;
  const L = { u, v, mx, my, topBarH, bottomBarH, contentTop, contentBottom, contentH };
  if (W / H > 1.25) {
    const colW = (W * 0.315 - mx - gap / 2);
    const heroX = W * 0.335;
    const heroW = W * 0.33;
    const heroH = contentH * 0.62;
    const sideH = (contentH - gap * 2) / 3;
    L.hero = { x: heroX, y: contentTop, w: heroW, h: heroH };
    L.left = [0, 1, 2].map((i) => ({ x: mx, y: contentTop + i * (sideH + gap), w: colW, h: sideH }));
    L.right = [0, 1, 2].map((i) => ({ x: W - mx - colW, y: contentTop + i * (sideH + gap), w: colW, h: sideH }));
    L.titleCy = contentTop + contentH * 0.63;
    L.titlePx = 148 * u;
    L.scriptCy = contentTop + contentH * 0.75;
    L.ribbonY = contentTop + contentH * 0.82;
  } else {
    const heroH = contentH * 0.4;
    const gridTop = contentTop + heroH + gap;
    const gridH = contentBottom - gridTop;
    const cellW = (W - mx * 2 - gap * 2) / 3;
    const cellH = (gridH - gap) / 2;
    L.hero = { x: mx, y: contentTop, w: W - mx * 2, h: heroH };
    L.left = [];
    L.right = [];
    L.grid = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        L.grid.push({ x: mx + c * (cellW + gap), y: gridTop + r * (cellH + gap), w: cellW, h: cellH });
      }
    }
    L.titleCy = contentTop + heroH + 6 * v;
    L.titlePx = 118 * u;
    L.scriptCy = L.titleCy + L.titlePx * 0.85;
    L.ribbonY = L.scriptCy + 30 * v;
  }
  return L;
}

// ---------------------------------------------------------------- draw

/** Draws the whole cover into ctx at W x H. images maps panel key -> image/canvas. */
export function drawCover(ctx, W, H, images, state) {
  const s = { ...DEFAULT_STATE, ...state };
  const grade = GRADES[s.grade] || GRADES.sunset;
  const u = W / 1080;
  const v = H / 1080;
  const L = layoutFor(W, H);
  const img = (key) => images[key];

  // Deep navy backdrop + gold outer frame.
  ctx.fillStyle = '#0e0a1e';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#f7c948';
  ctx.lineWidth = Math.max(2, 3 * u);
  ctx.strokeRect(L.mx / 2, L.my / 2, W - L.mx, H - L.my);

  // Panels: hero first, then the sides (or the grid), all slanted.
  // The top bar is drawn AFTER the panels (below), so its text is never
  // painted over by a slanted panel corner.
  const sideKeys = ['insider', 'rider', 'fixer', 'courier', 'boss', 'lookout'];
  const tags = {};
  for (const p of PANELS) tags[p.key] = p.tag;
  if (img('hero')) {
    const r = L.hero;
    drawPanel(ctx, img('hero'), r.x, r.y, r.w, r.h, SLANTS.hero, tags.hero, u, 0.2);
  }
  if (L.grid) {
    L.grid.forEach((r, i) => {
      const key = sideKeys[i];
      if (img(key)) drawPanel(ctx, img(key), r.x, r.y, r.w, r.h, SLANTS[key], tags[key], u);
    });
  } else {
    L.left.forEach((r, i) => {
      const key = sideKeys[i];
      if (img(key)) drawPanel(ctx, img(key), r.x, r.y, r.w, r.h, SLANTS[key], tags[key], u);
    });
    L.right.forEach((r, i) => {
      const key = sideKeys[i + 3];
      if (img(key)) drawPanel(ctx, img(key), r.x, r.y, r.w, r.h, SLANTS[key], tags[key], u);
    });
  }

  // Sunset wash over the photos, then the text on top, crisp.
  gradeWash(ctx, W, H, grade);

  // Top bar: five stars, the quote, the gazette + VOL. 1 box.
  // Drawn after the panels so a slanted corner can never cover the text.
  const topY = L.my + L.topBarH / 2;
  drawStars(ctx, L.mx, topY, 26 * u);
  ctx.fillStyle = '#f4e9c8';
  ctx.font = `${24 * u}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`"${s.quote}"`, W / 2, topY);
  const volText = 'VOL. 1';
  ctx.font = `bold ${22 * u}px "Bebas Neue", sans-serif`;
  const volW = ctx.measureText(volText).width + 24 * u;
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(W - L.mx - volW, L.my + 8 * v, volW, L.topBarH - 16 * v);
  ctx.fillStyle = '#1a0b2e';
  ctx.fillText(volText, W - L.mx - volW / 2, topY);
  ctx.fillStyle = '#f4e9c8';
  ctx.font = `${20 * u}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(s.gazette, W - L.mx - volW - 14 * u, topY);

  // Huge striped title, script subtitle, tagline ribbon.
  drawStripedTitle(ctx, s.title, W / 2, L.titleCy, L.titlePx);
  ctx.save();
  ctx.font = `${54 * u}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, 5 * u);
  ctx.strokeStyle = '#1a0b2e';
  ctx.strokeText(s.script, W / 2, L.scriptCy);
  ctx.fillStyle = '#e89ec4';
  ctx.shadowColor = 'rgba(232, 158, 196, 0.7)';
  ctx.shadowBlur = 10 * u;
  ctx.fillText(s.script, W / 2, L.scriptCy);
  ctx.restore();
  const ribbonH = 34 * v;
  ctx.fillStyle = '#e83e8c';
  ctx.fillRect(L.mx, L.ribbonY, W - L.mx * 2, ribbonH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${24 * u}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s.tagline, W / 2, L.ribbonY + ribbonH / 2 + 1);

  // Bottom bar: COMING SOON, billing, barcode, gold seal.
  const barY = H - L.my - L.bottomBarH;
  ctx.fillStyle = '#e89ec4';
  ctx.font = `bold ${26 * u}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', L.mx, barY + L.bottomBarH / 2);
  ctx.fillStyle = '#c9c2d6';
  ctx.font = `${11 * u}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('A SUNSET PICTURES PRODUCTION · STARRING YOU', W / 2, barY + L.bottomBarH / 2 - 9 * v);
  ctx.fillText('SHOT ON YOUR OWN CAMERA · GRADED BY HAND', W / 2, barY + L.bottomBarH / 2 + 9 * v);
  const sealR = 30 * u;
  const sealCx = W - L.mx - sealR - 8 * u;
  const sealCy = barY + L.bottomBarH / 2;
  drawBarcode(ctx, sealCx - sealR - 108 * u, barY + 10 * v, 100 * u, L.bottomBarH - 20 * v);
  drawSeal(ctx, sealCx, sealCy, sealR, 'ORIGINAL', 'COVER ART');
}

/** Renders a cover to a fresh canvas and returns it. */
export function renderCoverCanvas(W, H, images, state) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  drawCover(c.getContext('2d'), W, H, images, state);
  return c;
}
