// Fixed scenes for screenshots: ?shot=editor shows the editor with the demo
// photos loaded; ?shot=cover hides the controls and shows one exported cover
// full-frame, drawn by the app itself at the cover's own size.
// Query keys: layout, grade, size, title, subtitle, photo.
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await load({
    layout: query.get('layout') || undefined,
    grade: query.get('grade') || undefined,
    size: query.get('size') || undefined,
    title: query.get('title') || undefined,
    subtitle: query.get('subtitle') ?? undefined,
    photo: query.get('photo') || undefined,
  });
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
