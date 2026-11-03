// matchday-rsvp: station 2's challenge, dribble and shoot (challenge contract: see the challenges/penalty.js header; this one adds step(dt) and obstacles()).
// A teammate's warm-up drill: the passer at the head of the course lays the ball off to the guest by the HOME dugout, the guest jogs a 5-cone slalom
// toward the SOUTH goal and shoots past a second keeper; the teammate by the tunnel mouth runs over to celebrate the goal.
// Desktop: Left/Right (A/D) steer, Up/Down (W/S) speed up / ease off, Space shoots. Phones (any pointer): drag sideways to steer, tap to shoot.
// The run is automatic (a jog); clipping a cone knocks it over and slows the guest for a moment, it never fails them.
// Shooting opens once the last cone is behind the guest, and the run carries on with the ball at their feet toward the goal: shoot on the move whenever
// you like. Left alone, the run eases to a stop at COURSE.cap (12 m from the goal's centre) and shooting stays open there. The shot goes across the
// keeper to the far post unless an arrow key is held (that picks the corner); a shot at the near post is saved. Never blocking: optional, a visible Skip, at most 2 shots, and after one failure (a save, or a miss) the next scores.
// Everything runs on the sim clock (step(dt) from the flow), so window.__dbg.simStep(dt) stays deterministic.
import * as THREE from 'three';
import { clamp, easeOut, smoother, anglesFor, reducedMotion } from '../util.js';
import { buildKeeper, buildBall } from '../people.js';
import { pose } from '../teammates.js';

// The course, in world metres: from S toward the south goal's centre; cones on the axis at s metres; shooting opens at shootFrom; len is the end of the
// drill course (play() stops there). The run itself carries on past it and brakes (brake m/s^2) to a stop at cap, 12 m from the goal's
// centre on the axis (more off it): clear of the keeper, the goal and the net, and far enough out that a portrait phone still frames the whole goal mouth.
export const COURSE = { start: [-29, 13], len: 31, cap: 37, brake: 3.5, cones: [7, 11.5, 16, 20.5, 25], shootFrom: 26.2, ahead: 2.6, laneHalf: 4.5 };
export const GOAL_Z = 52.5;
const HALF_W = 3.66;
// The dribble, third person: the camera rides a dribble boom behind and over the right shoulder of the guest's avatar, aiming at the goal's centre at
// PITCH. With the fixed 64 deg vertical FOV the goal sits near the horizon (~30-36% of the frame height, clear of the top-centre chip and the 22% toast),
// the avatar's head stays under the goal line and its boots at ~80%; the camera's 0.6 m shoulder offset keeps the ball (BALL.side right of the feet) clear
// of the right leg, and the figure inside a portrait phone's frame.
export const PITCH = -13 * Math.PI / 180, FOV = 64;
export const BOOM = { len: 3.55, height: 1.8, shoulder: 0.6 };
// The strike swing. From the dribble boom the avatar's own body (and then the follow-through leg) stands between the camera and the ball's first metres: it
// leaves the boot across the line of sight toward the far post, so the guest lost sight of their shot for up to ~0.3 s (measured: 4-9 frames at 30 fps). While
// the camera is held through the strike and the flight it therefore swings out to the right (shoulder, m) and a little up (lift, m) over `in` sim s, aimed at the
// same point at the goal, and eases back over `out` s once the ball is in. On a portrait phone the goal mouth and the ball no longer fit one frame at that
// offset, so the ball wins: the aim never turns past `frame` of the half FOV off the ball (landscape never reaches that, so the goal stays centred).
// The ball also leaves the boot faster than it arrives (a drag-like ease-out, same flight time and end point), so it is clear of the boot by the next frame.
// Reduced motion cuts to the wide framing at the strike and back at the end of the flight.
export const SWING = { shoulder: 1.5, lift: 0.4, frame: 0.95, in: 0.3, out: 0.6 };
// the ball at the guest's feet: BALL.ahead m in front and BALL.side m right; a touch every second right-foot step pushes it out by up to BALL.push
export const BALL = { ahead: 0.5, push: 0.4, side: 0.3 };
export const PACE = { prepare: 1.2, passFrom: 0.3, flight: 0.75, diveDelay: 0.1, dive: 0.5, goalDrop: 0.45, postGoal: 1.4, rebound: 0.8, retake: 1.9, slow: 0.7, knock: 0.3, toast: 1.6, toastGoal: 1.8 };
export const SPEED = { jog: 5.2, sprint: 7.0, easy: 3.4, lateral: 3.4, celebrate: 7.5 };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// the staged view (window.__views[1]): mid-slalom, the avatar 12.6 m along the course and 1.1 m right of the cones; pos = the boom camera (roam.js boomCam)
export const DRIBBLE_VIEW = (() => { const [sx, sz] = COURSE.start, l = Math.hypot(-sx, GOAL_Z - sz), ux = -sx / l, uz = (GOAL_Z - sz) / l, x = sx + ux * 12.6 - uz * 1.1, z = sz + uz * 12.6 + ux * 1.1;
  const yaw = Math.atan2(x, -(GOAL_Z - z)), sy = Math.sin(yaw), cy = Math.cos(yaw), cp = Math.cos(PITCH), c = [x + cy * BOOM.shoulder + sy * cp * BOOM.len, BOOM.height - Math.sin(PITCH) * BOOM.len, z - sy * BOOM.shoulder + cy * cp * BOOM.len];
  const d = Math.hypot(c[0], GOAL_Z - c[2]);
  return { pos: c.map((v) => +v.toFixed(2)), target: [0, +(c[1] + Math.tan(PITCH) * d).toFixed(2), GOAL_Z], fov: FOV, at: [12.6, 1.1], feet: [+x.toFixed(2), +z.toFixed(2)] }; })();

export function createDribble(world, { tl, hud, roam, audio, cine, teammates, signal, rng }) {
  const { camera, controls: ctl, renderer, scene, crowd, goals, sim, bloom } = world;
  const dom = renderer.domElement;
  const S = { x: COURSE.start[0], z: COURSE.start[1] };
  const u = new THREE.Vector2(0 - S.x, GOAL_Z - S.z).normalize(), right = new THREE.Vector2(-u.y, u.x);   // the course axis and the guest's screen right along it
  const at = (s, lat) => ({ x: S.x + u.x * s + right.x * lat, z: S.z + u.y * s + right.y * lat });

  // ---- props: five training cones (one instanced lathe, PBR plastic with a white band), the second keeper, the drill ball ------------------------------
  const prof = [[0.135, 0], [0.135, 0.018], [0.105, 0.026], [0.098, 0.04], [0.078, 0.1], [0.062, 0.15], [0.058, 0.16], [0.052, 0.19], [0.046, 0.2], [0.03, 0.26], [0.022, 0.285], [0.012, 0.296], [0, 0.3]];
  const coneGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  // Darker and redder than real cone paint (0xff5a14) on purpose: under the floodlights AgX lifts an R = 1 orange toward peach, and full dielectric specular
  // adds the pale dusk sky on top. This albedo with a low F0 (specularIntensity) and no clearcoat lands on a saturated traffic-cone orange on screen.
  { const p = coneGeo.attributes.position, c = new Float32Array(p.count * 3), o = new THREE.Color(0xda4500), w = new THREE.Color(0xf2f2ee);
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = y > 0.152 && y < 0.198 ? w : o; c[3 * i] = k.r; c[3 * i + 1] = k.g; c[3 * i + 2] = k.b; }
    coneGeo.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
  const cones = new THREE.InstancedMesh(coneGeo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.6, specularIntensity: 0.4, side: THREE.DoubleSide }), COURSE.cones.length);
  cones.castShadow = true; cones.receiveShadow = true; cones.name = 'dribbleCones'; scene.add(cones);
  const coneAt = COURSE.cones.map((s) => at(s, 0));
  const knocked = COURSE.cones.map(() => null);   // null = upright, else { dx, dz, u }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ax = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
  function drawCone(i) {
    const c = coneAt[i], k = knocked[i];
    if (!k) { m4.makeTranslation(c.x, 0, c.z); cones.setMatrixAt(i, m4); }
    else { const e = easeOut(k.u); ax.set(k.dz, 0, -k.dx).normalize(); q.setFromAxisAngle(ax, 1.42 * e); pv.set(c.x + k.dx * 0.35 * e, 0.11 * e, c.z + k.dz * 0.35 * e); m4.compose(pv, q, one); cones.setMatrixAt(i, m4); }
    cones.instanceMatrix.needsUpdate = true;
  }
  const resetCones = () => { knocked.fill(null); coneAt.forEach((_, i) => drawCone(i)); };
  resetCones();

  const keeper = buildKeeper(), kGroup = new THREE.Group(); kGroup.name = 'keeperSouth'; kGroup.position.set(0, 0, GOAL_Z - 0.35); kGroup.rotation.y = Math.PI;   // setPose resets the root, so the mirror lives on a parent
  keeper.setHome(0, 0); kGroup.add(keeper.object); scene.add(kGroup); keeper.setPose('idle', 0);
  const keeperXZ = () => ({ x: -keeper.object.position.x, z: kGroup.position.z - keeper.object.position.z });   // local -> world under the pi turn

  const ball = buildBall(); ball.name = 'dribbleBall'; scene.add(ball);
  const passer = teammates.get('dugout'), celeb = teammates.get('tunnel');
  const feet0 = at(COURSE.ahead, 0);                 // where the lay-off arrives: at the guest's feet at the start
  const rest = (() => { const dx = feet0.x - passer.x, dz = feet0.z - passer.z, d = Math.hypot(dx, dz); return { x: passer.x + dx / d * 0.5, z: passer.z + dz / d * 0.5 }; })();
  const resetBall = () => { ball.position.set(rest.x, 0.11, rest.z); ball.rotation.set(0, 0, 0); };
  resetBall();

  // ---- state + input ------------------------------------------------------------------------------------------------------------------------------
  let on = false, stage = 'idle', s = 0, lat = 0, latV = 0, speed = 0, slowT = 0, roll = 0, fails = 0, shots = 0, last = null, onResult = null, onSkip = null;
  let drag = null, dragSteer = 0, passT = null, kickU = 1, said = '', framed = false, from = null;   // from: where the last shot was struck (the retake)
  let swingA = null, swingT = null;   // swingA: the held camera at the strike { p, yaw, B: the ball, T: the point it keeps aimed at, u: the swing so far }
  const keys = new Set();
  const STEER_L = new Set(['ArrowLeft', 'KeyA']), STEER_R = new Set(['ArrowRight', 'KeyD']), FAST = new Set(['ArrowUp', 'KeyW']), EASY = new Set(['ArrowDown', 'KeyS']);
  const keySteer = () => ([...keys].some((k) => STEER_R.has(k)) ? 1 : 0) - ([...keys].some((k) => STEER_L.has(k)) ? 1 : 0);
  const steerNow = () => clamp(keySteer() + dragSteer, -1, 1);
  const aiming = () => on && (stage === 'run' || stage === 'ready');
  addEventListener('keydown', (ev) => {
    if (ev.defaultPrevented) return;   // the key that skipped the lead-in (flow.js) does not also shoot
    if (!aiming() || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === ' ' || ev.key === 'Spacebar') { if (ev.target.closest?.('button, input, a, textarea, select')) return; ev.preventDefault(); if (!ev.repeat) shoot(); return; }   // Space on the chip's Skip activates Skip
    if (STEER_L.has(ev.code) || STEER_R.has(ev.code) || FAST.has(ev.code) || EASY.has(ev.code)) { keys.add(ev.code); ev.preventDefault(); }
  }, { signal });
  addEventListener('keyup', (ev) => keys.delete(ev.code), { signal });
  addEventListener('blur', () => { keys.clear(); dragSteer = 0; }, { signal });
  dom.addEventListener('pointermove', (ev) => { if (!drag || drag.id !== ev.pointerId) return; const dx = ev.clientX - drag.sx; if (Math.hypot(dx, ev.clientY - drag.sy) >= 8) drag.moved = true; dragSteer = clamp(dx / 45, -1, 1); }, { signal });
  const endDrag = (ev) => {
    if (!drag || drag.id !== ev.pointerId) return;
    const d = drag; drag = null; dragSteer = 0; dom.style.cursor = 'grab'; try { dom.releasePointerCapture(ev.pointerId); } catch {}
    if (ev.type === 'pointerup' && !d.moved && performance.now() - d.t < 250) shoot();   // a tap shoots
  };
  dom.addEventListener('pointerup', endDrag, { signal }); dom.addEventListener('pointercancel', endDrag, { signal });

  // ---- the guest's rig: the avatar's feet at the course point, the camera on the dribble boom aiming at the goal's centre; the ball at the feet ---------
  // The touches follow the avatar's right foot: it lands on the ball every second step (its stride phase), the ball rolls out to BALL.ahead + BALL.push
  // and the guest closes on it again before the next touch.
  const guest = () => at(s, lat);
  const goalYaw = (g) => anglesFor([g.x, roam.EYE, g.z], [0, roam.EYE, GOAL_Z]).yaw;
  function place(dt = 0) {
    const g = guest(), yaw = goalYaw(g);
    roam.moveTo(g.x, g.z, { yaw: yaw - latV * 0.012, pitch: PITCH });
    const ph = roam.avatar ? roam.avatar.phase / (2 * Math.PI) : roll / 2.2, c2 = ((ph + 0.5) % 2) / 2;   // 0 at a right-foot landing, two steps per touch
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), d = BALL.ahead + (speed > 0.1 ? BALL.push * Math.sin(Math.PI * c2) : 0), sd = BALL.side + latV * 0.05;
    const px = ball.position.x, pz = ball.position.z;
    ball.position.set(g.x + fx * d + right.x * sd, 0.11, g.z + fz * d + right.y * sd);
    const mx = ball.position.x - px, mz = ball.position.z - pz, ml = Math.hypot(mx, mz);
    if (dt > 0 && ml > 1e-4 && ml < 1) { ax.set(mz, 0, -mx).normalize(); ball.rotateOnWorldAxis(ax, ml / 0.11); }
  }
  function knock(i, fromX, fromZ) {
    const c = coneAt[i], dx = c.x - fromX, dz = c.z - fromZ, l = Math.hypot(dx, dz) || 1, k = { dx: dx / l, dz: dz / l, u: 0 };
    knocked[i] = k; slowT = PACE.slow; audio.tock(); hud.say('Clipped a cone. Keep going');
    tl.tween(PACE.knock, (v) => { k.u = v; drawCone(i); });
  }
  const chipRun = () => hud.chip(hud.isTouch() ? 'Drag to steer, tap to shoot.' : 'Arrows steer through the cones, Space shoots.', 'Skip the dribble', () => onSkip?.());
  const chipShoot = () => hud.chip(hud.isTouch() ? 'Tap to shoot.' : 'Space to shoot. Hold an arrow to pick a corner.', 'Skip the dribble', () => onSkip?.());

  function step(dt) {
    if (keeper.pose === 'idle') keeper.setPose('idle', sim.t + 1.7);
    if (!on) return;
    if (stage === 'run') {
      const thr = ([...keys].some((k) => FAST.has(k)) ? 1 : 0) - ([...keys].some((k) => EASY.has(k)) ? 1 : 0);
      slowT = Math.max(0, slowT - dt);
      const want = (thr > 0 ? SPEED.sprint : thr < 0 ? SPEED.easy : SPEED.jog) * (slowT > 0 ? 0.45 : 1);
      speed += (want - speed) * (1 - Math.exp(-4 * dt)); latV += (steerNow() * SPEED.lateral - latV) * (1 - Math.exp(-8 * dt));
      speed = Math.min(speed, Math.sqrt(2 * COURSE.brake * Math.max(0, COURSE.cap - s)));   // past the cones the run goes on and brakes into the cap
      const s0 = s, lat0 = lat; s = Math.min(COURSE.cap, s + speed * dt); lat = clamp(lat + latV * dt, -COURSE.laneHalf, COURSE.laneHalf);
      const g = guest(); if (Math.hypot(g.x - passer.x, g.z - passer.z) < 0.85) lat = lat0;   // slide past the passer, never through him
      roll += (s - s0);
      place(dt);
      for (let i = 0; i < coneAt.length; i++) {
        if (knocked[i]) continue; const c = coneAt[i], gg = guest();
        if (Math.hypot(ball.position.x - c.x, ball.position.z - c.z) < 0.36) knock(i, ball.position.x - (ball.position.x - c.x) * 2 - u.x, ball.position.z - u.y);
        else if (Math.hypot(gg.x - c.x, gg.z - c.z) < 0.5) knock(i, gg.x, gg.z);
      }
      if (s >= COURSE.shootFrom && said !== 'range') { said = 'range'; chipShoot(); }   // past the last cone: the chip turns to the shot
      if (COURSE.cap - s < 0.05) { s = COURSE.cap; stage = 'ready'; speed = 0; latV = 0; place(); chipShoot(); }   // stopped: shooting stays open
    }
  }

  // ease the held camera out (to = 1) or back (to = 0) over dur sim s; reduced motion cuts. The aim point is kept except while the ball track owns the look
  function swingCam(to, dur) {
    const A = swingA; if (!A) return;
    tl.cancel(swingT); swingT = null;
    const from = A.u, set = (u) => {
      A.u = u; const e = smoother(u), c = Math.cos(A.yaw), sn = Math.sin(A.yaw);
      camera.position.set(A.p.x + c * SWING.shoulder * e, A.p.y + SWING.lift * e, A.p.z - sn * SWING.shoulder * e);   // right of the head = (cos yaw, -sin yaw)
      if (!cine?.tracking) {
        const a = anglesFor(camera.position.toArray(), A.T), b = anglesFor(camera.position.toArray(), A.B).yaw, half = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect) * SWING.frame;
        const d = Math.atan2(Math.sin(b - a.yaw), Math.cos(b - a.yaw));   // the ball's bearing off the aim; a portrait phone is too narrow for the goal and the ball: the ball wins
        ctl.yaw = Math.abs(d) > half ? b - Math.sign(d) * half : a.yaw; ctl.pitch = a.pitch; ctl.apply();
      }
    };
    if (reducedMotion()) { set(to); return; }
    const t = swingT = tl.tween(dur, (v) => set(from + (to - from) * v), () => { if (swingT === t) swingT = null; });
  }
  const swingEnd = () => { tl.cancel(swingT); swingT = null; swingA = null; };

  // ---- the shot ---------------------------------------------------------------------------------------------------------------------------------------
  // side: -1 screen left, +1 screen right (facing +z, screen right is world -x); 0 = across the keeper. force (dev only): 'goal' | 'save' | 'miss'.
  function shoot(side = 0, force = null) {
    if (!aiming()) return false;
    if (s < COURSE.shootFrom) { hud.say('Weave past the last cone first'); return false; }
    const g = guest(), near = g.x < -0.8 ? 1 : g.x > 0.8 ? -1 : 0, kSide0 = rng() < 0.5 ? -1 : 1, mercy = fails >= 1;
    side = side || steerNow() && Math.sign(steerNow()) || (near ? -near : -kSide0);
    let outcome = force || (near ? (side === near ? 'save' : 'goal') : (side === kSide0 ? 'save' : 'goal'));
    if (mercy) { outcome = 'goal'; if (near && side === near) side = -near; }   // after one failure the next one scores: it goes across the keeper
    const kSide = outcome === 'save' ? side : outcome === 'goal' ? -side : (near || kSide0);
    const wasRun = stage === 'run'; stage = 'flight'; hud.hideChip(); keys.clear(); dragSteer = 0; drag = null;
    const wx = (m) => -side * m;   // screen side -> world x
    const E = outcome === 'save' ? V3(wx(1.9), 0.85, GOAL_Z - 0.6) : outcome === 'miss' ? V3(wx(HALF_W + 0.9), 0.7, GOAL_Z + 0.2) : V3(wx(HALF_W - 0.75), 0.75, GOAL_Z + 0.05);
    from = { s, lat, running: wasRun };
    last = { outcome, side: side < 0 ? 'left' : 'right', near: near < 0 ? 'left' : near > 0 ? 'right' : 'none', mercy, forced: !!force && !mercy, from: { s: +s.toFixed(2), lat: +lat.toFixed(2), running: from.running } }; shots++;
    const B = ball.position.clone(), dist = B.distanceTo(E), pose_ = kSide < 0 ? 'diveLeft' : 'diveRight';
    // the avatar strikes it from its feet; the keeper's dive, the teammate's run and the slow-mo beat are timed from the boot's contact, not the key press
    const launch = () => {
      if (!on) return;
      tl.after(PACE.diveDelay, () => tl.tween(PACE.dive, (v) => keeper.setPose(pose_, v)));
      if (outcome === 'goal') { tl.after(PACE.flight * 0.5, () => { if (on) celebrate(); }); cine?.goal(ball, PACE.flight, { fov: 54 }); }   // he reads it as it leaves the boot; the camera tracks it in, in slow motion at the net
      tl.tween(PACE.flight, (v) => { ball.position.lerpVectors(B, E, 1 - (1 - v) ** 1.5); ball.position.y += 0.9 * Math.sin(Math.PI * v) * Math.min(1, dist / 18); ball.rotation.x += 0.45; }, () => {
        if (!on) return;
        swingCam(0, SWING.out);
        if (outcome === 'goal') onGoal(E); else if (outcome === 'save') onSave(kSide); else onMiss();
      });
    };
    roam.hold(true);   // the camera stays put through the strike and the flight (the track only turns it)
    { const p = camera.position, d = Math.hypot(p.x, GOAL_Z - p.z);  swingA = { p: p.clone(), yaw: ctl.yaw, u: 0, B: [B.x, B.y, B.z], T: [0, p.y + Math.tan(PITCH) * d, GOAL_Z] }; swingCam(1, SWING.in); }
    if (roam.avatar) roam.avatar.kickAt({ x: B.x, z: B.z }, { onContact: launch }); else launch();
    return true;
  }
  function onGoal(E) {
    stage = 'goal'; goals.south.ripple(1, E.x, E.y); crowd.cheer(0); audio.roar(1); hud.toast('Goal', PACE.toastGoal);
    roam.avatar?.celebrate({ dir: -1, dur: PACE.postGoal - 0.1 });   // wheels away to the left (the teammate comes in from the right), inside the post-goal beat
    const from = ball.position.clone(); tl.tween(PACE.goalDrop, (v) => { const e = easeOut(v); ball.position.set(from.x * (1 - 0.1 * e), Math.max(0.11, from.y - 0.7 * e * e), from.z + 1.3 * e); });
    tl.after(PACE.postGoal, () => { if (!on) return; keeper.setPose('idle', sim.t); on = false; stage = 'done'; const cb = onResult; onResult = null; cb?.({ ...last }); });
  }
  function onSave(kSide) {
    fails++; stage = 'save'; hud.toast('Saved. Take it again', PACE.toast); const from = ball.position.clone(), wx = -kSide; walkBack();
    tl.tween(PACE.rebound, (v) => { const t = v * 0.8; ball.position.set(from.x + wx * 2.2 * t, Math.max(0.11, from.y + 2.6 * t - 4.9 * t * t), from.z - 5.5 * t); ball.rotation.x -= 0.3; });
    tl.after(PACE.retake, retake);
  }
  function onMiss() {
    fails++; stage = 'miss'; hud.toast('Wide. Take it again', PACE.toast); const from = ball.position.clone(); walkBack();
    tl.tween(PACE.rebound, (v) => ball.position.set(from.x * (1 + 0.15 * v), Math.max(0.11, from.y - 0.5 * v), from.z + 4 * v));
    tl.after(PACE.retake, retake);
  }
  const faceGoal = () => { const g = guest(), y = goalYaw(g); return y + Math.PI; };   // the avatar's heading toward the goal (forward = the camera's)
  const walkBack = () => roam.avatar?.walkBack(PACE.retake - 0.5, faceGoal());
  // the retake starts where the shot was struck: a shot on the move restarts the run from there (it rolls on at half a jog), a standing one stands
  function retake() {
    if (!on) return; keeper.setPose('idle', sim.t); latV = 0;
    if (from) { s = from.s; lat = from.lat; }
    if (from?.running) { stage = 'run'; speed = SPEED.jog * 0.5; slowT = 0; } else { stage = 'ready'; speed = 0; }
    const A = roam.avatar; if (A && (A.offset.x || A.offset.z)) A.clearOffset();
    swingEnd(); roam.hold(false); place(); A?.face(faceGoal()); chipShoot();
  }

  // the teammate by the tunnel mouth sprints over, arms up, then stays on the pitch facing the guest (a moving agent only while he runs)
  function celebrate() {
    const g = guest(), a = anglesFor([g.x, roam.EYE, g.z], [0, roam.EYE, GOAL_Z]), fx = -Math.sin(a.yaw), fz = -Math.cos(a.yaw), rx = Math.cos(a.yaw), rz = -Math.sin(a.yaw);
    const to = { x: g.x + fx * 3.4 + rx * 1.6, z: g.z + fz * 3.4 + rz * 1.6 }; let ph = 'run', t0 = 0;
    celeb.related = [];
    teammates.drive('tunnel', (I, t, dt) => {
      const J = I.fig.joints;
      if (ph === 'run') {
        const dx = to.x - I.x, dz = to.z - I.z, d = Math.hypot(dx, dz), stepL = SPEED.celebrate * dt;
        I.agent = true; I.ry = Math.atan2(dx, dz); pose(J, t * 10, 1); J.shL.rotation.set(0, 0, 2.5); J.shR.rotation.set(0, 0, -2.5);   // arms up as he runs in
        if (d <= stepL) { I.x = to.x; I.z = to.z; ph = 'cheer'; t0 = t; I.agent = false; } else { I.x += dx / d * stepL; I.z += dz / d * stepL; }
        return;
      }
      const k = t - t0, g2 = guest(); I.ry = Math.atan2(g2.x - I.x, g2.z - I.z); pose(J, 0, 0);
      J.shL.rotation.set(0, 0, 2.7 + 0.15 * Math.sin(k * 12)); J.shR.rotation.set(0, 0, -2.7 - 0.15 * Math.sin(k * 12)); J.hips.position.y = 0.92 + 0.22 * Math.abs(Math.sin(k * 5.5));
      if (k > 1.6) { I.faceTo = [g2.x, g2.z]; return 'done'; }
    });
  }

  // ---- agents (smoke contract): the second keeper and the live ball, while the challenge runs; related = each other, so a save is not an overlap -----
  const agentKeeper = () => { if (!on) return null; const k = keeperXZ(); return { id: 'keeperSouth', name: 'second keeper', x: k.x, z: k.z, heading: Math.PI, radius: 0.45, related: ['dribbleBall'] }; };
  const agentBall = () => (on ? { id: 'dribbleBall', name: 'dribble ball', x: ball.position.x, z: ball.position.z, heading: 0, radius: 0.11, related: ['keeperSouth'] } : null);

  const api = {
    id: 'dribble', label: 'Take the challenge', skipLabel: 'Skip the dribble', PACE, COURSE,
    active: () => on,
    // walk onto the start by the dugout and face the goal (a skippable 1.2 s move); the passer lays the ball off during it, arriving as the move ends
    prepare(station, ready) {
      const a = anglesFor([S.x, roam.EYE, S.z], [0, roam.EYE, GOAL_Z]);
      tl.cancel(passT); resetBall(); kickU = 0;
      teammates.drive('dugout', (I) => {   // the lay-off: wind up, swing through, then back to idle
        const J = I.fig.joints, b = clamp(kickU / 0.45, 0, 1), f = clamp((kickU - 0.45) / 0.25, 0, 1); pose(J, 0, 0);
        J.hipR.rotation.set(0.75 * b * (1 - f) - 0.9 * smoother(f), 0, -0.05); J.kneeR.rotation.set(1.1 * b * (1 - f) + 0.1, 0, 0); J.shL.rotation.set(0.4 * b - 0.3 * f, 0, 0.5); J.shR.rotation.set(-0.4 * b + 0.4 * f, 0, -0.45);
        return kickU >= 1 ? 'done' : undefined;
      });
      const from = V3(rest.x, 0.11, rest.z), to = V3(feet0.x, 0.11, feet0.z), d = from.distanceTo(to);
      passT = tl.tween(PACE.prepare, (v) => {
        kickU = clamp(v / 0.55, 0, 1); const r = clamp((v - 0.42) / 0.58, 0, 1), e = 1 - (1 - r) * (1 - r);
        if (r > 0) { const px = ball.position.x, pz = ball.position.z; ball.position.lerpVectors(from, to, e); const m = Math.hypot(ball.position.x - px, ball.position.z - pz); if (m > 1e-4) { ax.set(ball.position.z - pz, 0, -(ball.position.x - px)).normalize(); ball.rotateOnWorldAxis(ax, m / 0.11); } }
      }, () => { kickU = 1; passT = null; }, { skip: true });
      roam.setBoom(BOOM); framed = true;   // the glide ends on the dribble boom
      roam.glide({ pts: [V3(S.x, roam.EYE, S.z)], yaw: a.yaw, pitch: PITCH, fov: FOV, dur: PACE.prepare, done: ready, say: 'Your teammate lays the ball off to you' });
    },
    start({ onResult: cb, onSkip: sk }) {
      if (passT) tl.finish(passT);
      on = true; onResult = cb; onSkip = sk; fails = 0; shots = 0; last = null; from = null; s = 0; lat = 0; latV = 0; speed = SPEED.jog * 0.5; slowT = 0; roll = 0; said = ''; keys.clear(); dragSteer = 0;
      resetCones(); keeper.setPose('idle', sim.t); stage = 'run'; roam.setBoom(BOOM); framed = true; roam.hold(false); place(); chipRun();
      teammates.addAgent('keeperSouth', agentKeeper); teammates.addAgent('dribbleBall', agentBall);
    },
    stop() {
      const wasGoal = stage === 'done' || stage === 'goal';
      on = false; stage = 'idle'; drag = null; dragSteer = 0; keys.clear(); onResult = null; onSkip = null; cine?.stopTrack();
      swingEnd(); roam.hold(false); if (framed) { framed = false; roam.resetBoom(); }
      teammates.removeAgent('keeperSouth'); teammates.removeAgent('dribbleBall'); keeper.setPose('idle', sim.t);
      if (passT) { tl.cancel(passT); passT = null; kickU = 1; }
      if (!wasGoal) resetBall();   // a goal stays in the net; anything else goes back to the passer
    },
    reset() { api.stop(); resetBall(); resetCones(); },
    filter(ev) {   // while running or ready: any pointer on the scene steers (drag) or shoots (tap)
      if (!aiming()) return true;
      ev.preventDefault(); drag = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, t: performance.now(), moved: false };
      try { dom.setPointerCapture(ev.pointerId); } catch {} dom.style.cursor = 'ew-resize'; return false;
    },
    step,
    shoot,
    // obstacles for the guest's walk: the upright cones and the second keeper [x, z, r]
    obstacles: () => [...coneAt.filter((_, i) => !knocked[i]).map((c) => [c.x, c.z, 0.16]), (() => { const k = keeperXZ(); return [k.x, k.z, 0.45]; })()],
    // dev: put the run at s metres along the course (up to the cap), lat metres to the screen right (staged views)
    stageAt(sAt, latAt = 0) { if (!aiming()) return false; s = clamp(sAt, 0, COURSE.cap); lat = clamp(latAt, -COURSE.laneHalf, COURSE.laneHalf); latV = 0; speed = SPEED.jog; roll = sAt; for (let i = 0; i < coneAt.length; i++) if (COURSE.cones[i] < s - 1) knocked[i] = null; place(); return true; },
    // dev: finish the slalom at once (the guest stops at the end of the course) and shoot. aim: 'far' | 'near' | 'left' | 'right'; force: 'goal' | 'save' | 'miss'
    play(aim = 'far', { force = null } = {}) {
      if (!aiming()) return false;
      if (stage === 'run') { s = COURSE.len; lat = 0; stage = 'ready'; speed = 0; latV = 0; place(); }
      const g = guest(), near = g.x < -0.8 ? 1 : g.x > 0.8 ? -1 : 0, side = { left: -1, right: 1, near: near || 1, far: -near || -1 }[aim];
      if (!side) throw new Error("aim must be 'far' | 'near' | 'left' | 'right'");
      return shoot(side, force);
    },
    state: () => ({ on, stage, s: +s.toFixed(2), lat: +lat.toFixed(2), speed: +speed.toFixed(2), fails, shots, knocked: knocked.filter(Boolean).length, last: last && { ...last }, ball: ball.position.toArray().map((v) => +v.toFixed(3)), goal: 'south' }),
    ball, keeper, cones,
  };
  return api;
}
