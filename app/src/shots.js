// Shot presets for screenshots: ?shot=cover | editor | story
// Applied by main.js before first render; sets window.__shotReady when done.
export const SHOTS = {
  cover: {
    layout: 'nine', grade: 'sunset', title: 'VICE COAST', subtitle: 'sunset over the city',
    demo: true, coverOnly: true, size: [1280, 720],
  },
  editor: {
    layout: 'hero3', grade: 'neon', title: 'NEON NIGHTS', subtitle: 'the city never sleeps',
    demo: true, coverOnly: false, size: [1280, 800],
  },
  story: {
    layout: 'stack', grade: 'vice', title: 'VICE COAST', subtitle: 'golden hour escape',
    demo: true, coverOnly: true, size: [720, 1280],
  },
};

export function shotFromUrl(url) {
  const name = new URL(url, 'http://localhost').searchParams.get('shot');
  return name && SHOTS[name] ? { name, ...SHOTS[name] } : null;
}
