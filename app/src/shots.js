// NEON TIDE shot helper: the four screenshot presets the app can render
// from a URL query, and the ready flag the screenshot script waits for.
// A shot is `?shot=<name>&photo=<sample>&caption=<title>`; main.js applies
// the photo and caption, then calls markReady() once the poster is drawn.

export const SHOT_PRESETS = [
  { name: '1-cover.jpg', photo: 'neon-hero', caption: 'NEON TIDE', size: '1080x1080' },
  { name: '2-editor.jpg', photo: 'neon-broker', caption: 'Harbor Nights', size: '1280x720' },
  { name: '3-cover-portrait.jpg', photo: 'neon-enforcer', caption: 'Midnight Run', size: '1080x1350' },
  { name: '4-cover-square.jpg', photo: 'neon-fixer', caption: 'Vice After Dark', size: '1080x1080' },
];

export function markReady() {
  window.__neonTideReady = true;
  window.__shotReady = true;
  document.documentElement.setAttribute('data-neon-ready', '1');
}

export function isReady() {
  return window.__neonTideReady === true;
}
