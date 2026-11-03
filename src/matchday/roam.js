// matchday-rsvp: the third-person rig (open-roam). P is the guest's FEET; their footballer (avatar.js) stands there and the camera rides a follow boom
// behind and over the right shoulder, along the look (ctl.yaw / ctl.pitch; forward = (-sin yaw, -cos yaw)). Callers still say "the guest at (x, EYE, z)
// looking at the target" (anglesFor / lookFrom): the boom keeps that look and pulls the camera back from the avatar's shoulder.
// Desktop: W/S or Up/Down walk along the camera, A/D strafe, Left/Right turn, Shift runs, drag orbits (controls.js); the avatar faces where it moves.
// Phones (and any pointer): a tap (< 8 px, < 250 ms) on the ground walks there; a tap on a station walks to it. Cinematic camera moves (glide) live here too,
// because they own the same camera. Everything moves on the sim clock: step(dt) is called from the sim step, so window.__dbg.simStep(dt) stays deterministic.
//
// Boom: look point = (P.x, height, P.z) + shoulder metres to the camera's right; camera = look point - viewDir(yaw, pitch) * len. place() clamps the pitch so
// the camera never drops below CAM.minY, shortens the boom so the camera stays inside the enabled walkable zones inflated by CAM.pad (tunnel walls, the
// facade, the stands behind the boards: no raycast against the bowl), and keeps it under the indoor ceilings.
// API for the challenges (part B):
//   boom() -> { len, height, shoulder }; setBoom({ len?, height?, shoulder? }) changes it (until resetBoom()); boomCam(x, z, yaw, pitch) -> { x, y, z, pitch }
//   is where place() would put the camera for feet (x, z) and that look (the pitch comes back clamped). avatar = the guest's figure (avatar.js).
//   frameFor({ feet, pos, target }) -> { boom, yaw, pitch }: the boom and look that put the camera exactly at pos aiming at target with the feet at feet
//   (a challenge's staged framing); frame(view) applies it. hold(true) freezes the camera position (the look still turns: a ball track from a fixed camera).
//   setBoom / resetBoom / frame ease the camera over (the lag) unless reduced motion.
//   moveTo(x, z, { yaw, pitch }) sets the look BEFORE it places the camera; teleport(x, z, { yaw, pitch, look, fov }) also turns the avatar to the look.
//   glide({...}): pts are the AVATAR's ground path (default), free: true = a camera-only move (pts are camera points; the avatar stays), rig = cine.js.
import * as THREE from 'three';
import { lerp, lerpAngle, smoother, smooth01, clamp, anglesFor, reducedMotion, mulberry32 } from './util.js';

export const EYE = 1.7;                           // the guest's eye line: callers aim from (x, EYE, z)
const R = 0.35;                                   // the guest's footprint radius
// the roaming boom: 4.2 m back from a look point at chest height, 0.35 m right. Long and low enough that the feet sit at ~75% of the frame height on every
// aspect (the centred bottom 'Walk to next station' button starts at ~86-90%), with the head at ~40%
export const BOOM = { len: 4.2, height: 1.3, shoulder: 0.35 };
const CAM = { minY: 0.3, pad: 0.4, minLen: 0.9, ceiling: 2.5, lag: 6 };   // pad <= 0.4: the tunnel walls are 0.45 m outside its zone (stadium.js: x = +/-2.0)
export const SPEED = { walk: 4.2, run: 8.5, auto: 7.0, turn: 1.9 };   // m/s (a brisk walk / a jog), turn rad/s
export const ROAM_FOV = 58;                       // the roaming lens; after a challenge or an arrival's push-in the FOV settles back to it
// handheld micro-sway while walking: per axis two slow sines with seeded rates and phases (rad), on the sim clock, scaled by how fast the guest moves
const SWAY = (() => { const r = mulberry32(5150); const ax = (amp) => [amp, 0.55 + r() * 0.35, r() * 6.283, 1.1 + r() * 0.5, r() * 6.283]; return { yaw: ax(0.0042), pitch: ax(0.0032), roll: ax(0.0055) }; })();
const SWAY_K = 0.5;                               // third person: half the first-person handheld sway (the avatar's gait carries the motion)
const swayAt = ([amp, f1, p1, f2, p2], t) => amp * (0.7 * Math.sin(f1 * 6.283 * t + p1) + 0.3 * Math.sin(f2 * 6.283 * t + p2));

// Walkable zones: rectangles the guest's CENTRE may occupy [x0, x1, z0, z1], switched on as the journey opens them.
const ZONES = {
  plaza: [[-13.5, 13.5, 108.6, 147], [-6.6, 6.6, 103.75, 108.8]],            // forecourt + the gate passage up to the turnstiles
  laneHome: [[-1.8, -1.2, 102.2, 103.9]], laneAway: [[1.2, 1.8, 102.2, 103.9]],   // the gap through each END's open turnstile
  inside: [[-6.6, 6.6, 95.0, 102.3], [-14.5, 14.5, 84.4, 95.2], [-1.55, 1.55, 55, 84.6]],   // passage behind the gate, concourse hall, players' tunnel
};
// pitch + run-off: a rounded rectangle just inside the LED boards (D.bowl less 1.9 m); the stands beyond are blocked
const PITCH = { hx: 39.6, hz: 58.2, r: 10.1 };
const inPitch = (x, z, pad = 0) => {
  const ax = Math.abs(x), az = Math.abs(z), hx = PITCH.hx + pad, hz = PITCH.hz + pad;
  if (ax > hx || az > hz) return false;
  const cx = PITCH.hx - PITCH.r, cz = PITCH.hz - PITCH.r;
  return ax <= cx || az <= cz || Math.hypot(ax - cx, az - cz) <= PITCH.r + pad;
};
const inRects = (rects, x, z, pad) => rects.some(([x0, x1, z0, z1]) => x >= x0 - pad && x <= x1 + pad && z >= z0 - pad && z <= z1 + pad);
// Static obstacles: boxes [x0, x1, z0, z1] and circles [x, z, r], inflated by R when tested.
const BOXES = [
  [-0.12, 0.12, 102.4, 130.2], [-5.32, -5.08, 112.8, 130.2], [5.08, 5.32, 112.8, 130.2],   // lane divider + outer queue rails (plaza.js)
  [-12.2, -9.8, 87.4, 92.6], [9.8, 12.2, 87.4, 92.6],                                       // concourse kiosks (stadium.js)
  [-3.8, 3.8, -54.8, -52.38], [-3.8, 3.8, 52.38, 54.8],                                     // goals + nets
  [-38.7, -36.1, 4.9, 11.1], [-38.7, -36.1, -11.1, -4.9],                                   // dugouts (rotated: ~2.6 m along x, 6.2 m along z)
];
const CIRCLES = [[-10.6, 113.6, 0.2], [10.6, 113.6, 0.2], [34, 52.5, 0.12], [-34, 52.5, 0.12], [34, -52.5, 0.12], [-34, -52.5, 0.12]];

export function createRoam(world, { tl, signal, avatar = null, canMove = () => true, restFov = canMove, onTap, pickables = () => [], dynamic = () => [], onMove, say }) {
  const { camera, controls: ctl, renderer, sim } = world;
  const dom = renderer.domElement;
  const P = { x: 0, z: 136 };
  let zones = {}, extra = [], keys = new Set(), auto = null, cam = null, camCine = false, detached = false, moving = 0, held = false;
  const boom = { ...BOOM }, lag = new THREE.Vector3();   // lag: a camera catch-up offset that decays (after the avatar's offset is folded into P)
  const setZones = (z) => { zones = { plaza: true, laneHome: false, laneAway: false, inside: false, pitch: false, ...z }; };
  setZones({});

  const blocked = (x, z) => {
    for (const [x0, x1, z0, z1] of [...BOXES, ...extra]) if (x > x0 - R && x < x1 + R && z > z0 - R && z < z1 + R) return true;
    for (const [cx, cz, r] of [...CIRCLES, ...dynamic()]) if ((x - cx) ** 2 + (z - cz) ** 2 < (r + R) ** 2) return true;
    return false;
  };
  const inZone = (x, z) => {
    for (const [k, rects] of Object.entries(ZONES)) if (zones[k]) for (const [x0, x1, z0, z1] of rects) if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return true;
    return zones.pitch && inPitch(x, z);
  };
  const free = (x, z) => inZone(x, z) && !blocked(x, z);
  // the camera point may sit CAM.pad outside the enabled zones (never through a wall or into the stands); indoors it stays under the ceiling
  const camOk = (x, z) => {
    for (const [k, rects] of Object.entries(ZONES)) if (zones[k] && inRects(rects, x, z, CAM.pad)) return true;
    return zones.pitch && inPitch(x, z, CAM.pad);
  };
  const indoors = (x, z) => inRects(ZONES.inside, x, z, CAM.pad);
  // where the boom puts the camera for feet (px, pz) and the look (yaw, pitch); the pitch comes back clamped (camera.y >= CAM.minY)
  function boomCam(px, pz, yaw, pitch) {
    const sy = Math.sin(yaw), cy = Math.cos(yaw);
    pitch = Math.min(pitch, Math.asin(clamp((boom.height - CAM.minY) / boom.len, -1, 1)));
    const sp = Math.sin(pitch), cp = Math.cos(pitch), dx = -sy * cp, dy = sp, dz = -cy * cp;
    const lx = px + cy * boom.shoulder, ly = boom.height, lz = pz - sy * boom.shoulder;   // the look point: right of the head = (cos yaw, -sin yaw)
    let len = boom.len;
    if (dy < -1e-3) { const ceil = (CAM.ceiling - ly) / -dy; if (indoors(lx - dx * len, lz - dz * len)) len = Math.min(len, Math.max(CAM.minLen, ceil)); }
    while (len > CAM.minLen && !camOk(lx - dx * len, lz - dz * len)) len = Math.max(CAM.minLen, len - 0.1);
    return { x: lx - dx * len, y: Math.max(CAM.minY, ly - dy * len), z: lz - dz * len, pitch, len };
  }
  // fold the avatar's offset (a run-up or celebration that moved only the figure) into P; the camera eases over instead of jumping
  function foldOffset() {
    if (!avatar) return;
    const o = avatar.takeOffset(); if (!o.x && !o.z) return;
    const before = boomCam(P.x, P.z, ctl.yaw, ctl.pitch);
    P.x += o.x; P.z += o.z;
    const after = boomCam(P.x, P.z, ctl.yaw, ctl.pitch);
    if (!reducedMotion()) lag.add(new THREE.Vector3(before.x - after.x, before.y - after.y, before.z - after.z));
  }
  // move with sliding: the full step, else each axis on its own
  function moveBy(dx, dz) {
    const x0 = P.x, z0 = P.z;
    if (free(P.x + dx, P.z + dz)) { P.x += dx; P.z += dz; } else if (dx && free(P.x + dx, P.z)) P.x += dx; else if (dz && free(P.x, P.z + dz)) P.z += dz;
    return Math.hypot(P.x - x0, P.z - z0);
  }
  // the rig: the camera on the boom behind the avatar, plus the (halved) handheld sway while moving (none under reduced motion); re-applies the look every step
  const place = () => {
    const k = reducedMotion() ? 0 : smoother(moving) * (keys.has('Shift') ? 1.35 : 1) * SWAY_K, t = sim.t;
    if (!held) { const c = boomCam(P.x, P.z, ctl.yaw, ctl.pitch); ctl.pitch = c.pitch; camera.position.set(c.x + lag.x, c.y + lag.y, c.z + lag.z); }
    ctl.sway.yaw = swayAt(SWAY.yaw, t) * k; ctl.sway.pitch = swayAt(SWAY.pitch, t) * k; ctl.sway.roll = swayAt(SWAY.roll, t) * k; ctl.apply();
  };

  // ---- keys ---------------------------------------------------------------------------------------------------------------
  const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  const typing = (t) => !!t?.closest?.('input, textarea, select, [role=radio], [contenteditable]');
  addEventListener('keydown', (ev) => {
    if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') { keys.add('Shift'); return; }
    if (!MOVE.has(ev.code) || ev.ctrlKey || ev.metaKey || ev.altKey || typing(ev.target) || !canMove()) return;
    keys.add(ev.code); auto = null; ev.preventDefault();
  }, { signal });
  addEventListener('keyup', (ev) => { keys.delete(ev.code); if (ev.key === 'Shift') keys.delete('Shift'); }, { signal });
  addEventListener('blur', () => keys.clear(), { signal });

  // ---- tap to move ----------------------------------------------------------------------------------------------------------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  let down = null;
  // a pointerdown that skipped a camera move is preventDefault()ed by the flow's capture handler: it never also starts a walk
  dom.addEventListener('pointerdown', (ev) => { down = ev.button > 0 || ev.defaultPrevented ? null : { x: ev.clientX, y: ev.clientY, t: performance.now(), id: ev.pointerId }; }, { signal });
  dom.addEventListener('pointerup', (ev) => {
    const d = down; down = null;
    if (!d || d.id !== ev.pointerId || Math.hypot(ev.clientX - d.x, ev.clientY - d.y) >= 8 || performance.now() - d.t >= 250 || !canMove() || detached || cam) return;
    ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, camera);
    const picks = ray.intersectObjects(pickables(), true);
    if (picks.length) { let o = picks[0].object; while (o && !o.userData.station) o = o.parent; if (o) { onTap?.({ station: o.userData.station }); return; } }
    if (ray.ray.intersectPlane(ground, hit) && Math.hypot(hit.x - P.x, hit.z - P.z) < 140) { api.walkTo(hit.x, hit.z); onTap?.({ ground: [hit.x, hit.z] }); }
  }, { signal });

  // ---- cinematic camera moves -----------------------------------------------------------------------------------------------
  // Three kinds. Default: pts are the AVATAR's path (Vector3s, projected to the ground): the avatar walks it while the camera rides the boom, easing from
  // wherever it was onto the boom by the end. free: true: a camera-only move (pts are camera points from the current camera; the avatar stays put and P does
  // not change); the done handler usually detaches (the full-time crane, the AWAY pull). rig(u, start, boomCam) -> { x, y, z, yaw, pitch, fov, px, pz }
  // drives the camera and the avatar's feet itself (the walk-out). yaw/pitch: the end look. Look modes: tangent (along the path, easing into the end look),
  // look (a world point or a function returning one, kept in view while the path arcs: aimed from the avatar's eye line, or from the camera when free), or
  // a plain eased turn. cine: a cinematic move (letterbox). Every move eases in and out (smoother); the walking sway fades out over the first quarter.
  // Skippable unless skip: false; a cut under reduced motion.
  function glide({ pts = [], yaw, pitch, fov, dur, tangent = false, look = null, rig = null, free = false, cine = false, done, say: saying, skip = true }) {
    tl.cancel(cam); auto = null; keys.clear(); moving = 0; if (saying) say?.(saying);
    if (!free) foldOffset();
    const a = { pos: camera.position.clone(), yaw: ctl.yaw, pitch: ctl.pitch, fov: camera.fov, P: { x: P.x, z: P.z } }, sw = { ...ctl.sway };
    let curve = null;
    if (!rig && pts.length) {
      const path = free ? [a.pos, ...pts] : [new THREE.Vector3(P.x, 0, P.z), ...pts.map((p) => new THREE.Vector3(p.x, 0, p.z))];
      const len = path.reduce((s, p, i) => (i ? s + p.distanceTo(path[i - 1]) : 0), 0);
      if (len > 1e-3) curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
      else if (!free) { P.x = path.at(-1).x; P.z = path.at(-1).z; }
    }
    const lookAt = typeof look === 'function' ? look : look ? () => look : null, lv = new THREE.Vector3(), gp = new THREE.Vector3();
    // default mode: the camera starts where it is and settles onto the boom; d0 is that gap, faded out over the move
    const c0 = !free && !rig ? boomCam(P.x, P.z, a.yaw, a.pitch) : null, d0 = c0 ? new THREE.Vector3(a.pos.x - c0.x, a.pos.y - c0.y, a.pos.z - c0.z) : null;
    lag.set(0, 0, 0);
    ctl.enabled = false; ctl.dragging = false; camCine = cine;
    const eyeAt = () => (free ? camera.position.toArray() : [P.x, EYE, P.z]);
    const t = cam = tl.tween(dur, (u) => {
      const e = smoother(u); let y, p, f = fov ? lerp(a.fov, fov, e) : null;
      const fade = 1 - smoother(Math.min(1, u * 4)); ctl.sway.yaw = sw.yaw * fade; ctl.sway.pitch = sw.pitch * fade; ctl.sway.roll = sw.roll * fade;
      if (rig) {
        const r = rig(u, a, boomCam); camera.position.set(r.x, r.y, r.z); y = r.yaw; p = r.pitch; f = r.fov ?? f;
        if (r.px !== undefined) { P.x = r.px; P.z = r.pz; }
      } else {
        if (curve) { curve.getPointAt(e, gp); if (free) camera.position.copy(gp); else { P.x = gp.x; P.z = gp.z; } }
        if (curve && tangent) {
          const tg = curve.getTangentAt(e), ty = Math.atan2(-tg.x, -tg.z), w1 = smooth01(0, 0.12, e), w2 = smooth01(0.72, 1, e);
          y = lerpAngle(lerpAngle(a.yaw, ty, w1), yaw, w2); p = lerp(lerp(a.pitch, 0, w1), pitch, w2);
        } else if (lookAt) {
          const b = anglesFor(eyeAt(), lv.copy(lookAt(u)).toArray()), w1 = smoother(clamp(u / 0.3, 0, 1)), w2 = smooth01(0.75, 1, u);
          y = lerpAngle(lerpAngle(a.yaw, b.yaw, w1), yaw, w2); p = lerp(lerp(a.pitch, b.pitch, w1), pitch, w2);
        } else { y = lerpAngle(a.yaw, yaw, e); p = lerp(a.pitch, pitch, e); }
        if (!free) { const c = boomCam(P.x, P.z, y, p); p = c.pitch; camera.position.set(c.x + d0.x * (1 - e), c.y + d0.y * (1 - e), c.z + d0.z * (1 - e)); }
      }
      ctl.yaw = y; ctl.pitch = p; ctl.apply();
      if (f != null) { camera.fov = f; camera.updateProjectionMatrix(); }
    }, () => {
      if (cam === t) { cam = null; camCine = false; }
      if (!free) avatar?.face(ctl.yaw + Math.PI);   // the avatar turns (in place) to the end look (the walk-out too: it ends on the boom)
      ctl.enabled = true; done?.();
    }, { skip });
    if (reducedMotion()) tl.finish(t);   // reduced motion: camera moves are cuts
    return t;
  }

  // a boom change (or a reframe) eases over: the camera keeps where it was and the lag decays onto the new boom (not while a move or a hold owns the camera)
  function reboom(change, ease = true) {
    const live = !cam && !detached && !held, before = camera.position.clone();
    change();
    if (!live) return;
    lag.set(0, 0, 0); const c = boomCam(P.x, P.z, ctl.yaw, ctl.pitch);
    if (ease && !reducedMotion()) lag.set(before.x - c.x, before.y - c.y, before.z - c.z);
    place();
  }
  // solve the boom for a staged camera: the look point L = pos + dir * len sits at boom.height over the feet + shoulder * right (see boomCam)
  function frameFor({ feet, pos, target }) {
    const { yaw, pitch } = anglesFor(pos, target), sy = Math.sin(yaw), cy = Math.cos(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rx = pos[0] - feet[0], rz = pos[2] - feet[1], len = (rx * sy + rz * cy) / cp;   // forward = (-sin yaw, -cos yaw): the camera sits len * cos(pitch) behind
    return { boom: { len, height: pos[1] + sp * len, shoulder: rx * cy - rz * sy }, yaw, pitch };
  }
  const api = {
    EYE, pos: P, free, inZone, avatar,
    boom: () => ({ ...boom }),
    setBoom(o = {}) { reboom(() => { for (const k of ['len', 'height', 'shoulder']) if (typeof o[k] === 'number') boom[k] = o[k]; }); },
    resetBoom() { reboom(() => Object.assign(boom, BOOM)); },
    boomCam,
    hold(on = true) { held = !!on; if (!held && !cam && !detached) place(); },
    get held() { return held; },
    frameFor,
    // put the feet at view.feet and the camera exactly at view.pos aiming at view.target (eases over from wherever the camera was, unless reduced motion)
    frame(view, { ease = true } = {}) {
      const f = frameFor(view); held = false;
      reboom(() => { Object.assign(boom, f.boom); if (view.feet[0] !== P.x || view.feet[1] !== P.z) avatar?.takeOffset(); P.x = view.feet[0]; P.z = view.feet[1]; ctl.yaw = f.yaw; ctl.pitch = f.pitch; }, ease);
      return f;
    },
    get gliding() { return !!cam && tl.has(cam); },
    get cine() { return camCine && !!cam && tl.has(cam); },   // a cinematic move is live (the letterbox)
    get walking() { return !!auto; },
    get detached() { return detached; },
    setZones, zones: () => ({ ...zones }), setObstacles(boxes) { extra = boxes; },
    glide,
    // look angles toward a world point from the guest's eye line (x, EYE, z); the boom keeps this look
    lookFrom: (x, z, target) => anglesFor([x, EYE, z], target),
    teleport(x, z, { yaw, pitch, look, fov } = {}) {
      tl.cancel(cam); cam = null; camCine = false; auto = null; detached = false; held = false; P.x = x; P.z = z; moving = 0; lag.set(0, 0, 0); avatar?.clearOffset();
      if (look) ({ yaw, pitch } = anglesFor([x, EYE, z], look));
      if (yaw !== undefined) { ctl.yaw = yaw; ctl.pitch = pitch ?? 0; }
      avatar?.snap(ctl.yaw + Math.PI);   // the avatar faces the look (its forward (sin h, cos h) = the camera's (-sin yaw, -cos yaw))
      place();
      if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      ctl.enabled = true; ctl.dragging = false;
    },
    // free camera (the aerial capture view): the rig stops driving the camera until the next teleport
    detach() { detached = true; auto = null; tl.cancel(cam); cam = null; camCine = false; },
    // a challenge that moves the guest itself (the dribble) puts the rig here; the camera follows on this and every later step. yaw/pitch (optional) are
    // applied before the camera is placed, so the boom never lags the look by a frame. A real move drops any figure offset (the figure goes to P).
    moveTo(x, z, { yaw, pitch } = {}) {
      if (x !== P.x || z !== P.z) avatar?.takeOffset();
      P.x = x; P.z = z; moving = 0;
      if (yaw !== undefined) ctl.yaw = yaw; if (pitch !== undefined) ctl.pitch = pitch;
      place();
    },
    walkTo(x, z, { onArrive, speed = SPEED.auto, within = 0.15 } = {}) { auto = { x, z, onArrive, speed, within, stall: 0 }; },
    stop() { auto = null; keys.clear(); },
    releaseKeys() { keys.clear(); },
    step(dt) {
      if (detached || (cam && tl.has(cam))) return;
      let vx = 0, vz = 0, speed = 0;
      if (!canMove()) { auto = null; keys.clear(); }
      const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      const s = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0), turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
      if (turn) { ctl.yaw += turn * SPEED.turn * dt; ctl.apply(); }
      if ((f || s || auto) && avatar && (avatar.offset.x || avatar.offset.z)) foldOffset();
      if (f || s) {
        const sy = Math.sin(ctl.yaw), cy = Math.cos(ctl.yaw), l = Math.hypot(f, s);
        speed = keys.has('Shift') ? SPEED.run : SPEED.walk;
        vx = ((-sy) * f + cy * s) / l; vz = ((-cy) * f + (-sy) * s) / l;
      } else if (auto) {
        const dx = auto.x - P.x, dz = auto.z - P.z, d = Math.hypot(dx, dz);
        if (d <= auto.within) { const a = auto; auto = null; moving = 0; place(); a.onArrive?.(); return; }
        speed = Math.min(auto.speed, d / Math.max(dt, 1e-3)); vx = dx / d; vz = dz / d;
        const ty = Math.atan2(-vx, -vz); ctl.yaw = lerpAngle(ctl.yaw, ty, 1 - Math.exp(-7 * dt)); ctl.pitch = lerp(ctl.pitch, -0.06, 1 - Math.exp(-4 * dt)); ctl.apply();
      }
      if (speed > 0) {
        const moved = moveBy(vx * speed * dt, vz * speed * dt);
        moving = Math.min(1, moving + dt * 4);
        if (auto) { auto.stall = moved < speed * dt * 0.2 ? auto.stall + dt : 0; if (auto.stall > 0.6) { const a = auto; auto = null; a.onArrive?.({ stuck: true }); } }
        if (moved > 0) onMove?.(moved);
      } else moving = Math.max(0, moving - dt * 4);
      // the lens settles back to the roaming FOV (critically damped) once a challenge or a card no longer holds it
      if (restFov() && Math.abs(camera.fov - ROAM_FOV) > 0.01) { camera.fov += (ROAM_FOV - camera.fov) * (1 - Math.exp(-2.2 * dt)); camera.updateProjectionMatrix(); }
      if (lag.lengthSq() > 1e-8) lag.multiplyScalar(Math.exp(-CAM.lag * dt)); else lag.set(0, 0, 0);
      place();
    },
    state: () => ({ x: +P.x.toFixed(3), z: +P.z.toFixed(3), yaw: +ctl.yaw.toFixed(4), pitch: +ctl.pitch.toFixed(4), walking: !!auto, gliding: !!cam && tl.has(cam), detached, held, zones: { ...zones }, boom: { ...boom } }),
    reset() { tl.cancel(cam); cam = null; camCine = false; auto = null; keys.clear(); detached = false; held = false; moving = 0; lag.set(0, 0, 0); Object.assign(boom, BOOM); setZones({}); avatar?.reset(); },
  };
  avatar?.bind({ pos: P, move: (x, z) => api.moveTo(x, z) });
  return api;
}
