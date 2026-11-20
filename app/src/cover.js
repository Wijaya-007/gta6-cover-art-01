// NEON TIDE cover renderer: draws the five-crew poster on a canvas.
// One big center panel (the hero crew) and four smaller crew panels around
// it, bold Anton title, Pacifico script line, five stars, and the tagline.
// All drawing is local and offline; photos come from the user's machine or
// the app's own sample crops under app/samples/.

export const CREWS = [
  { key: 'hero', label: 'THE GETAWAY', file: 'neon-hero.jpg' },
  { key: 'hacker', label: 'THE HACKER', file: 'neon-hacker.jpg' },
  { key: 'broker', label: 'THE BROKER', file: 'neon-broker.jpg' },
  { key: 'enforcer', label: 'THE ENFORCER', file: 'neon-enforcer.jpg' },
  { key: 'fixer', label: 'THE FIXER', file: 'neon-fixer.jpg' },
];

const GOLD = '#ffd23e';
const PINK = '#ff2e88';
const CREAM = '#fff6e0';

// Draw an image cover-fitting a rectangle (center crop, no distortion).
function drawCoverImage(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function neonText(ctx, text, x, y, font, fill, glow) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = glow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function panel(ctx, img, x, y, w, h, label) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) drawCoverImage(ctx, img, x, y, w, h);
  else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3d1d63');
    g.addColorStop(1, '#12041f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  // Sunset wash over the photo, stronger at the bottom.
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, 'rgba(255,46,136,0.05)');
  wash.addColorStop(1, 'rgba(255,122,26,0.28)');
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Gold frame.
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(3, w * 0.012);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
  // Callout chip.
  const chipH = Math.max(26, h * 0.09);
  const chipW = Math.min(w * 0.92, label.length * chipH * 0.62 + chipH * 0.9);
  const cx = x + (w - chipW) / 2;
  const cy = y + h - chipH - Math.max(8, h * 0.03);
  ctx.save();
  ctx.fillStyle = 'rgba(11,6,24,0.88)';
  ctx.fillRect(cx, cy, chipW, chipH);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx, cy, chipW, chipH);
  ctx.font = `${Math.round(chipH * 0.52)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = GOLD;
  ctx.fillText(label, cx + chipW / 2, cy + chipH / 2 + 1);
  ctx.restore();
}

function drawStars(ctx, cx, y, size) {
  ctx.save();
  ctx.fillStyle = GOLD;
  ctx.shadowColor = PINK;
  ctx.shadowBlur = 12;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2605\u2605\u2605\u2605\u2605', cx, y);
  ctx.restore();
}

// Draw the poster. `images` maps crew key -> HTMLImageElement (or null).
// `heroCrew` is the crew shown in the big center panel.
export function drawCover(canvas, images, opts) {
  const { title, script, tagline, heroCrew } = opts;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 1080; // layout unit, 1 at square width

  // Vice City sunset: deep violet sky to hot magenta to amber horizon.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1a0b2e');
  sky.addColorStop(0.42, '#4a1155');
  sky.addColorStop(0.68, '#a01e63');
  sky.addColorStop(0.86, '#ff5e3a');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Sun glow behind the title.
  const sun = ctx.createRadialGradient(W / 2, H * 0.16, 10, W / 2, H * 0.16, W * 0.42);
  sun.addColorStop(0, 'rgba(255,210,62,0.55)');
  sun.addColorStop(1, 'rgba(255,210,62,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H * 0.5);

  // Title + script.
  neonText(ctx, title, W / 2, H * 0.085, `${Math.round(118 * u)}px Anton, sans-serif`, CREAM, PINK);
  ctx.save();
  ctx.font = `${Math.round(44 * u)}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff7ab8';
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 10;
  ctx.fillText(script, W / 2, H * 0.155);
  ctx.restore();

  // ISSUE 04 badge, top right.
  const badgeR = Math.round(52 * u);
  const bx = W - badgeR - Math.round(26 * u);
  const by = Math.round(26 * u) + badgeR;
  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0b0618';
  ctx.stroke();
  ctx.fillStyle = '#0b0618';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(26 * u)}px Anton, sans-serif`;
  ctx.fillText('ISSUE', bx, by - Math.round(16 * u));
  ctx.font = `${Math.round(34 * u)}px Anton, sans-serif`;
  ctx.fillText('04', bx, by + Math.round(16 * u));
  ctx.restore();

  // Panel grid: hero big in the center, four crews around it.
  const margin = Math.round(28 * u);
  const gap = Math.round(14 * u);
  const top = H * 0.21;
  const bottom = H * 0.82;
  const ph = bottom - top;
  const heroW = W * 0.42;
  const sideW = (W - margin * 2 - heroW - gap * 2) / 2;
  const heroX = margin + sideW + gap;
  const rowH = (ph - gap) / 2;
  const order = CREWS.filter((c) => c.key !== heroCrew);
  const hero = CREWS.find((c) => c.key === heroCrew) || CREWS[0];
  const [tl, tr, bl, br] = order;
  panel(ctx, images[hero.key], heroX, top, heroW, ph, hero.label);
  panel(ctx, images[tl.key], margin, top, sideW, rowH, tl.label);
  panel(ctx, images[tr.key], W - margin - sideW, top, sideW, rowH, tr.label);
  panel(ctx, images[bl.key], margin, top + rowH + gap, sideW, rowH, bl.label);
  panel(ctx, images[br.key], W - margin - sideW, top + rowH + gap, sideW, rowH, br.label);

  // Stars + adrenaline line.
  drawStars(ctx, W / 2, H * 0.855, Math.round(34 * u));
  ctx.save();
  ctx.font = `${Math.round(30 * u)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM;
  ctx.fillText('PURE COASTAL ADRENALINE', W / 2, H * 0.895);
  ctx.restore();

  // Tagline bar at the bottom.
  const barH = H * 0.055;
  ctx.fillStyle = 'rgba(11,6,24,0.92)';
  ctx.fillRect(0, H - barH, W, barH);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, H - barH, W, 3);
  ctx.save();
  ctx.font = `${Math.round(30 * u)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM;
  ctx.fillText(tagline, W / 2, H - barH / 2 + 2);
  ctx.restore();
}
