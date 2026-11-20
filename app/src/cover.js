// NEON TIDE poster renderer: draws the five-crew GTA-style poster onto
// a canvas. The layout is a tall hero panel in the middle (The Getaway),
// the other four crews in the corners (Hacker and Broker on top, Enforcer
// and Fixer below), the title, script line and five stars across the top,
// and the tagline plus the ISSUE 04 seal at the foot. Each photo is drawn
// cover-fit inside a gold frame; a panel with no photo yet gets a neon
// gradient placeholder carrying the crew name.

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

// Draw an image so it fills the box, cropping the overflow (cover fit).
function coverFit(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// One framed panel: the photo (or a gradient placeholder), a neon wash
// so every photo shares the same sunset grade, a gold frame, and a
// callout chip with the crew name along the bottom.
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
  const wash = ctx.createLinearGradient(x, y, x, y + h);
  wash.addColorStop(0, 'rgba(255,46,136,0.12)');
  wash.addColorStop(1, 'rgba(25,227,255,0.10)');
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, W * 0.003);
  ctx.strokeRect(x, y, w, h);

  // Callout chip with the crew name, shrunk to fit the panel width so a
  // long name (THE GETAWAY on the narrow hero panel) never overflows.
  const chipH = Math.max(22, h * 0.13);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y + h - chipH, w, chipH);
  ctx.fillStyle = '#160b2e';
  let chipFont = Math.round(chipH * 0.62);
  ctx.font = `${chipFont}px 'Bebas Neue', sans-serif`;
  const maxLabelW = w - 8;
  while (chipFont > 10 && ctx.measureText(label).width > maxLabelW) {
    chipFont -= 1;
    ctx.font = `${chipFont}px 'Bebas Neue', sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h - chipH / 2 + 1);
}

// Load the three poster fonts so the canvas can use them; if they fail,
// the poster still draws with system fonts.
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
  const u = W / 1080; // scale unit: the same layout works at any export size

  // Sunset background, deep purple fading down to near-black.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a0a4d');
  bg.addColorStop(0.45, '#12082a');
  bg.addColorStop(1, '#0b0618');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header: five stars, title, script line.
  const headerH = H * 0.15;
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = `${Math.round(22 * u)}px 'Bebas Neue', sans-serif`;
  ctx.fillText('★★★★★  PURE COASTAL ADRENALINE', W / 2, headerH * 0.16);
  ctx.fillStyle = MAGENTA;
  ctx.font = `${Math.round(64 * u)}px Anton, sans-serif`;
  ctx.shadowColor = 'rgba(255,46,136,0.8)';
  ctx.shadowBlur = 18 * u;
  ctx.fillText(state.title.toUpperCase(), W / 2, headerH * 0.52);
  ctx.shadowBlur = 0;
  ctx.fillStyle = CYAN;
  ctx.font = `${Math.round(30 * u)}px Pacifico, cursive`;
  ctx.fillText(state.script, W / 2, headerH * 0.88);

  // Panel grid: hero tall in the centre, four crews at the corners.
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

  // Footer: tagline centred, ISSUE 04 seal at the right.
  ctx.fillStyle = '#f5efff';
  ctx.font = `${Math.round(24 * u)}px 'Bebas Neue', sans-serif`;
  ctx.fillText(state.tagline.toUpperCase(), W / 2, H * 0.945);
  ctx.fillStyle = GOLD;
  ctx.font = `${Math.round(20 * u)}px Anton, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('ISSUE 04', W * 0.98, H * 0.945);
  ctx.textAlign = 'center';
}
