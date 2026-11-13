// matchday-rsvp: entry point. Deliberately tiny and three-free: the scene lives in game.js and is loaded with a dynamic import, so if WebGL is missing,
// the three import fails, create() throws (e.g. the HDR 404s) or the GL context is lost for good, the guest still gets the plain fast-lane page (fallback.js).
import { showFallback } from './fallback.js';
import { createInvite } from './invite.js';
import { runTeardown, salvage } from './teardown.js';

window.__ready = false;
window.__fallback = false;
window.__start = false;

const hasWebGL2 = () => {
  try { const gl = document.createElement('canvas').getContext('webgl2'); if (!gl) return false; gl.getExtension('WEBGL_lose_context')?.loseContext(); return true; } catch { return false; }
};

// A lost context that is not restored within 3 s is final: swap the scene for the form.
let lostTimer = 0;
addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); clearTimeout(lostTimer); lostTimer = setTimeout(() => showFallback('context-lost', salvage()), 3000); }, true);
addEventListener('webglcontextrestored', () => clearTimeout(lostTimer), true);

// The start page comes first for every guest; nothing three-related is fetched until "Play the match" (the dynamic import below).
// __ready keeps its meaning (the game or the fallback page is up); __start flags that the invitation has rendered.
let starting = false;
// The guest pressed "Just reply" while game.js was still downloading (or the 20 s limit hit): the module has since built its HUD in #ui and a canvas. Stop it, drop all of it, and give focus back to the form.
let formFocus = null;
addEventListener('focusin', (ev) => { if (window.__fallback && ev.target.closest?.('#fb')) formFocus = ev.target; });
function discard() {
  runTeardown();
  document.querySelectorAll('canvas').forEach((c) => c.remove());
  document.querySelectorAll('#ui > :not(#fb)').forEach((n) => n.remove());
  const back = formFocus?.isConnected ? formFocus : document.getElementById('fb-h');
  if (!document.activeElement?.closest?.('#fb')) back?.focus({ preventScroll: true });
}
async function play() {
  if (starting || window.__fallback) return;
  starting = true; invite.setLoading(true);
  // A stalled network (an asset that never answers) rejects nothing, so the load also gets an overall limit; a scene that finishes after it must not draw over the form.
  const LOAD_LIMIT_MS = 20000;
  let limit = 0;
  const stalled = new Promise((_, rej) => { limit = setTimeout(() => rej(new Error('scene load timed out')), LOAD_LIMIT_MS); });
  try {
    if (!hasWebGL2()) throw new Error('WebGL2 is not available');
    await Promise.race([import('./game.js').then(() => { if (window.__fallback) discard(); else invite.el.remove(); }), stalled]);
  } catch (e) { console.warn('[matchday] scene failed to start, showing the fast-lane page:', e); showFallback('load-failed'); }
  clearTimeout(limit);
}
const invite = createInvite({ onPlay: play, onReply: () => showFallback('plain') });
document.getElementById('ui').append(invite.el);
document.getElementById('boot')?.remove();
window.__start = true;
