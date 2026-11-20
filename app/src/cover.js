// Neon Tide cover renderer: draws the five-panel GTA-style poster onto a
// canvas at any of the three post sizes. The poster is built from the
// state's five panels (each a photo plus a callout label), the lettering
// (title, script subtitle, tagline, quote, billing) and one of four grades
// (a sunset/neon colour grade plus the title's gradient). Photos are drawn
// cover-fit with a focus point, so a face the panel is centred on is never
// cropped out of a wide panel.

export const SIZES = {
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    tint: 'rgba(255, 110, 60, 0.10)',
    stops: ['#ffd23f', '#ff7a3d', '#ff2e88', '#b44dff'],
  },
  neon: {
    name: 'Neon',
    tint: 'rgba(120, 60, 255, 0.12)',
    stops: ['#7df9ff', '#ff2e88', '#b44dff', '#ff5e3a'],
  },
  golden: {
    name: 'Golden hour',
    tint: 'rgba(255, 180, 40, 0.10)',
    stops: ['#fff3b0', '#ffc93c', '#ff8a00', '#ff5e3a'],
  },
  vice: {
    name: 'Vice',
    tint: 'rgba(255, 80, 200, 0.10)',
    stops: ['#ff9ff3', '#f368e0', '#a55eea', '#ff2e88'],
  },
};

const INK = '#150b33';
const GOLD = '#e8b64c';
const PAPER = '#f5efe0';

// Five panels, in the order the poster reads them: the hero in the middle
// and one crew member in each corner.
export const PANEL_ORDER = ['hero', 'hacker', 'broker', 'enforcer', 'fixer'];

/** Geometry of every poster element, in canvas pixels, for a canvas of w×h. */
export function layoutFor(w, h) {
  const wide = w / h > 1.2;
  const frame = Math.max(4, Math.round(w * 0.006));
  const topBar = { x: w * 0.02, y: h * 0.025, w: w * 0.96, h: h * 0.06 };
  let panels;
  if (wide) {
    const top = h * 0.1;
    const bottom = h * 0.64;
    const mid = (top + bottom) / 2;
    panels = [
      { id: 'hero', x: w * 0.27, y: top, w: w * 0.46, h: bottom - top, chip: 'left' },
      { id: 'hacker', x: w * 0.02, y: top, w: w * 0.24, h: mid - top - h * 0.01, chip: 'left' },
      { id: 'broker', x: w * 0.74, y: top, w: w * 0.24, h: mid - top - h * 0.01, chip: 'right' },
      { id: 'enforcer', x: w * 0.02, y: mid + h * 0.01, w: w * 0.24, h: bottom - mid - h * 0.01, chip: 'left' },
      { id: 'fixer', x: w * 0.74, y: mid + h * 0.01, w: w * 0.24, h: bottom - mid - h * 0.01, chip: 'right' },
    ];
  } else {
    const heroTop = h * 0.075;
    const heroBottom = h * 0.42;
    const gridTop = h * 0.43;
    const gridBottom = h * 0.66;
    const gridMid = (gridTop + gridBottom) / 2;
    panels = [
      { id: 'hero', x: w * 0.02, y: heroTop, w: w * 0.96, h: heroBottom - heroTop, chip: 'left' },
      { id: 'hacker', x: w * 0.02, y: gridTop, w: w * 0.475, h: gridMid - gridTop - h * 0.008, chip: 'left' },
      { id: 'broker', x: w * 0.505, y: gridTop, w: w * 0.475, h: gridMid - gridTop - h * 0.008, chip: 'right' },
      { id: 'enforcer', x: w * 0.02, y: gridMid + h * 0.008, w: w * 0.475, h: gridBottom - gridMid - h * 0.008, chip: 'left' },
      { id: 'fixer', x: w * 0.505, y: gridMid + h * 0.008, w: w * 0.475, h: gridBottom - gridMid - h * 0.008, chip: 'right' },
    ];
  }
  const title = wide
    ? { x: w * 0.27, y: h * 0.655, w: w * 0.46, h: h * 0.2 }
    : { x: w * 0.02, y: h * 0.675, w: w * 0.96, h: h * 0.18 };
  const bottom = { x: w * 0.02, y: h * 0.88, w: w * 0.96, h: h * 0.085 };
  return { wide, frame, topBar, panels, title, bottom };
}

/** The panel id at a canvas point, or null when the point hits no panel. */
export function panelAt(layout, x, y) {
  for (const p of layout.panels) {
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p.id;
  }
  return null;
}

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawStars(ctx, x, y, size, count) {
  ctx.fillStyle = GOLD;
  for (let i = 0; i < count; i++) {
    starPath(ctx, x + i * size * 1.25 + size / 2, y + size / 2, size / 2);
    ctx.fill();
  }
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  while (px > 8) {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  return px;
}

function drawPhotoCover(ctx, img, rect, zoom, ox, oy, focus) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  // The focus point (a face, as a fraction of the photo) lands on the
  // panel's centre where the crop has slack to move; the offsets are
  // clamped so the photo always covers the whole panel, never leaving a
  // bare band at an edge.
  const fx = iw * 0.5 + (ox || 0) * iw;
  const fy = ih * (focus ?? 0.3) + (oy || 0) * ih;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const dx = clamp(rect.x + rect.w / 2 - fx * scale, rect.x + rect.w - dw, rect.x);
  const dy = clamp(rect.y + rect.h / 2 - fy * scale, rect.y + rect.h - dh, rect.y);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawChip(ctx, text, panel, align) {
  const pad = Math.max(6, panel.w * 0.02);
  const fs = Math.max(10, Math.round(panel.h * 0.085));
  ctx.font = `700 ${fs}px "Bebas Neue", sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + pad * 2;
  const bh = fs + pad * 1.1;
  const bx = align === 'right' ? panel.x + panel.w - bw - pad : panel.x + pad;
  const by = panel.y + panel.h - bh - pad;
  ctx.fillStyle = 'rgba(10, 6, 28, 0.88)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(1, fs * 0.06);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, bx + pad, by + bh / 2 + fs * 0.04);
}

function drawBarcode(ctx, x, y, w, h, seed) {
  let n = 0;
  for (const ch of seed) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#111111';
  let cx = x;
  while (cx < x + w) {
    n = (n * 1103515245 + 12345) >>> 0;
    const bw = 1 + (n % 3) * (w / 220);
    if (n % 3 !== 0) ctx.fillRect(cx, y, bw, h);
    cx += bw + w / 220;
  }
}

function drawSeal(ctx, cx, cy, r, lines) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const teeth = 18;
  for (let i = 0; i < teeth * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.82;
    const a = (i * Math.PI) / teeth;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.strokeStyle = '#8a6a1f';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = r * 0.24;
  ctx.font = `700 ${fs}px "Bebas Neue", sans-serif`;
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * fs * 1.15);
  });
  ctx.restore();
}

/** Draw the whole poster for `state` onto `canvas` at its export size. */
export function drawCoverArt(canvas, state) {
  const { w, h } = state.size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = layoutFor(w, h);

  // Deep violet night sky behind everything.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#241145');
  sky.addColorStop(0.55, '#3d1a5e');
  sky.addColorStop(1, '#150b33');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Panels: photo, thin gold frame, callout chip.
  for (const def of layout.panels) {
    const p = state.panels.find((x) => x.id === def.id);
    if (p && p.photo) drawPhotoCover(ctx, p.photo, def, p.zoom, p.ox, p.oy, p.focus);
    else {
      ctx.fillStyle = '#2c1c52';
      ctx.fillRect(def.x, def.y, def.w, def.h);
    }
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(def.x, def.y, def.w, def.h);
    if (p) drawChip(ctx, p.label, def, def.chip);
  }

  // Grade tint over the photos, sunset to neon.
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);

  // Top bar: five gold stars, the press quote, the issue chip.
  const tb = layout.topBar;
  const starSize = Math.min(tb.h * 0.7, w * 0.028);
  drawStars(ctx, tb.x, tb.y + (tb.h - starSize) / 2, starSize, 5);
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const quotePx = fitFont(ctx, `“${state.quote}”`, tb.w * 0.6, tb.h * 0.62, 'Georgia, serif', 'italic 700');
  ctx.font = `italic 700 ${quotePx}px Georgia, serif`;
  ctx.fillText(`“${state.quote}”`, tb.x + tb.w / 2, tb.y + tb.h / 2);
  const issueFs = Math.max(12, Math.round(tb.h * 0.42));
  ctx.font = `700 ${issueFs}px "Bebas Neue", sans-serif`;
  const issueText = state.issue;
  const iw = ctx.measureText(issueText).width + issueFs * 1.2;
  ctx.fillStyle = GOLD;
  ctx.fillRect(tb.x + tb.w - iw, tb.y + (tb.h - issueFs * 1.5) / 2, iw, issueFs * 1.5);
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.fillText(issueText, tb.x + tb.w - iw + issueFs * 0.6, tb.y + tb.h / 2 + issueFs * 0.05);

  // Title block: dark navy slab, gradient title, script subtitle, tagline.
  const t = layout.title;
  ctx.fillStyle = '#1b1145';
  ctx.fillRect(t.x, t.y, t.w, t.h);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, w * 0.0018);
  ctx.strokeRect(t.x, t.y, t.w, t.h);
  const titlePx = fitFont(ctx, state.title, t.w * 0.94, t.h * 0.42, 'Anton, sans-serif', '400');
  const grad = ctx.createLinearGradient(t.x, t.y, t.x + t.w, t.y + t.h * 0.4);
  grade.stops.forEach((c, i) => grad.addColorStop(i / (grade.stops.length - 1), c));
  ctx.fillStyle = grad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.fillText(state.title, t.x + t.w / 2, t.y + t.h * 0.3);
  const subPx = Math.max(14, Math.round(t.h * 0.17));
  ctx.fillStyle = '#ff5da2';
  ctx.font = `${subPx}px Pacifico, cursive`;
  ctx.fillText(state.subtitle, t.x + t.w / 2, t.y + t.h * 0.58);
  const tagFs = Math.max(11, Math.round(t.h * 0.11));
  ctx.fillStyle = PAPER;
  ctx.font = `700 ${tagFs}px "Bebas Neue", sans-serif`;
  ctx.fillText(state.tagline, t.x + t.w / 2, t.y + t.h * 0.84);

  // Bottom strip: release line, billing, barcode, seal.
  const b = layout.bottom;
  const relFs = Math.max(13, Math.round(b.h * 0.42));
  ctx.fillStyle = '#ff5d73';
  ctx.textAlign = 'left';
  ctx.font = `700 ${relFs}px "Bebas Neue", sans-serif`;
  ctx.fillText(state.bottom, b.x, b.y + b.h * 0.32);
  const billFs = Math.max(9, Math.round(b.h * 0.2));
  const sealR = b.h * 0.46;
  const barcodeW = b.w * 0.09;
  const barcodeX = b.x + b.w - sealR * 2 - b.h * 0.35 - barcodeW;
  // The billing line is centred in the space left of the barcode and seal,
  // and shrunk to fit it, so it never runs underneath them.
  const billMax = barcodeX - b.x - b.h * 0.15;
  const billPx = fitFont(ctx, state.studio, billMax, billFs, 'Georgia, serif', '');
  ctx.fillStyle = '#cfc6e8';
  ctx.font = `${billPx}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(state.studio, b.x + billMax / 2, b.y + b.h * 0.78);
  drawSeal(ctx, b.x + b.w - sealR - b.h * 0.1, b.y + b.h / 2, sealR, state.seal);
  drawBarcode(ctx, barcodeX, b.y + b.h * 0.18, barcodeW, b.h * 0.64, state.title);

  // Thin gold frame around the whole poster.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = layout.frame;
  ctx.strokeRect(layout.frame / 2, layout.frame / 2, w - layout.frame, h - layout.frame);
  return layout;
}
