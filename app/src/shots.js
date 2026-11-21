// VICE HEAT — screenshot definitions (rebuild #10, Golden Mile formula).
// The four dossier screenshots: the WIDE hero-centre cover first (the main
// image reads like a game cover), then the editor, then the two alternate
// export sizes. The Playwright runner loads index.html with ?shot=<name>
// and captures the #poster canvas (or the whole editor for shot 2). Sizes
// keep the dossier caps: long side <= 1280, each file <= 256 KiB after
// JPEG quality tuning.

export const SHOTS = [
  {
    name: '1-cover',
    file: '1-cover.jpg',
    width: 1280,
    height: 720,
    query: 'shot=1-cover',
    caption: 'The VICE HEAT cover, wide: a large hero close-up in the centre with six tilted panels around it — four portraits and three action scenes (police, helicopter, speedboat) — under a huge striped chrome title.',
  },
  {
    name: '2-editor',
    file: '2-editor.jpg',
    width: 1280,
    height: 720,
    query: 'shot=2-editor',
    caption: 'The studio editor: upload a photo per panel, edit captions, pick a grade.',
  },
  {
    name: '3-cover-portrait',
    file: '3-cover-portrait.jpg',
    width: 1024,
    height: 1280,
    query: 'shot=3-cover-portrait',
    caption: 'Portrait 4:5 export with the Gold grade.',
  },
  {
    name: '4-cover-square',
    file: '4-cover-square.jpg',
    width: 1080,
    height: 1080,
    query: 'shot=4-cover-square',
    caption: 'Square 1:1 export with the Neon grade.',
  },
];

// The shot for a query string, or null for the plain editor.
export function shotForQuery(search) {
  const params = new URLSearchParams(search);
  const name = params.get('shot');
  if (!name) return null;
  return SHOTS.find((s) => s.name === name) || null;
}

// Viewport the runner should use for a shot: the canvas size, clamped so
// the long side never exceeds 1280 (the dossier's screenshot rule).
export function viewportForShot(shot) {
  const scale = Math.min(1, 1280 / Math.max(shot.width, shot.height));
  return {
    width: Math.round(shot.width * scale),
    height: Math.round(shot.height * scale),
  };
}
