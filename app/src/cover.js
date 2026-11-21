// VICE HEAT — poster renderer (rebuild #8).
// Draws the GTA-style multi-panel cover on a 2D canvas. Pure canvas, no
// network, no fonts outside the app's own WOFF2 files. All layout is
// computed from the canvas size so the same code renders 1:1, 4:5 and 16:9.
// Layout: classic collage grid — four panels on top, three below, big
// striped title in the centre overlapping the row seam. The seven panels
// mix four character portraits with three action scenes (police, helicopter,
// airplane) so no two neighbours face or read the same way.

export const GRADES = [
  // Sunset is the default grade and the poster's whole tone (Sundown
  // Racket style): a strong warm wash so every panel reads golden-hour.
  { id: 'sunset', name: 'Sunset', tint: '#ff7a18', alpha: 0.2, warm: 0.3 },
  { id: 'neon', name: 'Neon', tint: '#ff2e88', alpha: 0.18, warm: 0.08 },
  { id: 'gold', name: 'Gold', tint: '#ffb400', alpha: 0.2, warm: 0.3 },
  { id: 'teal', name: 'Teal', tint: '#00c2a8', alpha: 0.16, warm: 0.0 },
  { id: 'noir', name: 'Noir', tint: '#5a5a6e', alpha: 0.28, warm: 0.0 },
];

// The seven panels of a VICE HEAT cover. `tag` is the name chip drawn on
// the panel; `photo` is the key into the images map; `focus` is the
// face-aware anchor (0..1) used by the cover-fit crop. Scene panels
// (helicopter, airplane) use a centre focus — there is no face to keep.
export const PANELS = [
  { key: 'hero', tag: 'THE DRIVER', focus: [0.5, 0.32] },
  { key: 'insider', tag: 'THE INSIDER', focus: [0.5, 0.3] },
  { key: 'boss', tag: 'THE BOSS', focus: [0.5, 0.45] },
  { key: 'rider', tag: 'THE RIDER', focus: [0.5, 0.3] },
  { key: 'courier', tag: 'THE COURIER', focus: [0.5, 0.3] },
  { key: 'fixer', tag: 'THE FIXER', focus: [0.5, 0.35] },
  { key: 'lookout', tag: 'THE LOOKOUT', focus: [0.5, 0.5] },
];

export const DEFAULT_STATE = {
  title: 'VICE HEAT',
  subtitle: 'one last ride',
  tagline: 'FIVE FRIENDS · ONE COAST · NO WAY BACK',
  quote: 'PURE GOLDEN-HOUR MAYHEM',
  vol: 'VOL. 1',
  grade: 'sunset',
  seed: 77,
};

// --- small canvas helpers -------------------------------------------------

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function star(ctx, cx, cy, rOuter, rInner, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Cover-fit draw with a focus point: keeps the face in frame when the
// panel aspect differs from the photo aspect.
export function drawCoverFit(ctx, img, x, y, w, h, fx = 0.5, fy = 0.35) {
  if (!img || !img.naturalWidth) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = x + (w - dw) * fx;
  const oy = y + (h - dh) * fy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, ox, oy, dw, dh);
  ctx.restore();
}

// A deterministic pseudo-random stream from a seed, for the barcode.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fitFont(ctx, text, fontFamily, maxWidth, startPx, weight = '') {
  let px = startPx;
  while (px > 8) {
    ctx.font = `${weight} ${px}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return px;
    px -= 1;
  }
  return px;
}

// --- the poster -----------------------------------------------------------

// Draws the whole VICE HEAT cover. `images` maps panel keys to HTMLImage
// elements (or canvases). `opts` overrides DEFAULT_STATE. The canvas is
// assumed to already be sized to the export size.
export function drawCover(ctx, W, H, images, opts = {}) {
  const s = { ...DEFAULT_STATE, ...opts };
  const grade = GRADES.find((g) => g.id === s.grade) || GRADES[0];
  const u = W / 1080; // unit: 1 at 1080 wide

  // Backdrop: deep purple night + gold frame.
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(2, 6 * u);
  ctx.strokeRect(10 * u, 10 * u, W - 20 * u, H - 20 * u);
  ctx.strokeStyle = 'rgba(245,197,66,0.35)';
  ctx.lineWidth = Math.max(1, 2 * u);
  ctx.strokeRect(20 * u, 20 * u, W - 40 * u, H - 40 * u);

  // ---- top bar: stars + press quote + VOL box
  const barY = 34 * u;
  const starR = 13 * u;
  ctx.fillStyle = '#f5c542';
  for (let i = 0; i < 5; i++) {
    star(ctx, 52 * u + i * (starR * 2 + 6 * u), barY, starR, starR * 0.45);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const quotePx = fitFont(ctx, `"${s.quote}"`, "'Bebas Neue', sans-serif", W * 0.52, 30 * u);
  ctx.font = `${quotePx}px 'Bebas Neue', sans-serif`;
  ctx.fillText(`"${s.quote}"`, W / 2, barY);
  // VOL box
  ctx.fillStyle = '#f5c542';
  const volW = 92 * u;
  const volH = 34 * u;
  rr(ctx, W - 34 * u - volW, barY - volH / 2, volW, volH, 3 * u);
  ctx.fill();
  ctx.fillStyle = '#160a2e';
  ctx.font = `bold ${20 * u}px 'Anton', sans-serif`;
  ctx.fillText(s.vol, W - 34 * u - volW / 2, barY + 1 * u);

  // ---- main grid: CLASSIC COLLAGE (per Yans's reference: a tight grid
  // of panels with the big title in the centre overlapping them — the
  // structure only, all content is our own original VICE HEAT material).
  // Top row: four equal panels. Bottom row: three equal panels. No panel
  // dominates; the title sits in the middle overlapping the row boundary.
  // Four panels are character portraits facing different directions, three
  // are action scenes (police, helicopter, airplane) — the mix keeps the
  // grid from reading as seven identical headshots.
  const gridX = 30 * u;
  const gridW = W - 60 * u;
  const gridY = 66 * u;
  const gridH = H * 0.8;
  const gap = 10 * u;
  const topH = gridH * 0.52;
  const botH = gridH - topH - gap;
  const topW = (gridW - gap * 3) / 4;
  const botW = (gridW - gap * 2) / 3;

  const panels = {
    insider: { x: gridX, y: gridY, w: topW, h: topH },
    hero: { x: gridX + topW + gap, y: gridY, w: topW, h: topH },
    fixer: { x: gridX + (topW + gap) * 2, y: gridY, w: topW, h: topH },
    rider: { x: gridX + (topW + gap) * 3, y: gridY, w: topW, h: topH },
    boss: { x: gridX, y: gridY + topH + gap, w: botW, h: botH },
    courier: { x: gridX + botW + gap, y: gridY + topH + gap, w: botW, h: botH },
    lookout: { x: gridX + (botW + gap) * 2, y: gridY + topH + gap, w: botW, h: botH },
  };

  // Draw each photo panel with a thin gold inner border.
  const photoKeys = ['insider', 'hero', 'fixer', 'rider', 'boss', 'courier', 'lookout'];
  for (const key of photoKeys) {
    const p = panels[key];
    const def = PANELS.find((d) => d.key === key);
    const img = images[key];
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, p.h);
    ctx.clip();
    if (img) drawCoverFit(ctx, img, p.x, p.y, p.w, p.h, def.focus[0], def.focus[1]);
    else {
      ctx.fillStyle = '#2a1548';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    // grade wash over the photo
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = grade.tint;
    ctx.globalAlpha = grade.alpha + 0.25;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = Math.max(1, 2.5 * u);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    // name tag chip: top-row panels wear it on top, bottom-row panels on
    // the bottom (the big title overlaps the boundary between the rows).
    const tag = def.tag;
    ctx.font = `${Math.max(11, 19 * u)}px 'Bebas Neue', sans-serif`;
    const tw = ctx.measureText(tag).width + 18 * u;
    const th = 26 * u;
    const isBottomRow = p.y > gridY + topH;
    const tagY = isBottomRow ? p.y + p.h - th - 8 * u : p.y + 8 * u;
    ctx.fillStyle = 'rgba(10,5,20,0.92)';
    rr(ctx, p.x + 8 * u, tagY, tw, th, 2 * u);
    ctx.fill();
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(p.x + 8 * u, tagY, 5 * u, th);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, p.x + 18 * u, tagY + th / 2 + 1 * u);
  }

  // ---- big striped title overlapping the row seam
  // Wide 16:9 exports have room for a larger title than square/portrait.
  const titleY = gridY + topH + 6 * u;
  const titleStartPx = (W / H > 1.25 ? 170 : 150) * u;
  const titlePx = fitFont(ctx, s.title, "'Anton', sans-serif", gridW * 0.94, titleStartPx);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${titlePx}px 'Anton', sans-serif`;
  // Chrome gradient fill: yellow -> orange -> pink -> purple.
  const tg = ctx.createLinearGradient(0, titleY - titlePx * 0.55, 0, titleY + titlePx * 0.55);
  tg.addColorStop(0, '#ffe259');
  tg.addColorStop(0.35, '#ff7e5f');
  tg.addColorStop(0.65, '#ff2e88');
  tg.addColorStop(1, '#c86bff');
  ctx.lineWidth = Math.max(2, 7 * u);
  ctx.strokeStyle = '#2a0a3e';
  ctx.strokeText(s.title, W / 2, titleY);
  ctx.fillStyle = tg;
  ctx.fillText(s.title, W / 2, titleY);
  // Horizontal stripes confined INSIDE the title letters only. The old
  // code drew them with 'source-atop' on the main canvas, but the canvas
  // is opaque everywhere (backdrop + photos), so the stripes leaked
  // across the whole poster. Fix: draw the stripe bands on a transparent
  // offscreen canvas, then punch them to the glyph shapes with
  // 'destination-in' (keeps destination pixels only where the text is
  // opaque), and composite the result over the gradient title. The
  // offscreen never carries the glyph fill itself, so the gradient stays.
  const stripe = document.createElement('canvas');
  stripe.width = W;
  stripe.height = H;
  const sctx = stripe.getContext('2d');
  sctx.fillStyle = 'rgba(255,255,255,0.28)';
  for (let yy = titleY - titlePx * 0.5; yy < titleY + titlePx * 0.5; yy += titlePx * 0.22) {
    sctx.fillRect(0, yy, W, titlePx * 0.07);
  }
  sctx.globalCompositeOperation = 'destination-in';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.font = `${titlePx}px 'Anton', sans-serif`;
  sctx.fillStyle = '#ffffff';
  sctx.fillText(s.title, W / 2, titleY);
  ctx.drawImage(stripe, 0, 0);

  // ---- pink script subtitle
  const subY = titleY + titlePx * 0.62;
  const subPx = fitFont(ctx, s.subtitle, "'Pacifico', cursive", gridW * 0.6, 58 * u);
  ctx.font = `${subPx}px 'Pacifico', cursive`;
  ctx.fillStyle = '#ff8fd1';
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 18 * u;
  ctx.fillText(s.subtitle, W / 2, subY);
  ctx.shadowBlur = 0;

  // ---- tagline ribbon
  const ribY = subY + subPx * 0.75;
  const ribH = 34 * u;
  ctx.font = `${Math.max(12, 21 * u)}px 'Bebas Neue', sans-serif`;
  const ribTextW = ctx.measureText(s.tagline).width + 44 * u;
  const ribX = (W - ribTextW) / 2;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.moveTo(ribX - 14 * u, ribY - ribH / 2);
  ctx.lineTo(ribX + ribTextW + 14 * u, ribY - ribH / 2);
  ctx.lineTo(ribX + ribTextW, ribY + ribH / 2);
  ctx.lineTo(ribX, ribY + ribH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(s.tagline, W / 2, ribY + 1 * u);

  // ---- bottom bar: COMING SOON + billing + barcode + gold seal
  const botY = gridY + gridH + 26 * u;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ff5fa2';
  const csPx = fitFont(ctx, 'COMING SOON', "'Anton', sans-serif", gridW * 0.3, 34 * u);
  ctx.font = `${csPx}px 'Anton', sans-serif`;
  ctx.fillText('COMING SOON', gridX, botY + 10 * u);
  ctx.fillStyle = '#e8dcc8';
  ctx.textAlign = 'center';
  ctx.font = `${Math.max(9, 13.5 * u)}px 'Bebas Neue', sans-serif`;
  ctx.fillText('A SUNSET PICTURES PRODUCTION · STARRING YOU', W / 2, botY + 2 * u);
  ctx.fillText('SHOT ON YOUR OWN CAMERA · GRADED BY HAND', W / 2, botY + 20 * u);
  // Barcode: deterministic bars from the seed. It sits LEFT of the gold
  // seal with a clear gap — the old position overlapped the seal, which
  // covered the barcode's right end.
  const rng = mulberry32(s.seed);
  const bcX = W - gridX - 250 * u;
  const bcW = 110 * u;
  const bcH = 34 * u;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bcX - 6 * u, botY - 8 * u, bcW + 12 * u, bcH + 16 * u);
  ctx.fillStyle = '#111111';
  let bx = bcX;
  while (bx < bcX + bcW) {
    const bw = (1 + Math.floor(rng() * 4)) * u;
    if (rng() > 0.45) ctx.fillRect(bx, botY - 4 * u, bw, bcH);
    bx += bw + (1 + Math.floor(rng() * 3)) * u;
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(8, 11 * u)}px 'Bebas Neue', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('0 10472 85991 8', bcX + bcW / 2, botY + bcH + 4 * u);
  // Gold seal: starburst circle, bottom-right corner. Kept clear of the
  // barcode (which now sits 250u from the right edge): the seal spans
  // roughly W-122u..W-26u, the barcode ends at W-250u+110u = W-140u.
  const sealCx = W - 74 * u;
  const sealCy = H - 74 * u;
  const sealR = 48 * u;
  ctx.save();
  ctx.translate(sealCx, sealCy);
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (Math.PI * 2 * i) / 24;
    const r = i % 2 === 0 ? sealR : sealR * 0.86;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#f5c542';
  ctx.fill();
  ctx.strokeStyle = '#8a6d1f';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, sealR * 0.68, 0, Math.PI * 2);
  ctx.strokeStyle = '#8a6d1f';
  ctx.stroke();
  ctx.fillStyle = '#3a2a00';
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.max(9, 13 * u)}px 'Anton', sans-serif`;
  ctx.fillText('ORIGINAL', 0, -8 * u);
  ctx.fillText('COVER ART', 0, 8 * u);
  star(ctx, 0, 20 * u, 7 * u, 3 * u);
  ctx.fillStyle = '#3a2a00';
  ctx.fill();
  ctx.restore();

  // ---- warm vignette for the golden-hour grade
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(255,150,50,0)');
  vg.addColorStop(1, `rgba(255,110,20,${grade.warm * 0.5})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

// --- export sizes ---------------------------------------------------------

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1:1', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 4:5', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 16:9', w: 1920, h: 1080 },
];

// Renders the cover to an offscreen canvas at the requested size.
export function renderCoverCanvas(images, opts, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, size.w, size.h, images, opts);
  return canvas;
}
