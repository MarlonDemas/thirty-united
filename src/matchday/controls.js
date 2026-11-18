// Look-around controller: the camera stays where it is; drag to look (360 deg yaw, pitch clamped).
import * as THREE from 'three';

// A touch that moves less than slop px and ends within ms is a tap (roam.js walks there); the stick's dead zone is the same slop.
export const TAP = { slop: 12, ms: 350 };
export const STICK_R = 56;   // px: the floating stick's reach (roam.js)

export function createLookControls(camera, dom, { pitchLimit = 80 * Math.PI / 180, sensitivity = 0.0035 } = {}) {
  const c = { yaw: 0, pitch: 0, sway: { yaw: 0, pitch: 0, roll: 0 }, enabled: true, dragging: false, onChange: null, claim: null, filter: null };   // filter(ev) -> false lets another handler (ticket / ball drag) own this pointerdown
  const e = new THREE.Euler(0, 0, 0, 'YXZ');
  let lx = 0, ly = 0;
  // sway: the handheld micro-sway while walking (roam.js), small offsets on top of the look; yaw/pitch stay the clean look
  c.apply = () => { e.set(c.pitch + c.sway.pitch, c.yaw + c.sway.yaw, c.sway.roll, 'YXZ'); camera.quaternion.setFromEuler(e); };
  // face a world point (sets yaw/pitch from the camera's current position)
  c.lookAt = (target) => {
    const d = new THREE.Vector3().subVectors(target, camera.position).normalize();
    c.yaw = Math.atan2(-d.x, -d.z); c.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)); c.apply();
  };
  dom.style.touchAction = 'none'; dom.style.cursor = 'grab';
  // one look pointer at a time (a second finger never steals or ends it). A touch only becomes a look once it leaves the tap slop, so a wobbly tap neither swings the view nor reads as a drag.
  let id = null, sx = 0, sy = 0, slopped = true;
  dom.addEventListener('pointerdown', (ev) => {
    if (!c.enabled || ev.button > 0 || id !== null || (c.filter && c.filter(ev) === false) || c.claim?.(ev)) return;   // claim(ev) -> true: roam.js's floating stick owns this touch
    id = ev.pointerId; sx = lx = ev.clientX; sy = ly = ev.clientY; slopped = ev.pointerType !== 'touch'; c.dragging = slopped;
    try { dom.setPointerCapture(ev.pointerId); } catch {}
    dom.style.cursor = 'grabbing';
  });
  dom.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== id || !c.enabled) return;
    if (!c.dragging) { if (slopped || Math.hypot(ev.clientX - sx, ev.clientY - sy) < TAP.slop) return; slopped = true; c.dragging = true; }
    c.yaw += (ev.clientX - lx) * sensitivity; c.pitch = THREE.MathUtils.clamp(c.pitch + (ev.clientY - ly) * sensitivity, -pitchLimit, pitchLimit);
    lx = ev.clientX; ly = ev.clientY; c.apply(); c.onChange?.();
  });
  const end = (ev) => { if (ev.pointerId !== id) return; id = null; c.dragging = false; dom.style.cursor = 'grab'; try { dom.releasePointerCapture(ev.pointerId); } catch {} };
  dom.addEventListener('pointerup', end); dom.addEventListener('pointercancel', end);
  return c;
}
