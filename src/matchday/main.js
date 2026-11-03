// matchday-rsvp: entry point. Deliberately tiny and three-free: the scene lives in game.js and is loaded with a dynamic import, so if WebGL is missing,
// the three import fails, create() throws (e.g. the HDR 404s) or the GL context is lost for good, the guest still gets the plain fast-lane page (fallback.js).
import { showFallback } from './fallback.js';
import { runTeardown, salvage } from './teardown.js';

window.__ready = false;
window.__fallback = false;

const hasWebGL2 = () => {
  try { const gl = document.createElement('canvas').getContext('webgl2'); if (!gl) return false; gl.getExtension('WEBGL_lose_context')?.loseContext(); return true; } catch { return false; }
};

// A lost context that is not restored within 3 s is final: swap the scene for the form.
let lostTimer = 0;
addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); clearTimeout(lostTimer); lostTimer = setTimeout(() => showFallback('context-lost', salvage()), 3000); }, true);
addEventListener('webglcontextrestored', () => clearTimeout(lostTimer), true);

if (!hasWebGL2()) showFallback('no-webgl');
else {
  // A stalled network (an asset that never answers) rejects nothing, so the load also gets an overall limit; a scene that finishes after it must not draw over the form.
  const LOAD_LIMIT_MS = 20000;
  let limit = 0;
  const stalled = new Promise((_, rej) => { limit = setTimeout(() => rej(new Error('scene load timed out')), LOAD_LIMIT_MS); });
  try {
    await Promise.race([import('./game.js').then(() => { if (window.__fallback) runTeardown(); }), stalled]);
  } catch (e) { console.warn('[matchday] scene failed to start, showing the fast-lane page:', e); showFallback('load-failed'); }
  clearTimeout(limit);
}
