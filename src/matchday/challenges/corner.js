// matchday-rsvp: station 3's challenge, the corner (challenge contract: see the challenges/penalty.js header; this one adds step(dt), reset() and obstacles()).
// The guest takes the corner from the north-east flag. A faint ring on the grass marks the striker's zone in the box; the reticle is where the cross lands.
// Desktop: the arrow keys move the aim (Up deeper, Down shorter, Left/Right across), Space whips it in. Phones (any pointer): drag to aim, release to cross.
// The HOME striker runs onto a cross inside the ring and heads it in past the north keeper (who goes the wrong way). A cross outside the ring is the one
// failure (too short or too long, with a friendly toast). Never blocking: optional, a visible Skip, at most 2 crosses, and after one failure the retake
// is pulled into the ring, so it is headed in. Everything runs on the sim clock (step(dt) from the flow), so window.__dbg.simStep(dt) stays deterministic.
import * as THREE from 'three';
import { clamp, easeOut, smoother, lerp, lerpAngle, anglesFor, reducedMotion } from '../util.js';
import { THEME } from '../config.js';
import { buildBall } from '../people.js';
import { pose } from '../teammates.js';
import { kickStart } from '../avatar.js';

export const GOAL_Z = -52.5;
export const BALL0 = [33.35, -51.85];                 // inside the north-east corner arc
export const ZONE = { x: 3.0, z: -47.5, r: 3.2 };     // the striker's zone: between the penalty spot and the six-yard box, near-post side
const HEADER_TO = [-2.3, 1.3, GOAL_Z - 0.05];         // the header goes in just inside the far post, low
// The corner, third person. The guest's avatar stands beside the ball at the flag, RUN_UP metres back along the cross (two steps) and a boot's width left
// of it; the camera sits behind and above it on the line to (3, -49) (pos, aiming at target), so the avatar stays under the box on screen: the goal and the
// striker's ring near the horizon (~30-40% of the frame height, clear of the chip and the 22% toast), the ball at ~70%, the boots above the bottom edge.
// The goal (~6 deg right of centre) and the striker (~7 deg left) both fit a portrait phone's ~16 deg half-width. feet = the avatar's mark.
const LOOK_AT = [3.0, -49.0];
const DIR = (() => { const dx = LOOK_AT[0] - BALL0[0], dz = LOOK_AT[1] - BALL0[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();
// The run-up comes in at ANGLE to the cross (from the camera's left), so the figure stands clear of the ball on screen; the camera sits BACK metres behind
// the figure along the cross line, CAM_LAT metres left of the ball's line (the ball just right of centre, the figure left of it).
export const KICK_H = Math.atan2(DIR[0], DIR[1]) - 0.5, RUN_UP = 1.0;
const FEET = kickStart(BALL0[0], BALL0[1], KICK_H, RUN_UP), BACK = 3.6, CAM_Y = 2.75, CAM_LAT = -0.3;
const CAM = (() => { const rx = -DIR[1], rz = DIR[0], along = (FEET[0] - BALL0[0]) * DIR[0] + (FEET[1] - BALL0[1]) * DIR[1] - BACK; return [BALL0[0] + DIR[0] * along + rx * CAM_LAT, CAM_Y, BALL0[1] + DIR[1] * along + rz * CAM_LAT]; })();
export const CORNER_VIEW = { pos: CAM.map((v) => +v.toFixed(3)), target: [LOOK_AT[0], -6.2, LOOK_AT[1]], fov: 64, feet: FEET.map((v) => +v.toFixed(3)) };
export const PACE = { prepare: 1.2, zoom: 0.7, zoomBack: 0.6, flight: 1.15, run: 0.85, header: 0.45, diveDelay: 0.05, dive: 0.5, goalDrop: 0.45, postGoal: 1.2, settle: 0.7, retake: 1.9, cheer: 1.1, toast: 1.8, toastGoal: 1.8, toastAim: 2.2 };
const STEP = 0.9;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function createCorner(world, { tl, hud, roam, audio, cine, teammates, signal }) {
  const { camera, controls: ctl, renderer, scene, crowd, goal, sim, keeper } = world;
  const dom = renderer.domElement;
  const B0 = V3(BALL0[0], 0.11, BALL0[1]);
  const dG = Math.hypot(ZONE.x - B0.x, ZONE.z - B0.z);
  const { yaw: camYaw, pitch: PITCH } = anglesFor(CORNER_VIEW.pos, CORNER_VIEW.target), F = CORNER_VIEW.feet;
  const fwd = [-Math.sin(camYaw), -Math.cos(camYaw)], rgt = [Math.cos(camYaw), -Math.sin(camYaw)];   // the guest's screen axes on the ground
  const striker = teammates.get('striker'), home = [striker.x, striker.z];

  // ---- props: the corner ball, the zone ring and the landing reticle (overlay marks, same fog white as the penalty reticle) ----------------------------
  const ball = buildBall(); ball.name = 'cornerBall'; ball.position.copy(B0); scene.add(ball);
  const markMat = (o) => new THREE.MeshBasicMaterial({ color: THEME.color.fog100, transparent: true, opacity: o, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  // Seen from the flag the grass is at a grazing angle (a 6.4 m disc 30 m away is ~10 px tall), so the zone is a filled patch with a bold rim, and the aim is
  // an upright ring at heading height over a ground spot (fog white off the zone, the HOME accent on it).
  const zoneRing = new THREE.Group(); zoneRing.position.set(ZONE.x, 0.03, ZONE.z);
  { const fill = new THREE.Mesh(new THREE.CircleGeometry(ZONE.r, 64), markMat(0.3)), rim = new THREE.Mesh(new THREE.RingGeometry(ZONE.r - 0.5, ZONE.r, 72), markMat(0.8)); fill.rotation.x = rim.rotation.x = -Math.PI / 2; zoneRing.add(fill, rim); }
  const hoopMat = new THREE.MeshBasicMaterial({ color: THEME.color.fog100, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false });
  const hoop = new THREE.Group(); {   // fog white with a dark keyline, so it reads against the red stands
    const line = new THREE.MeshBasicMaterial({ color: 0x0b0d12, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 40), hoopMat), outer = new THREE.Mesh(new THREE.RingGeometry(0.56, 0.64, 40), line), inner = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.42, 40), line), dot = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), hoopMat);
    outer.renderOrder = inner.renderOrder = 19; ring.renderOrder = dot.renderOrder = 20; hoop.add(outer, inner, ring, dot); hoop.position.y = 2.3; }
  const spotMat = markMat(0.7), spot = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), spotMat); spot.rotation.x = -Math.PI / 2; spot.position.y = 0.04;
  const reticle = new THREE.Group(); reticle.add(hoop, spot);
  const ON = new THREE.Color(THEME.color.accent), OFF = new THREE.Color(THEME.color.fog100);
  zoneRing.visible = reticle.visible = false; zoneRing.renderOrder = spot.renderOrder = 5; scene.add(zoneRing, reticle);

  const aim = { x: ZONE.x, z: ZONE.z };
  const AIM_BOX = { x0: -10, x1: 24, z0: -52, z1: -30 };
  const clampAim = () => { aim.x = clamp(aim.x, AIM_BOX.x0, AIM_BOX.x1); aim.z = clamp(aim.z, AIM_BOX.z0, AIM_BOX.z1); reticle.position.x = aim.x; reticle.position.z = aim.z; spotMat.color.copy(judge(aim.x, aim.z) === 'good' ? ON : OFF); };
  const judge = (x, z) => (Math.hypot(x - ZONE.x, z - ZONE.z) <= ZONE.r ? 'good' : Math.hypot(x - B0.x, z - B0.z) < dG ? 'short' : 'long');
  let said = '', sayTimer = null;
  function announce() {   // polite and throttled, like the penalty's aim
    const flush = () => { const j = judge(aim.x, aim.z), t = j === 'good' ? "On the striker's run" : j === 'short' ? 'Short of the striker' : 'Beyond the striker'; if (t !== said) { said = t; hud.say(t); } };
    if (sayTimer) return; flush(); sayTimer = setTimeout(() => { sayTimer = null; flush(); }, 600);
  }

  let on = false, stage = 'idle', fails = 0, crosses = 0, last = null, onResult = null, onSkip = null, drag = null, cueShown = false, ballHidden = false, board = null;
  const aiming = () => on && stage === 'aim';

  // ---- input: drag raycasts onto the grass; arrows nudge the aim 0.9 m; Space or a release crosses -----------------------------------------------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function aimFromPointer(ev) {
    ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, camera);
    const o = ray.ray.origin, d = ray.ray.direction;
    if (d.y < -1e-3) { const t = -o.y / d.y; aim.x = o.x + d.x * t; aim.z = o.z + d.z * t; } else { aim.x = AIM_BOX.x0; aim.z = o.z + d.z * 60; }
    clampAim(); announce();
  }
  dom.addEventListener('pointermove', (ev) => { if (!drag || drag.id !== ev.pointerId) return; if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 6) drag.moved = true; if (drag.moved) aimFromPointer(ev); }, { signal });
  const endDrag = (ev) => {
    if (!drag || drag.id !== ev.pointerId) return;
    const d = drag; drag = null; dom.style.cursor = 'grab'; try { dom.releasePointerCapture(ev.pointerId); } catch {}
    if (ev.type === 'pointerup' && aiming()) { if (d.moved) cross(); else hud.toast('Drag to aim, then release', PACE.toastAim); }
  };
  dom.addEventListener('pointerup', endDrag, { signal }); dom.addEventListener('pointercancel', endDrag, { signal });
  addEventListener('keydown', (ev) => {
    if (ev.defaultPrevented) return;   // the key that skipped the lead-in (flow.js) does not also cross
    if (!aiming() || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key;
    if ((k === ' ' || k === 'Spacebar') && ev.target.closest?.('button, input, a, textarea, select')) return;   // Space on the chip's Skip activates Skip
    const m = { ArrowUp: [1, 0], ArrowDown: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] }[k];
    if (m) { aim.x += (fwd[0] * m[0] + rgt[0] * m[1]) * STEP; aim.z += (fwd[1] * m[0] + rgt[1] * m[1]) * STEP; clampAim(); announce(); ev.preventDefault(); return; }
    if (k === ' ' || k === 'Spacebar') { ev.preventDefault(); if (!ev.repeat) cross(); }
  }, { signal });

  // ---- the striker: one drive for the whole move (run onto the cross, jump, then cheer or stand, then jog back to his spot); a moving agent while he moves
  let plan = null;   // { mode: 'run' | 'jump' | 'cheer' | 'stand' | 'back', t0, from, to, dur, then }
  function strike(mode, o = {}) { plan = { mode, t0: sim.t, from: [striker.x, striker.z], ...o }; if (!striker.drive) teammates.drive('striker', drive); }
  const faceCorner = (I) => Math.atan2(B0.x - I.x, B0.z - I.z);
  function drive(I, t, dt) {
    if (!plan) return 'done';
    const J = I.fig.joints, k = t - plan.t0; I.related = ['cornerBall'];
    if (plan.mode === 'run') {
      const u = clamp(k / plan.dur, 0, 1); I.x = plan.from[0] + (plan.to[0] - plan.from[0]) * u; I.z = plan.from[1] + (plan.to[1] - plan.from[1]) * u; I.agent = true;
      const dx = plan.to[0] - plan.from[0], dz = plan.to[1] - plan.from[1]; I.ry = Math.hypot(dx, dz) > 0.2 ? Math.atan2(dx, dz) : faceCorner(I); pose(J, t * 11, 1);
      if (u >= 1) strike('jump', { dur: plan.jump ?? 0.3, then: plan.then });
      return;
    }
    if (plan.mode === 'jump') {
      const u = clamp(k / plan.dur, 0, 1), lift = Math.sin(Math.PI * Math.min(1, u * 0.62 + 0.38 * u * u)) * 0.5;   // peaks at contact (the end of the window)
      I.agent = true; I.ry = faceCorner(I) - 0.6; pose(J, 0, 0); J.hips.position.y = 0.92 + lift;
      J.kneeL.rotation.set(0.7, 0, 0); J.kneeR.rotation.set(0.35, 0, 0); J.shL.rotation.set(-0.3, 0, 0.9); J.shR.rotation.set(-0.3, 0, -0.9); J.spine.rotation.set(-0.25 + 0.5 * u, -0.35 * u, 0);
      if (u >= 1) strike(plan.then || 'stand', { dur: plan.then === 'cheer' ? PACE.cheer : PACE.settle });
      return;
    }
    if (plan.mode === 'cheer' || plan.mode === 'stand') {
      const cheer = plan.mode === 'cheer'; I.agent = false; pose(J, 0, 0);
      if (cheer) { I.ry = Math.atan2(F[0] - I.x, F[1] - I.z); J.shL.rotation.set(0, 0, 2.6 + 0.15 * Math.sin(k * 11)); J.shR.rotation.set(0, 0, -2.6 - 0.15 * Math.sin(k * 11)); J.hips.position.y = 0.92 + 0.18 * Math.abs(Math.sin(k * 5.5)); }
      else { J.spine.rotation.set(0.25, 0, 0); J.shL.rotation.set(0, 0, 0.35); J.shR.rotation.set(0, 0, -0.35); }   // hands on hips, a shrug
      if (k >= plan.dur) strike('back');
      return;
    }
    // back to his spot at a jog (4 m/s), then idle again (teammates.js turns him to face the corner)
    const dx = home[0] - I.x, dz = home[1] - I.z, d = Math.hypot(dx, dz), stp = 4 * dt;
    if (d <= Math.max(stp, 0.02)) { I.x = home[0]; I.z = home[1]; plan = null; I.related = []; return 'done'; }
    I.agent = true; I.ry = Math.atan2(dx, dz); I.x += dx / d * stp; I.z += dz / d * stp; pose(J, t * 9, 0.85);
  }

  // ---- the cross ---------------------------------------------------------------------------------------------------------------------------------------
  // the landing point in the ring nearest the aim (where the striker meets it; also the retake's pull)
  const intoZone = (x, z, r = ZONE.r - 0.6) => { const dx = x - ZONE.x, dz = z - ZONE.z, d = Math.hypot(dx, dz); return d <= r ? [x, z] : [ZONE.x + dx / d * r, ZONE.z + dz / d * r]; };
  function cross(force = null) {
    if (!aiming()) return false;
    const mercy = fails >= 1;
    if (mercy) [aim.x, aim.z] = intoZone(aim.x, aim.z);
    else if (force === 'short' || force === 'long') { const dx = aim.x - B0.x, dz = aim.z - B0.z, d = Math.hypot(dx, dz), want = force === 'short' ? dG - ZONE.r - 4 : dG + ZONE.r + 5; aim.x = B0.x + dx / d * want; aim.z = B0.z + dz / d * want; }
    clampAim();
    const outcome = judge(aim.x, aim.z) === 'good' ? 'goal' : judge(aim.x, aim.z);   // 'goal' | 'short' | 'long'
    stage = 'flight'; crosses++; drag = null; reticle.visible = false; zoneRing.visible = false; hud.hideChip();
    last = { outcome, aim: [+aim.x.toFixed(2), +aim.z.toFixed(2)], mercy, forced: !!force && !mercy };
    // the avatar's two-step run-up and the whip; the striker's run, the zoom, the slow-mo beat and the flight start at the boot's contact, not the key press
    roam.hold(true);   // the camera stays put (the zoom only turns it)
    if (roam.avatar) roam.avatar.kickAt({ x: B0.x, z: B0.z }, { onContact: () => { if (on) launch(outcome); } }); else launch(outcome);
    return true;
  }
  function launch(outcome) {
    const meet = intoZone(aim.x, aim.z), off = [meet[0] - home[0], meet[1] - home[1]], ol = Math.hypot(...off) || 1;
    const stand = outcome === 'goal' ? [meet[0] - off[0] / ol * 0.15, meet[1] - off[1] / ol * 0.15] : meet;   // he meets it with his forehead, just behind the ball's line
    strike('run', { to: stand, dur: PACE.run, jump: PACE.flight - PACE.run, then: outcome === 'goal' ? 'cheer' : 'stand' });
    tl.cancel(zoomT); zoomT = tl.after(0.15, () => { zoomT = camTo([meet[0] - 1.2, 1.4, meet[1] - 0.6], ZOOM_FOV, PACE.zoom); });
    if (outcome === 'goal' && cine) tl.after(PACE.flight - cine.SLOW.beat * 0.4, () => { if (on) cine.slowmo(); });   // the header in slow motion: it eases down just before contact
    const A = outcome === 'goal' ? V3(aim.x, 2.3, aim.z) : V3(aim.x, 0.11, aim.z), from = B0.clone(), apex = outcome === 'long' ? 7.5 : outcome === 'short' ? 4.2 : 6.2;
    tl.tween(PACE.flight, (v) => {
      ball.position.lerpVectors(from, A, v); ball.position.y += apex * 4 * v * (1 - v); ball.rotation.y += 0.35; ball.rotation.x += 0.12;
    }, () => { if (!on) return; if (outcome === 'goal') header(A); else landed(outcome, A); });
  }
  function header(A) {
    stage = 'header'; audio.tock();
    const E = V3(...HEADER_TO);
    cine?.track(() => ball.position, { dur: PACE.header + 0.5, weight: 0.85, lead: 0.5 });   // the 22 deg follow turns with the header into the net (it ends before the zoom back)
    tl.after(PACE.diveDelay, () => tl.tween(PACE.dive, (v) => keeper.setPose('diveRight', v)));   // the wrong way
    tl.tween(PACE.header, (v) => { ball.position.lerpVectors(A, E, v); ball.position.y += 0.35 * Math.sin(Math.PI * v); ball.rotation.x -= 0.4; }, () => {
      if (!on) return;
      stage = 'goal'; goal.ripple(1, E.x, E.y); crowd.cheer(0); audio.roar(1); hud.toast('Goal', PACE.toastGoal);
      roam.avatar?.celebrate({ dir: -1, dur: PACE.postGoal - 0.1 });   // wheels away into the pitch (left of the run-up), inside the post-goal beat
      const f = ball.position.clone(); tl.tween(PACE.goalDrop, (v) => { const e = easeOut(v); ball.position.set(f.x - 0.2 * e, Math.max(0.11, f.y - 1.2 * e * e), f.z - 1.1 * e); });
      tl.after(PACE.postGoal - PACE.zoomBack, () => { zoomT = camTo(null, CORNER_VIEW.fov, PACE.zoomBack); });
      tl.after(PACE.postGoal, () => { if (!on) return; on = false; stage = 'done'; keeper.setPose('idle', sim.t); const cb = onResult; onResult = null; cb?.({ ...last }); });
    });
  }
  function landed(outcome, A) {
    fails++; stage = outcome; hud.toast(outcome === 'short' ? 'Too short. Take it again' : 'Too long. Take it again', PACE.toast); roam.avatar?.walkBack(PACE.retake - 0.5, KICK_H);
    const dx = A.x - B0.x, dz = A.z - B0.z, d = Math.hypot(dx, dz) || 1;
    tl.tween(PACE.settle, (v) => { const e = easeOut(v); ball.position.set(A.x + dx / d * 3 * e, 0.11 + 0.5 * Math.sin(Math.PI * Math.min(1, v * 1.6)) * (1 - v), A.z + dz / d * 3 * e); ball.rotation.x += 0.2; });
    tl.after(PACE.retake - PACE.zoomBack, () => { if (on) zoomT = camTo(null, CORNER_VIEW.fov, PACE.zoomBack); });
    tl.after(PACE.retake, () => { if (!on) return; startAim(); });
  }
  function startAim() {
    stage = 'aim'; ball.position.copy(B0); ball.rotation.set(0, 0, 0); keeper.setPose('idle', sim.t);
    framed = true; roam.frame(CORNER_VIEW);
    const A = roam.avatar; if (A) { if (A.offset.x || A.offset.z) A.clearOffset(); A.face(KICK_H); }
    if (fails === 0) { aim.x = ZONE.x; aim.z = ZONE.z; }
    clampAim(); said = ''; reticle.visible = true; zoneRing.visible = true;
    hud.chip(hud.isTouch() ? 'Drag to aim, release to cross.' : 'Arrows aim the cross into the ring, Space whips it in.', 'Skip the header', () => onSkip?.());
    if (!cueShown && hud.isTouch()) { cueShown = true; hud.toast('Drag onto the ring', PACE.toastAim); }
  }
  // the camera follows the cross: it eases toward the striker's meeting point and tightens to 22 deg (non-skippable, inside the flight), then eases back
  const ZOOM_FOV = 22;
  function camTo(target, fov, dur) {
    const a = { yaw: ctl.yaw, pitch: ctl.pitch, fov: camera.fov }, b = target ? anglesFor(camera.position.toArray(), target) : { yaw: camYaw, pitch: PITCH };   // from the held camera
    const t = tl.tween(dur, (v) => { const e = smoother(v); ctl.yaw = lerpAngle(a.yaw, b.yaw, e); ctl.pitch = lerp(a.pitch, b.pitch, e); ctl.apply(); camera.fov = lerp(a.fov, fov, e); camera.updateProjectionMatrix(); });
    if (reducedMotion()) tl.finish(t);   // reduced motion: camera moves are cuts, as everywhere else
    return t;
  }
  let zoomT = null, framed = false;
  const look = () => { roam.moveTo(F[0], F[1], { yaw: camYaw, pitch: PITCH }); if (camera.fov !== CORNER_VIEW.fov) { camera.fov = CORNER_VIEW.fov; camera.updateProjectionMatrix(); } };

  const agentBall = () => (on ? { id: 'cornerBall', name: 'corner ball', x: ball.position.x, z: ball.position.z, heading: 0, radius: 0.11, related: ['striker'] } : null);
  const api = {
    id: 'corner', label: 'Take the challenge', skipLabel: 'Skip the header', PACE, CORNER_VIEW,
    active: () => on,
    prepare(station, ready) {
      ball.position.copy(B0); ball.rotation.set(0, 0, 0);
      if (world.ball.visible) { world.ball.visible = false; ballHidden = true; }
      board = scene.getObjectByName('board' + station.id); if (board) board.visible = false;   // seen from the flag, the back of the question board would fill the left of the frame   // the penalty ball on its spot would read as a second ball in the box
      roam.setBoom(roam.frameFor(CORNER_VIEW).boom); framed = true;   // the glide ends on the staged framing
      roam.glide({ pts: [V3(F[0], 0, F[1])], yaw: camYaw, pitch: PITCH, fov: CORNER_VIEW.fov, dur: PACE.prepare, done: ready, say: 'Over to the corner flag' });
    },
    start({ onResult: cb, onSkip: sk }) {
      on = true; onResult = cb; onSkip = sk; fails = 0; crosses = 0; last = null; drag = null;
      startAim(); teammates.addAgent('cornerBall', agentBall);
    },
    // (Skip, reset, or the station completing after the goal). The striker finishes his move and jogs back on his own.
    stop() {
      const scored = stage === 'done' || stage === 'goal';
      on = false; stage = 'idle'; drag = null; onResult = null; onSkip = null; reticle.visible = false; zoneRing.visible = false;
      cine?.stopTrack(); if (zoomT) { tl.cancel(zoomT); zoomT = null; } roam.hold(false); if (camera.fov !== CORNER_VIEW.fov && roam.pos.x === F[0]) look();   // a Skip mid-zoom hands back the plain view
      if (framed) { framed = false; roam.resetBoom(); }
      teammates.removeAgent('cornerBall'); keeper.setPose('idle', sim.t);
      if (plan && (plan.mode === 'run' || plan.mode === 'jump')) strike('back');
      if (!scored) { ball.position.copy(B0); ball.rotation.set(0, 0, 0); }
      if (ballHidden) { world.ball.visible = true; ballHidden = false; }
      if (board) { board.visible = true; board = null; }
    },
    reset() { api.stop(); plan = null; ball.position.copy(B0); ball.rotation.set(0, 0, 0); },
    filter(ev) {
      if (!aiming()) return true;
      ev.preventDefault(); drag = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, moved: false };
      try { dom.setPointerCapture(ev.pointerId); } catch {} dom.style.cursor = 'crosshair'; return false;
    },
    step() { if (on && stage === 'aim') { look(); hoop.quaternion.copy(camera.quaternion); } },   // the guest stands at the flag: hold the view (roam.step re-places the rig every step)
    cross,
    // dev: zone 'good' | 'short' | 'long' -> cross; crossAt(x, z) puts the aim there first (world metres)
    play(zone = 'good') {
      if (!aiming()) return false;
      if (zone === 'good') { aim.x = ZONE.x; aim.z = ZONE.z; return cross(); }
      if (zone !== 'short' && zone !== 'long') throw new Error("zone must be 'good' | 'short' | 'long'");
      aim.x = ZONE.x; aim.z = ZONE.z; return cross(zone);
    },
    crossAt(x, z) { if (!aiming()) return false; aim.x = x; aim.z = z; return cross(); },
    obstacles: () => [[B0.x, B0.z, 0.12]],
    state: () => ({ on, stage, fails, crosses, last: last && { ...last }, aim: [+aim.x.toFixed(2), +aim.z.toFixed(2)], zone: judge(aim.x, aim.z), ball: ball.position.toArray().map((v) => +v.toFixed(3)), striker: [+striker.x.toFixed(2), +striker.z.toFixed(2)], goal: 'north' }),
    ball,
  };
  return api;
}
