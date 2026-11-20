// Vice Heat cover renderer: draws a multi-panel GTA-style poster onto a canvas.
// The cover is built from a state object:
//   { size: {w, h}, grade, title, subtitle, tagline, quote, studio,
//     panels: [{ id, photo, label, zoom, ox, oy }] }
// Panel photos are cover-fit with a per-panel zoom and pan offset, then graded
// with a sunset/neon wash. The title is a gradient block word with a script
// subtitle; the frame carries a quote bar, a tagline ribbon, a billing block,
// a gold seal and a barcode. No Rockstar art, logo or font is used anywhere:
// the lettering is Anton, Pacifico and Bebas Neue (all SIL OFL, under app/fonts).

export const GRADES = {
  sunset: { name: 'Sunset', top: 'rgba(255,140,60,0.10)', mid: 'rgba(255,80,120,0.22)', bottom: 'rgba(150,30,140,0.42)', frame: '#1c0b2e' },
  neon: { name: 'Neon Nights', top: 'rgba(120,60,255,0.14)', mid: 'rgba(255,40,160,0.26)', bottom: 'rgba(90,10,160,0.48)', frame: '#12041f' },
  golden: { name: 'Golden Hour', top: 'rgba(255,200,80,0.12)', mid: 'rgba(255,140,40,0.24)', bottom: 'rgba(200,60,40,0.40)', frame: '#241106' },
  vice: { name: 'Vice Purple', top: 'rgba(180,80,255,0.16)', mid: 'rgba(140,40,220,0.26)', bottom: 'rgba(60,10,120,0.48)', frame: '#150431' },
};

export const SIZES = {
  landscape: { w: 1920, h: 1080, label: 'Landscape 1920 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
};

// Panel geometry for a cover of w x h. Landscape uses a hero column in the
// middle with two panels on each side; square and portrait put the hero on
// top and the other four in a 2 x 2 grid below it. The title overlaps the
// panels in the middle band, the GTA poster way.
export function layoutFor(w, h) {
  const m = 0.028 * w;
  const gap = 0.012 * w;
  const top = 0.085 * h;
  const bot = 0.865 * h;
  const panels = [];
  const stacked = w / h <= 1.2;
  if (!stacked) {
    const lx0 = m, lx1 = 0.255 * w;
    const hx0 = 0.27 * w, hx1 = 0.73 * w;
    const rx0 = 0.745 * w, rx1 = w - m;
    const mid = (top + bot) / 2;
    panels.push({ id: 'hero', x: hx0, y: top, w: hx1 - hx0, h: bot - top });
    panels.push({ id: 'insider', x: lx0, y: top, w: lx1 - lx0, h: mid - gap / 2 - top });
    panels.push({ id: 'boss', x: rx0, y: top, w: rx1 - rx0, h: mid - gap / 2 - top });
    panels.push({ id: 'rider', x: lx0, y: mid + gap / 2, w: lx1 - lx0, h: bot - (mid + gap / 2) });
    panels.push({ id: 'courier', x: rx0, y: mid + gap / 2, w: rx1 - rx0, h: bot - (mid + gap / 2) });
    return { panels, stacked, titleY: 0.585 * h, subtitleY: 0.675 * h, taglineY: 0.71 * h, billingY: 0.925 * h, topBarY: 0.048 * h };
  }
  const heroBot = 0.50 * h;
  const lx0 = m, lx1 = 0.495 * w, rx0 = 0.505 * w, rx1 = w - m;
  const gridTop = heroBot + gap;
  const gridMid = (gridTop + bot) / 2;
  panels.push({ id: 'hero', x: lx0, y: top, w: rx1 - lx0, h: heroBot - top });
  panels.push({ id: 'insider', x: lx0, y: gridTop, w: lx1 - lx0, h: gridMid - gap / 2 - gridTop });
  panels.push({ id: 'boss', x: rx0, y: gridTop, w: rx1 - rx0, h: gridMid - gap / 2 - gridTop });
  panels.push({ id: 'rider', x: lx0, y: gridMid + gap / 2, w: lx1 - lx0, h: bot - (gridMid + gap / 2) });
  panels.push({ id: 'courier', x: rx0, y: gridMid + gap / 2, w: rx1 - rx0, h: bot - (gridMid + gap / 2) });
  return { panels, stacked, titleY: 0.545 * h, subtitleY: 0.625 * h, taglineY: 0.71 * h, billingY: 0.925 * h, topBarY: 0.048 * h };
}

// Draws one panel photo cover-fit inside rect, with a zoom factor and a pan
// offset (ox, oy in fractions of the panel size), then the grade wash. The
// photo is anchored on its focus point (the face, as a fraction of its
// height) at the panel's centre, so a face is not cropped out of a wide
// panel; the user's pan then shifts it from there.
function drawPanelPhoto(ctx, rect, photo, zoom, ox, oy, grade, focus) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo) {
    const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
    const pw = photo.naturalWidth * base;
    const ph = photo.naturalHeight * base;
    // Horizontal: centre, then pan (clamped so the photo covers the panel).
    const maxOx = Math.max(0, (pw - rect.w) / 2);
    const dx = rect.x + (rect.w - pw) / 2 + Math.max(-maxOx, Math.min(maxOx, ox * rect.w));
    // Vertical: put the focus point at the panel's centre, clamped to cover,
    // then apply the user's pan.
    const fy = (focus ?? 0.5) * ph;
    let dy = rect.y + rect.h / 2 - fy;
    dy = Math.max(rect.y + rect.h - ph, Math.min(rect.y, dy));
    const maxOy = Math.max(0, (ph - rect.h) / 2);
    dy += Math.max(-maxOy, Math.min(maxOy, oy * rect.h));
    dy = Math.max(rect.y + rect.h - ph, Math.min(rect.y, dy));
    ctx.drawImage(photo, dx, dy, pw, ph);
  } else {
    ctx.fillStyle = '#3a1c52';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, grade.mid);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // A soft vignette so the panel reads as one photograph.
  const vg = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,0,25,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Thin gold frame around the panel.
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

// A black callout chip with the panel's role, e.g. THE DRIVER. The size is
// capped so a full-width hero panel does not get a billboard-sized chip.
function drawCallout(ctx, rect, label, center, top) {
  if (!label) return;
  const text = label.trim().toUpperCase();
  const size = Math.min(Math.max(14, rect.w * 0.085), 64);
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  const tw = ctx.measureText(text).width;
  const padX = size * 0.55;
  const chipW = tw + padX * 2;
  const chipH = size * 1.45;
  const x = center ? rect.x + (rect.w - chipW) / 2 : rect.x + size * 0.35;
  const y = top ? rect.y + size * 0.35 : rect.y + rect.h - chipH - size * 0.35;
  ctx.fillStyle = 'rgba(8,2,16,0.92)';
  ctx.fillRect(x, y, chipW, chipH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + chipH / 2 + size * 0.04);
}

// The giant gradient title with a dark outline, and the script subtitle.
function drawTitle(ctx, w, layout, title, subtitle) {
  const text = (title || '').trim().toUpperCase();
  if (text) {
    let size = w * 0.17;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${size}px Anton, sans-serif`;
    while (ctx.measureText(text).width > w * 0.94 && size > 20) {
      size -= 4;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    const grad = ctx.createLinearGradient(0, layout.titleY - size, 0, layout.titleY);
    grad.addColorStop(0, '#ffe259');
    grad.addColorStop(0.35, '#ffa751');
    grad.addColorStop(0.65, '#ff5e8a');
    grad.addColorStop(1, '#c86bff');
    ctx.save();
    ctx.shadowColor = 'rgba(20,0,40,0.85)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2a0a3a';
    ctx.lineWidth = size * 0.09;
    ctx.strokeText(text, w / 2, layout.titleY);
    ctx.fillStyle = grad;
    ctx.fillText(text, w / 2, layout.titleY);
    ctx.restore();
  }
  const sub = (subtitle || '').trim();
  if (sub) {
    const size = w * 0.052;
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = 'rgba(255,110,200,0.9)';
    ctx.shadowBlur = size * 0.5;
    ctx.fillStyle = '#ff8fd6';
    ctx.fillText(sub, w / 2, layout.subtitleY);
    ctx.restore();
  }
}

// Top bar: five gold stars, the press quote, and a VOL. 1 chip.
function drawTopBar(ctx, w, layout, quote) {
  const y = layout.topBarY;
  const starSize = w * 0.022;
  ctx.font = `${starSize}px sans-serif`;
  ctx.fillStyle = '#f7c948';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', w * 0.028, y);
  const q = (quote || '').trim().toUpperCase();
  if (q) {
    const size = w * 0.018;
    ctx.font = `${size}px "Bebas Neue", sans-serif`;
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.fillText(`"${q}"`, w / 2, y);
  }
  const chip = 'VOL. 1';
  const size = w * 0.018;
  ctx.font = `bold ${size}px "Bebas Neue", sans-serif`;
  const tw = ctx.measureText(chip).width;
  const padX = size * 0.6;
  const chipW = tw + padX * 2;
  const chipH = size * 1.5;
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(w - w * 0.028 - chipW, y - chipH / 2, chipW, chipH);
  ctx.fillStyle = '#2a0a3a';
  ctx.textAlign = 'left';
  ctx.fillText(chip, w - w * 0.028 - chipW + padX, y + size * 0.05);
}

// A black pill ribbon with pink chevrons and the tagline.
function drawTagline(ctx, w, layout, tagline) {
  const text = (tagline || '').trim().toUpperCase();
  if (!text) return;
  const size = w * 0.021;
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  const tw = ctx.measureText(text).width;
  const padX = size * 1.4;
  const pillW = tw + padX * 2;
  const pillH = size * 1.7;
  const x = (w - pillW) / 2;
  const y = layout.taglineY - pillH / 2;
  ctx.fillStyle = 'rgba(8,2,16,0.94)';
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#ff5e8a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶', x + size * 0.45, y + pillH / 2 + size * 0.04);
  ctx.fillText('◀', x + pillW - size * 1.15, y + pillH / 2 + size * 0.04);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, y + pillH / 2 + size * 0.04);
}

// The small billing block at the foot of the poster.
function drawBilling(ctx, w, layout, studio) {
  const line = (studio || '').trim().toUpperCase();
  if (!line) return;
  const size = w * 0.0145;
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(line, w / 2, layout.billingY);
  ctx.fillText('SHOT ON YOUR OWN CAMERA  ·  GRADED BY HAND', w / 2, layout.billingY + size * 1.5);
}

// A gold starburst seal reading ORIGINAL COVER ART.
function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const ang = (Math.PI * i) / points - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.78;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#f7c948';
  ctx.fill();
  ctx.strokeStyle = '#8a5a00';
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#2a0a3a';
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const s = r * 0.24;
  ctx.font = `bold ${s}px "Bebas Neue", sans-serif`;
  ctx.fillText('ORIGINAL', 0, -s * 0.55);
  ctx.fillText('COVER ART', 0, s * 0.55);
  ctx.font = `${s * 0.8}px sans-serif`;
  ctx.fillStyle = '#f7c948';
  ctx.fillText('★★★', 0, s * 1.35);
  ctx.restore();
}

// A deterministic barcode with its number, drawn from a fixed seed.
function drawBarcode(ctx, x, y, w, h) {
  let seed = 20261120;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 18);
  ctx.fillStyle = '#111111';
  let bx = x;
  while (bx < x + w - 3) {
    const bw = 1 + Math.floor(next() * 4);
    if (next() > 0.45) ctx.fillRect(bx, y, bw, h);
    bx += bw + 1 + Math.floor(next() * 3);
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(9, h * 0.22)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('002113 122820', x + w / 2, y + h + 3);
}

/** Draws the whole cover onto `canvas` from `state`. The canvas is resized
 *  to the chosen export size first; the preview and the export are the same
 *  drawing, so what you see is what the PNG holds. */
export function drawCoverArt(canvas, state) {
  const { w, h } = state.size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = layoutFor(w, h);
  // Frame and backdrop.
  ctx.fillStyle = grade.frame;
  ctx.fillRect(0, 0, w, h);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, 'rgba(255,120,60,0.16)');
  bg.addColorStop(0.5, 'rgba(255,60,140,0.10)');
  bg.addColorStop(1, 'rgba(60,10,110,0.22)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // Panels. Callout chips sit clear of the title band: in the wide layout the
  // top row wears them at the top and the hero at its foot; in the stacked
  // layout the hero's goes top-left (its foot is under the title) and the
  // top row's to the foot.
  const byId = Object.fromEntries(state.panels.map((p) => [p.id, p]));
  for (const rect of layout.panels) {
    const p = byId[rect.id];
    if (!p) continue;
    drawPanelPhoto(ctx, rect, p.photo, p.zoom ?? 1, p.ox ?? 0, p.oy ?? 0, grade, p.focus);
    const isTopRow = rect.id === 'insider' || rect.id === 'boss';
    const top = layout.stacked ? rect.id === 'hero' : isTopRow;
    const center = !layout.stacked && rect.id === 'hero';
    drawCallout(ctx, rect, p.label, center, top);
  }
  drawTopBar(ctx, w, layout, state.quote);
  drawTitle(ctx, w, layout, state.title, state.subtitle);
  drawTagline(ctx, w, layout, state.tagline);
  // COMING SOON, bottom left.
  const csSize = w * 0.024;
  ctx.font = `bold ${csSize}px "Bebas Neue", sans-serif`;
  ctx.fillStyle = '#ff7ad9';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', w * 0.028, layout.billingY);
  drawBilling(ctx, w, layout, state.studio);
  // Seal and barcode, bottom right.
  const sealR = w * 0.052;
  drawSeal(ctx, w - w * 0.028 - sealR, layout.billingY - sealR * 0.35, sealR);
  const bcW = w * 0.075;
  const bcH = h * 0.032;
  drawBarcode(ctx, w - w * 0.028 - sealR * 2 - bcW - w * 0.015, layout.billingY - bcH / 2 - 6, bcW, bcH);
  // Outer gold frame.
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.strokeRect(w * 0.012, h * 0.012, w * 0.976, h * 0.976);
}

/** Finds which panel a point (in canvas pixels) lands in, or null. */
export function panelAt(layout, x, y) {
  for (const rect of layout.panels) {
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return rect.id;
  }
  return null;
}
