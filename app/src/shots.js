// Screenshot scenes for Neon Tide: `?shot=cover` shows the exported cover
// full-bleed (the editor chrome hidden), `?shot=editor` shows the editor
// with all five sample photos loaded. Either way the scene ends by setting
// window.__shotReady, which the screenshot script waits for.
import { SIZES } from './cover.js';

export async function runShot(shot, params, state, hooks) {
  const sizeKey = params.get('size') || 'landscape';
  if (SIZES[sizeKey]) state.sizeKey = sizeKey;
  hooks.redraw();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
  }
  // Let the canvas paint and the fonts settle before the shot is taken.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
