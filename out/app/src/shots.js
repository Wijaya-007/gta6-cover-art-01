// Fixed scenes for screenshots: ?shot=cover shows the cover alone (the app's
// own drawing at the chosen export size), ?shot=editor shows the editor with
// the five sample photos loaded. Query params: size (landscape, portrait,
// square), grade, title, subtitle, tagline, quote. window.__shotReady is set
// once the scene has painted, so a screenshot tool knows when to capture.
import { SIZES } from './cover.js';

export async function runShot(shot, query, state, app) {
  const sizeKey = query.get('size') || 'landscape';
  if (state && sizeKey in SIZES) state.sizeKey = sizeKey;
  if (state) {
    const set = (key, param) => {
      const v = query.get(param);
      if (v !== null) state[key] = v;
    };
    set('title', 'title');
    set('subtitle', 'subtitle');
    set('tagline', 'tagline');
    set('quote', 'quote');
    set('grade', 'grade');
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  // Make sure every panel has its sample photo before the first paint.
  if (state) {
    const samples = { hero: 'hero.jpg', insider: 'insider.jpg', boss: 'pier.jpg', rider: 'rider.jpg', courier: 'courier.jpg' };
    for (const p of state.panels) {
      if (!p.photo) {
        try { p.photo = await app.loadImage(`samples/${samples[p.id]}`); } catch { /* leave empty */ }
      }
    }
  }
  app.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
