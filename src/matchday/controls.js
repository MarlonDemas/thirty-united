// Look-around controller: the camera stays where it is; drag to look (360 deg yaw, pitch clamped).
import * as THREE from 'three';

export function createLookControls(camera, dom, { pitchLimit = 80 * Math.PI / 180, sensitivity = 0.0035 } = {}) {
  const c = { yaw: 0, pitch: 0, sway: { yaw: 0, pitch: 0, roll: 0 }, enabled: true, dragging: false, onChange: null, filter: null };   // filter(ev) -> false lets another handler (ticket / ball drag) own this pointerdown
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
  dom.addEventListener('pointerdown', (ev) => { if (!c.enabled || ev.button > 0 || (c.filter && c.filter(ev) === false)) return; c.dragging = true; lx = ev.clientX; ly = ev.clientY; dom.setPointerCapture(ev.pointerId); dom.style.cursor = 'grabbing'; });
  dom.addEventListener('pointermove', (ev) => {
    if (!c.dragging) return;
    c.yaw += (ev.clientX - lx) * sensitivity; c.pitch = THREE.MathUtils.clamp(c.pitch + (ev.clientY - ly) * sensitivity, -pitchLimit, pitchLimit);
    lx = ev.clientX; ly = ev.clientY; c.apply(); c.onChange?.();
  });
  const end = (ev) => { c.dragging = false; dom.style.cursor = 'grab'; try { dom.releasePointerCapture(ev.pointerId); } catch {} };
  dom.addEventListener('pointerup', end); dom.addEventListener('pointercancel', end);
  return c;
}
