// GOLDEN TIDE screenshots: the four dossier shots and how each is made.
// 1-cover is the wide hero-centre cover (the judge's first view, largest).
// 2-editor is the live editor with a photo loaded. 3 and 4 are the other
// export sizes. Every shot fits the dossier caps (long side <= 1280,
// short side >= 480, each file <= 256 KiB).
import { renderCoverCanvas } from './cover.js';

export const SHOTS = [
  { id: '1-cover', file: '1-cover.jpg', kind: 'cover', sizeId: 'wide', grade: 'sunset', w: 1280, h: 720, label: 'Cover — Wide 16:9' },
  { id: '2-editor', file: '2-editor.jpg', kind: 'editor', w: 1280, h: 720, label: 'Editor with a photo loaded' },
  { id: '3-cover-portrait', file: '3-cover-portrait.jpg', kind: 'cover', sizeId: 'portrait', grade: 'gold', w: 1024, h: 1280, label: 'Cover — Portrait 4:5' },
  { id: '4-cover-square', file: '4-cover-square.jpg', kind: 'cover', sizeId: 'square', grade: 'neon', w: 1080, h: 1080, label: 'Cover — Square 1:1' },
];

/** Renders a cover shot to a canvas at its dossier size. */
export function renderShotCanvas(shot, images, state) {
  const canvas = renderCoverCanvas(shot.w, shot.h, images, {
    ...state,
    grade: shot.grade,
    sizeId: shot.sizeId,
  });
  return canvas;
}
