// NEON TIDE cover renderer: draws the five-crew GTA-style poster on a
// canvas. Layout: a tall hero panel in the centre (The Getaway), the other
// four crews in the corners (Hacker / Broker top, Enforcer / Fixer bottom),
// title + script + five stars across the top, tagline + ISSUE 04 at the foot.
// Photos are drawn cover-fit inside their gold frames; a missing photo gets
// a neon gradient placeholder with the crew name.

export const CREWS = [
  { key: 'hero', name: 'THE GETAWAY', sample: 'neon-hero.jpg' },
  { key: 'hacker', name: 'THE HACKER', sample: 'neon-hacker.jpg' },
  { key: 'broker', name: 'THE BROKER', sample: 'neon-broker.jpg' },
  { key: 'enforcer', name: 'THE ENFORCER', sample: 'neon-enforcer.jpg' },
  { key: 'fixer', name: 'THE FIXER', sample: 'neon-fixer.jpg' },
];

export const DEFAULT_STATE = {
  title: 'NEON TIDE',
  script: 'After Midnight',
  tagline: 'FIVE CREWS · ONE HARBOR · NO MERCY',
  photos: { hero: null, hacker: null, broker: null, enforcer: null, fixer: null },
};

const GOLD = '#ffc93c';
const MAGENTA = '#ff2e88';
const CYAN = '#19e3ff';

function coverFit(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawPanel(ctx, box, img, label, W) {
  const { x, y, w, h } = box;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    coverFit(ctx, img, x, y, w, h);
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3b115e');
    g.addColorStop(1, '#12082a');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  // Neon wash so every photo shares the same sunset grade.
  const wash = ctx.createLinearGradient(x, y, x, y + h);
  wash.addColorStop(0, 'rgba(255,46,136,0.12)');
  wash.addColorStop(1, 'rgba(25,227,255,0.10)');
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // Gold frame.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, W * 0.003);
  ctx.strokeRect(x, y, w, h);

  // Callout chip with the crew name.
  const chipH = Math.max(22, h * 0.13);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y + h - chipH, w, chipH);
  ctx.fillStyle = '#160b2e';
  ctx.font = `${Math.round(chipH * 0.62)}px 'Bebas Neue', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h - chipH / 2 + 1);
}

export async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('700 40px Anton'),
      document.fonts.load('400 40px Pacifico'),
      document.fonts.load('400 40px "Bebas Neue"'),
    ]);
  } catch (_) {
    // Fall back to system fonts; the poster still draws.
  }
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 1080; // scale unit so the same layout works at any size

  // Sunset background.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a0a4d');
  bg.addColorStop(0.45, '#12082a');
  bg.addColorStop(1, '#0b0618');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header: title, script, stars.
  const headerH = H * 0.15;
  ctx.textAlign = 'center';
  ctx.fillStyle = MAGENTA;
  ctx.font = `${Math.round(64 * u)}px Anton, sans-serif`;
  ctx.shadowColor = 'rgba(255,46,136,0.8)';
  ctx.shadowBlur = 18 * u;
  ctx.fillText(state.title.toUpperCase(), W / 2, headerH * 0.52);
  ctx.shadowBlur = 0;
  ctx.fillStyle = CYAN;
  ctx.font = `${Math.round(30 * u)}px Pacifico, cursive`;
  ctx.fillText(state.script, W / 2, headerH * 0.88);
  ctx.fillStyle = GOLD;
  ctx.font = `${Math.round(22 * u)}px 'Bebas Neue', sans-serif`;
  ctx.fillText('★★★★★  PURE COASTAL ADRENALINE', W / 2, headerH * 0.16);

  // Panel area.
  const top = H * 0.17;
  const bottom = H * 0.88;
  const gap = 10 * u;
  const sideW = W * 0.30;
  const midX0 = W * 0.35;
  const midX1 = W * 0.65;
  const midH = (bottom - top - gap) / 2;
  const boxes = {
    hero: { x: midX0, y: top, w: midX1 - midX0, h: bottom - top },
    hacker: { x: W * 0.02, y: top, w: sideW, h: midH },
    broker: { x: W * 0.68, y: top, w: sideW, h: midH },
    enforcer: { x: W * 0.02, y: top + midH + gap, w: sideW, h: midH },
    fixer: { x: W * 0.68, y: top + midH + gap, w: sideW, h: midH },
  };
  for (const crew of CREWS) {
    drawPanel(ctx, boxes[crew.key], state.photos[crew.key], crew.name, W);
  }

  // Footer: tagline + ISSUE 04 seal.
  ctx.fillStyle = '#f5efff';
  ctx.font = `${Math.round(24 * u)}px 'Bebas Neue', sans-serif`;
  ctx.fillText(state.tagline.toUpperCase(), W / 2, H * 0.945);
  ctx.fillStyle = GOLD;
  ctx.font = `${Math.round(20 * u)}px Anton, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('ISSUE 04', W * 0.98, H * 0.945);
  ctx.textAlign = 'center';
}
