// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone. `photo` picks the sample
// (samples/<photo>.jpg) and `caption` the title. window.__shotReady is set
// once the cover has painted, so the screenshot script knows it is done.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'neon-hero';
  const caption = query.get('caption') ?? 'NEON TIDE';
  await load(`samples/${photo}.jpg`, caption);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
