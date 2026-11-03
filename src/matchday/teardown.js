// matchday-rsvp: tiny three-free registry. The game registers what must stop when the scene is abandoned (context lost, load failure);
// fallback.js runs it once before it swaps in the plain form. Nothing here carries guest data.
const hooks = [];
export const onTeardown = (fn) => { hooks.push(fn); };
export function runTeardown() { for (const fn of hooks.splice(0).reverse()) { try { fn(); } catch (e) { console.warn('[matchday] teardown step failed', e); } } }
