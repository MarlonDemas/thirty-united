// matchday-rsvp: tiny three-free registry. The game registers what must stop when the scene is abandoned (context lost, load failure);
// fallback.js runs it once before it swaps in the plain form. This file only holds functions, never guest data.
const hooks = [], salvagers = [];
export const onTeardown = (fn) => { hooks.push(fn); };
export function runTeardown() { for (const fn of hooks.splice(0).reverse()) { try { fn(); } catch (e) { console.warn('[matchday] teardown step failed', e); } } }
// The game registers a reader for the answers given so far; salvage() asks for them (read it BEFORE showFallback runs the teardown) so a context loss does not drop them.
export const onSalvage = (fn) => { salvagers.push(fn); };
export function salvage() { for (const fn of salvagers) { try { const a = fn(); if (a) return a; } catch (e) { console.warn('[matchday] salvage step failed', e); } } return null; }
