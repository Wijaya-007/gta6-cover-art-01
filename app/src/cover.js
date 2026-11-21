// VICE HEAT — poster renderer (rebuild #10, Golden Mile formula).
// Draws the GTA-style multi-panel cover on a 2D canvas. Pure canvas, no
// network, no fonts outside the app's own WOFF2 files. All layout is
// computed from the canvas size so the same code renders 1:1, 4:5 and 16:9.
// Layout: GOLDEN MILE hero-centre — one LARGE hero close-up dominates the
// centre, seven panels around it at slight alternating tilts (2-3 degrees),
// so the composition reads as a dynamic game cover, never a rigid grid.
// The huge striped chrome title overlaps the hero and the panels; a script
// subtitle, a tagline ribbon, a five-star press bar, a billing block, a
// barcode and a gold seal finish it. Panels mix four character portraits
// (facing different directions) with three action scenes (police,
// helicopter, speedboat) — the airplane panel was dropped, helicopter +
// airplane together were redundant flying vehicles.

export const GRADES = [
  // Sunset is the default grade and the poster's whole tone (Sundown
  // Racket style): a LIGHT warm touch, not a flood. The photos are
  // already golden-hour; the grade just warms them a little. Rebuild #9
  // toned this down — the old 0.20/0.30 wash read as cheap CGI.
  { id: 'sunset', name: 'Sunset', tint: '#ff7a18', alpha: 0.1, warm: 0.12 },
  { id: 'neon', name: 'Neon', tint: '#ff2e88', alpha: 0.18, warm: 0.08 },
  { id: 'gold', name: 'Gold', tint: '#ffb400', alpha: 0.12, warm: 0.14 },
  { id: 'teal', name: 'Teal', tint: '#00c2a8', alpha: 0.16, warm: 0.0 },
  { id: 'noir', name: 'Noir', tint: '#5a5a6e', alpha: 0.28, warm: 0.0 },
];

// The seven panels of a VICE HEAT cover. `tag` is the name chip drawn on
// the panel; `focus` is the face-aware anchor (0..1) used by the cover-fit
// crop. Scene panels (helicopter, speedboat) use a centre focus — there is
// no face to keep. Tags match the picture: THE LAW is the police scene,
// THE PILOT the helicopter, THE CAPTAIN the speedboat.
export const PANELS = [
  { key: 'hero', tag: 'THE DRIVER', focus: [0.5, 0.32] },
  { key: 'insider', tag: 'THE INSIDER', focus: [0.5, 0.3] },
  { key: 'boss', tag: 'THE PILOT', focus: [0.5, 0.45] },
  { key: 'rider', tag: 'THE RIDER', focus: [0.5, 0.3] },
  { key: 'courier', tag: 'THE COURIER', focus: [0.5, 0.3] },
  { key: 'fixer', tag: 'THE LAW', focus: [0.5, 0.35] },
  { key: 'lookout', tag: 'THE CAPTAIN', focus: [0.5, 0.5] },
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

// Draws one photo panel at a slight tilt, Golden Mile style. The panel is
// drawn in a rotated frame around its own centre, expanded by a few units
// on each side so the tilt leaves no triangular gaps against its
// neighbours — the panels overlap a hair at the corners, like a collage
// pinned at angles, never a rigid grid. `tagSide` puts the name chip on
// the panel's outer edge (away from the hero) so the hero never covers it.
function drawPanel(ctx, p, def, img, grade, u, slantDeg, tagSide) {
  const rad = (slantDeg * Math.PI) / 180;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const pad = 4 * u; // expansion that hides the rotation gaps
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  const x = -p.w / 2 - pad;
  const y = -p.h / 2 - pad;
  const w = p.w + pad * 2;
  const h = p.h + pad * 2;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) drawCoverFit(ctx, img, x, y, w, h, def.focus[0], def.focus[1]);
  else {
    ctx.fillStyle = '#2a1548';
    ctx.fillRect(x, y, w, h);
  }
  // Grade wash over the photo — a light touch (the old alpha+0.25 flood
  // turned every panel into a neon orange wash; this stays smooth).
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.tint;
  ctx.globalAlpha = grade.alpha + 0.1;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // Dark lower gradient keeps the name chip legible on bright photos.
  const shade = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
  shade.addColorStop(0, 'rgba(12,4,24,0)');
  shade.addColorStop(1, 'rgba(12,4,24,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // Gold inner border + name chip, drawn in the same tilted frame.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(1, 2.5 * u);
  ctx.strokeRect(x, y, w, h);
  const tag = def.tag;
  ctx.font = `${Math.max(10, 18 * u)}px 'Bebas Neue', sans-serif`;
  const tw = Math.min(w - 16 * u, ctx.measureText(tag).width + 22 * u);
  const th = 26 * u;
  const tagY = y + 8 * u;
  const tagX = tagSide === 'right' ? x + w - tw - 8 * u : x + 8 * u;
  ctx.fillStyle = 'rgba(10,5,20,0.92)';
  rr(ctx, tagX, tagY, tw, th, 2 * u);
  ctx.fill();
  ctx.fillStyle = '#f5c542';
  ctx.fillRect(tagSide === 'right' ? tagX + tw - 5 * u : tagX, tagY, 5 * u, th);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, tagX + (tagSide === 'right' ? 8 * u : 18 * u), tagY + th / 2 + 1 * u, tw - 14 * u);
  ctx.restore();
}

// --- the poster -----------------------------------------------------------

// Draws the whole VICE HEAT cover. `images` maps panel keys to HTMLImage
// elements (or canvases). `opts` overrides DEFAULT_STATE. The canvas is
// assumed to already be sized to the export size.
export function drawCover(ctx, W, H, images, opts = {}) {
  const s = { ...DEFAULT_STATE, ...opts };
  const grade = GRADES.find((g) => g.id === s.grade) || GRADES[0];
  const u = W / 1080; // unit: 1 at 1080 wide
  // Vertical unit: 1 at 1080 tall. u scales with WIDTH, so on a 16:9
  // canvas (u = 1.78) every u-based vertical offset overflows the bottom
  // bar past the frame. The bottom bar measures vertically in v.
  const v = H / 1080;

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

  // ---- hero-centre panel arrangement (Golden Mile formula)
  // One LARGE hero close-up dominates the centre; the other six panels
  // sit around it at slight alternating tilts, so the composition reads
  // as a dynamic game cover, never a rigid grid. The hero is drawn last
  // so it sits on top where its expanded edges meet the side panels.
  const gridX = 30 * u;
  const gridW = W - 60 * u;
  const gridY = 66 * u;
  const gridH = H * 0.8;
  const gap = 10 * u;
  const panels = {};
  let titleY;
  const wide = W / H > 1.25;

  if (wide) {
    // Landscape: hero large top-centre, one panel on each side of it,
    // four panels in a row beneath — the Golden Mile arrangement. The
    // hero's face is the first thing the eye lands on, and the centre
    // below it is filled with panels, not empty backdrop.
    const heroW = gridW * 0.38;
    const heroH = gridH * 0.58;
    const sideW = (gridW - heroW - gap * 2) / 2;
    const botH = gridH - heroH - gap;
    const botW = (gridW - gap * 3) / 4;
    const botY = gridY + heroH + gap;
    panels.insider = { x: gridX, y: gridY, w: sideW, h: heroH };
    panels.hero = { x: gridX + sideW + gap, y: gridY, w: heroW, h: heroH };
    panels.rider = { x: gridX + sideW + gap + heroW + gap, y: gridY, w: sideW, h: heroH };
    panels.fixer = { x: gridX, y: botY, w: botW, h: botH };
    panels.boss = { x: gridX + botW + gap, y: botY, w: botW, h: botH };
    panels.courier = { x: gridX + (botW + gap) * 2, y: botY, w: botW, h: botH };
    panels.lookout = { x: gridX + (botW + gap) * 3, y: botY, w: botW, h: botH };
    titleY = gridY + heroH * 0.82;
  } else {
    // Square / portrait: hero large on top, six panels in a 3x2 grid
    // below it, all slightly tilted. The title overlaps the hero's lower
    // edge and the top of the grid beneath it.
    const heroH = gridH * 0.5;
    const lowerY = gridY + heroH + gap;
    const lowerH = gridH - heroH - gap;
    const cardW = (gridW - gap * 2) / 3;
    const cardH = (lowerH - gap) / 2;
    panels.hero = { x: gridX, y: gridY, w: gridW, h: heroH };
    panels.insider = { x: gridX, y: lowerY, w: cardW, h: cardH };
    panels.fixer = { x: gridX + cardW + gap, y: lowerY, w: cardW, h: cardH };
    panels.rider = { x: gridX + (cardW + gap) * 2, y: lowerY, w: cardW, h: cardH };
    panels.boss = { x: gridX, y: lowerY + cardH + gap, w: cardW, h: cardH };
    panels.courier = { x: gridX + cardW + gap, y: lowerY + cardH + gap, w: cardW, h: cardH };
    panels.lookout = { x: gridX + (cardW + gap) * 2, y: lowerY + cardH + gap, w: cardW, h: cardH };
    titleY = gridY + heroH * 0.8;
  }

  // Slant per panel (degrees, alternating so no two neighbours lean the
  // same way, and wide enough to read as a tilt, not a rendering wobble).
  // The hero stays straight — it is the anchor.
  const slants = wide
    ? { insider: -3, fixer: 2.5, boss: -2.5, hero: 0, rider: 3, courier: 2.5, lookout: -3 }
    : { hero: 0, insider: -3, fixer: 2.5, rider: -2.5, boss: 2.5, courier: -3, lookout: 2.5 };
  // Name-chip side: outer edge, away from the hero and the centred title.
  const tagSides = wide
    ? { insider: 'left', fixer: 'left', boss: 'left', hero: 'left', rider: 'right', courier: 'left', lookout: 'right' }
    : { hero: 'left', insider: 'left', fixer: 'left', rider: 'left', boss: 'left', courier: 'left', lookout: 'left' };
  // Draw side panels first, hero last (on top at the overlaps).
  const drawOrder = wide
    ? ['fixer', 'boss', 'courier', 'lookout', 'insider', 'rider', 'hero']
    : ['insider', 'fixer', 'rider', 'boss', 'courier', 'lookout', 'hero'];
  for (const key of drawOrder) {
    const def = PANELS.find((d) => d.key === key);
    drawPanel(ctx, panels[key], def, images[key], grade, u, slants[key], tagSides[key]);
  }

  // ---- big striped title overlapping the hero and the panels
  // Wide 16:9 exports have room for a larger title than square/portrait.
  const titleStartPx = (wide ? 170 : 150) * u;
  const titlePx = fitFont(ctx, s.title, "'Anton', sans-serif", gridW * 0.94, titleStartPx);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${titlePx}px 'Anton', sans-serif`;
  // Chrome gradient fill: yellow -> orange -> pink -> purple, MUTED
  // (the old neon stops read as cheap CGI; these keep the same hues at
  // lower saturation, smooth like the top 1-5 entries).
  const tg = ctx.createLinearGradient(0, titleY - titlePx * 0.55, 0, titleY + titlePx * 0.55);
  tg.addColorStop(0, '#f2d67c');
  tg.addColorStop(0.35, '#e08a68');
  tg.addColorStop(0.65, '#d2698f');
  tg.addColorStop(1, '#a98fd0');
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
  // Muted rose, soft glow (the old hot-pink + strong glow was another
  // neon-CGI cue). A dark stroke keeps it legible where it crosses a
  // bright panel (the helicopter sky) instead of washing out.
  ctx.lineWidth = Math.max(2, 5 * u);
  ctx.strokeStyle = '#2a0a3e';
  ctx.strokeText(s.subtitle, W / 2, subY);
  ctx.fillStyle = '#e89ec4';
  ctx.shadowColor = '#c65a8a';
  ctx.shadowBlur = 10 * u;
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
  // All VERTICAL measurements use v (H-based). The old code measured
  // them in u (W-based), so on a 16:9 canvas (u = 1.78) the billing
  // second line and the barcode box ran past the bottom edge.
  // Horizontal positions still use u; the bar now ends inside the frame
  // at every export size (verified at 1920x1080, 1080x1080, 1080x1350).
  const botY = gridY + gridH + 26 * v;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ff5fa2';
  const csPx = fitFont(ctx, 'COMING SOON', "'Anton', sans-serif", gridW * 0.3, 34 * v);
  ctx.font = `${csPx}px 'Anton', sans-serif`;
  ctx.fillText('COMING SOON', gridX, botY + 10 * v);
  ctx.fillStyle = '#e8dcc8';
  ctx.textAlign = 'center';
  ctx.font = `${Math.max(9, 13.5 * v)}px 'Bebas Neue', sans-serif`;
  ctx.fillText('A SUNSET PICTURES PRODUCTION · STARRING YOU', W / 2, botY + 2 * v);
  ctx.fillText('SHOT ON YOUR OWN CAMERA · GRADED BY HAND', W / 2, botY + 20 * v);
  // Barcode: deterministic bars from the seed. It sits LEFT of the gold
  // seal with a clear gap — the old position overlapped the seal, which
  // covered the barcode's right end.
  const rng = mulberry32(s.seed);
  const bcX = W - gridX - 250 * u;
  const bcW = 110 * u;
  const bcH = 34 * v;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bcX - 6 * u, botY - 8 * v, bcW + 12 * u, bcH + 16 * v);
  ctx.fillStyle = '#111111';
  let bx = bcX;
  while (bx < bcX + bcW) {
    const bw = (1 + Math.floor(rng() * 4)) * u;
    if (rng() > 0.45) ctx.fillRect(bx, botY - 4 * v, bw, bcH);
    bx += bw + (1 + Math.floor(rng() * 3)) * u;
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(8, 11 * v)}px 'Bebas Neue', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('0 10472 85991 8', bcX + bcW / 2, botY + bcH + 4 * v);
  // Gold seal: starburst circle, bottom-right corner. Kept clear of the
  // barcode (which now sits 250u from the right edge): the seal spans
  // roughly W-122u..W-26u, the barcode ends at W-250u+110u = W-140u.
  // The seal is sized in v like the rest of the bottom bar, and lifted
  // a touch so its lower edge clears the inner gold frame.
  const sealCx = W - 74 * u;
  const sealCy = H - 88 * v;
  const sealR = 48 * v;
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
  ctx.lineWidth = 2 * v;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, sealR * 0.68, 0, Math.PI * 2);
  ctx.strokeStyle = '#8a6d1f';
  ctx.stroke();
  ctx.fillStyle = '#3a2a00';
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.max(9, 13 * v)}px 'Anton', sans-serif`;
  ctx.fillText('ORIGINAL', 0, -8 * v);
  ctx.fillText('COVER ART', 0, 8 * v);
  star(ctx, 0, 20 * v, 7 * v, 3 * v);
  ctx.fillStyle = '#3a2a00';
  ctx.fill();
  ctx.restore();

  // ---- warm vignette for the golden-hour grade — light, so the poster
  // stays smooth instead of ringing the frame in orange.
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(255,150,50,0)');
  vg.addColorStop(1, `rgba(255,110,20,${grade.warm * 0.25})`);
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
