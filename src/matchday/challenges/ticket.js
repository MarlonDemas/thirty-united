// matchday-rsvp: station 1's challenge, the ticket hand-in at the chosen END's turnstile (same contract as challenges/penalty.js).
// The 3D invitation ticket floats in front of the camera. Drag it onto that lane's reader, click it, or press Enter/Space (not on a control) to hand it in.
// Never blocking: a drop that misses the reader floats the ticket back, and after one miss the next release anywhere hands it in.
// float() is the intro: the same ticket hovering high in the frame on the plaza, as the invitation, before a side is chosen.
import * as THREE from 'three';
import { buildTicket } from '../ticket.js';
import { smoother, lerp, easeOut, anglesFor, reducedMotion } from '../util.js';

export const PACE = { handFly: 0.9, ticketReturn: 0.35, prepare: 1.6 };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function createTicketChallenge(world, { tl, hud, roam, audio, signal, seed }) {
  const { camera, controls: ctl, renderer, scene } = world;
  const dom = renderer.domElement;
  const ticket = buildTicket(seed); scene.add(ticket.group, ticket.key);
  ticket.group.visible = false;
  const home = V3(), baseQ = new THREE.Quaternion(), wob = new THREE.Quaternion(), e = new THREE.Euler();
  let mode = 'hidden', lane = null, drag = null, fails = 0, onResult = null, onSkip = null, lift = 0.32;

  // In front of the live camera: 2.7 m on landscape, further back on portrait so the sheet keeps about 62% of the width. lift = metres up per 2.7 m.
  // Third person: never past the guest's avatar (0.9 m short of the boom); closer than wanted, it is scaled down by the same factor, so it looks the same.
  function place() {
    const fwd = V3(0, 0, -1).applyQuaternion(camera.quaternion), up = V3(0, 1, 0).applyQuaternion(camera.quaternion);
    const aspect = innerWidth / innerHeight, tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), want = Math.max(2.7, ticket.W / (0.62 * 2 * tanH * aspect));
    const d = Math.min(want, Math.max(1.2, roam.boom().len - 0.9));
    home.copy(camera.position).addScaledVector(fwd, d).addScaledVector(up, mode === 'float' ? 0.44 * d * tanH : lift * d / 2.7);
    baseQ.copy(camera.quaternion); ticket.group.quaternion.copy(baseQ); ticket.group.position.copy(home); ticket.group.scale.setScalar(d / want);
  }
  const slotPos = () => { const v = V3(); lane.readerLight.getWorldPosition(v); return v.add(V3(0, 0.03, 0)); };
  const toScreen = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight }; };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), tmp = V3();
  const setRay = (ev) => { ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, camera); return ray; };
  const hitTicket = (ev) => mode === 'challenge' && ticket.group.visible && setRay(ev).intersectObject(ticket.group, true).length > 0;

  dom.addEventListener('pointermove', (ev) => {
    if (drag && drag.id === ev.pointerId) {
      if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 6) drag.moved = true;
      setRay(ev); if (ray.ray.intersectPlane(plane, tmp)) ticket.group.position.copy(tmp).add(drag.off);
    } else if (!drag && !ctl.dragging && mode === 'challenge') dom.style.cursor = hitTicket(ev) ? 'pointer' : 'grab';
  }, { signal });
  const endDrag = (ev) => {
    if (!drag || drag.id !== ev.pointerId) return;
    const d = drag; drag = null; dom.style.cursor = 'grab'; try { dom.releasePointerCapture(ev.pointerId); } catch {}
    if (mode !== 'challenge') return;
    const a = toScreen(ticket.group.position), b = toScreen(slotPos()), d1 = Math.hypot(a.x - b.x, a.y - b.y);
    if (!d.moved || d1 < d.d0 * 0.55 || d1 < 90 || fails >= 1) { handIn(); return; }   // after one miss, the next release anywhere hands it in
    fails++; hud.toast('Almost. Drop it on the reader', 1.8);
    const from = ticket.group.position.clone(); tl.tween(PACE.ticketReturn, (u) => ticket.group.position.lerpVectors(from, home, easeOut(u)));
  };
  dom.addEventListener('pointerup', endDrag, { signal }); dom.addEventListener('pointercancel', endDrag, { signal });
  addEventListener('keydown', (ev) => {   // keyboard: Enter or Space hands the ticket in (on a control, the control wins)
    if (ev.defaultPrevented) return;   // the key that skipped the walk to the turnstile (flow.js) does not also hand the ticket in
    if (mode !== 'challenge' || ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey || !(ev.key === 'Enter' || ev.key === ' ') || ev.target.closest?.('button, input, a, textarea, select')) return;
    ev.preventDefault(); handIn();
  }, { signal });

  function handIn() {
    if (mode !== 'challenge') return false;
    audio.unlock(); mode = 'fly'; drag = null; hud.hideChip(); hud.say('Handing in your ticket');
    const from = ticket.group.position.clone(), to = slotPos(), fs = ticket.group.scale.x, q0 = ticket.group.quaternion.clone();
    const fly = tl.tween(PACE.handFly, (u) => {
      const k = smoother(u); ticket.group.position.lerpVectors(from, to, k); ticket.group.position.y += Math.sin(Math.PI * u) * 0.25;
      ticket.group.scale.setScalar(lerp(fs, 0.1, k)); ticket.group.quaternion.copy(q0).multiply(wob.setFromEuler(e.set(-0.9 * k, 0, 0)));
    }, () => { ticket.group.visible = false; mode = 'hidden'; const cb = onResult; onResult = null; onSkip = null; cb?.({ outcome: 'in', fails }); }, { skip: true });
    if (reducedMotion()) tl.finish(fly);
    return true;
  }

  const api = {
    id: 'ticket', label: 'Take the challenge', skipLabel: 'Skip the ticket', PACE, group: ticket.group,
    active: () => mode === 'challenge' || mode === 'fly',
    mode: () => mode,
    // intro: the invitation hovers high in the frame (the intro card sits under it)
    float() { mode = 'float'; ticket.group.visible = true; place(); },
    hide() { if (mode === 'float') { mode = 'hidden'; ticket.group.visible = false; } },
    setLane(l) { lane = l; },
    // walk into the lane and face its reader (a skippable 2-4 s camera move)
    prepare(station, ready) {
      lane = station.lane; const p = station.handIn, a = anglesFor(p.pos, p.target);
      roam.glide({ pts: [V3(...p.pos)], yaw: a.yaw, pitch: a.pitch, fov: 58, dur: PACE.prepare, done: ready, say: 'Walking to the turnstile' });
    },
    start({ onResult: cb, onSkip: sk }) {
      onResult = cb; onSkip = sk; fails = 0; mode = 'challenge'; lift = 0.32; ticket.group.visible = true; place();
      hud.chip('Drag your ticket into the reader, or tap it.', 'Skip', () => onSkip?.());
    },
    handIn,
    stop() { if (mode === 'challenge' || mode === 'fly') { mode = 'hidden'; ticket.group.visible = false; } drag = null; onResult = null; onSkip = null; },
    reset() { mode = 'hidden'; ticket.group.visible = false; drag = null; onResult = null; onSkip = null; fails = 0; },
    filter(ev) {
      if (!hitTicket(ev)) return true;
      setRay(ev); camera.getWorldDirection(tmp); plane.setFromNormalAndCoplanarPoint(tmp, ticket.group.position);
      const hit = ray.ray.intersectPlane(plane, V3()) || ticket.group.position.clone(), a = toScreen(ticket.group.position), b = toScreen(slotPos());
      drag = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, off: ticket.group.position.clone().sub(hit), moved: false, d0: Math.hypot(a.x - b.x, a.y - b.y) };
      dom.setPointerCapture(ev.pointerId); dom.style.cursor = 'grabbing'; return false;
    },
    // hover: a slow bob while it waits (not while dragged), follows the key light
    step(t) {
      ticket.follow();
      if ((mode === 'challenge' || mode === 'float') && ticket.group.visible && !drag && !reducedMotion()) {
        ticket.group.position.y = home.y + 0.03 * Math.sin(t * 1.6);
        ticket.group.quaternion.copy(baseQ).multiply(wob.setFromEuler(e.set(0, 0.03 * Math.sin(t * 0.8), 0.01 * Math.sin(t * 1.1 + 1))));
      }
    },
    replace() { if (mode === 'challenge' || mode === 'float') place(); },   // resize
    state: () => ({ mode, fails, lane: lane?.side ?? null }),
  };
  return api;
}
