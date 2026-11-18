// matchday-rsvp: station 4's challenge, the penalty (rules unchanged from the guided version).
// Drag anywhere to aim and release to shoot (a release without a drag shows "Drag to aim, then release"); keyboard: the four arrow keys aim, Space shoots.
// The keeper dives to a seeded side. Shots to either top corner always score, the keeper only saves shots within reach of his dive side,
// and after one failed shot (a save or a miss) the next one scores: at most 2 shots.
//
// Challenge contract (shared with challenges/ticket.js; step 2 adds challenges/dribble.js and challenges/corner.js):
//   id, label (the card's primary button), skipLabel, instruction (the chip text)
//   prepare(station, ready)       camera move into the challenge pose (skippable), then ready()
//   start({ station, value, onResult, onSkip })   onResult({ outcome, ... }) once the guest has succeeded; onSkip = the chip's Skip
//   stop()                        cancel and tidy up (Skip, reset)
//   active()                      true while it owns the input
//   filter(ev)                    pointerdown filter: return false to own the pointer (controls.js otherwise starts a look drag)
import * as THREE from 'three';
import { clamp, easeOut, anglesFor } from '../util.js';
import { THEME } from '../config.js';
import { aimText } from '../aim.js';
import { kickStart } from '../avatar.js';

export const GOAL_Z = -52.5, HALF_W = 3.66, GOAL_H = 2.44;
// The penalty, third person. The guest's avatar (a right-footer) waits RUN_UP metres back and a little left of the ball, angled in along KICK_H; the
// camera sits behind and above it (pos, aiming at target) so the whole figure stays under the goal line on screen and left of the ball: the crossbar at
// ~30% of the frame height, the ball at ~75%, the boots at ~90%, on every aspect (the vertical FOV is fixed), clear of the top-centre chip and the 22% toast.
// feet = where the avatar stands (roam's feet point); roam.frame(PENALTY_VIEW) solves the boom for it.
export const KICK_H = Math.PI - 0.25, RUN_UP = 1.5;
export const PENALTY_VIEW = { pos: [-0.15, 2.8, -36.6], target: [0, 0, -47.05], fov: 64, feet: kickStart(0, -41.5, KICK_H, RUN_UP).map((v) => +v.toFixed(3)) };
export const PACE = { diveDelay: 0.08, dive: 0.55, flight: 0.6, goalDrop: 0.45, postGoal: 1.2, saveArc: 0.8, missArc: 0.6, retake: 1.9, faceGoal: 0.5, prepare: 0.9, toast: 1.6, toastGoal: 1.8, toastAim: 2.2 };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function createPenalty(world, { tl, hud, roam, audio, cine, signal, rng }) {
  const { camera, controls: ctl, renderer, scene, keeper, ball, crowd, goal, sim } = world;
  const dom = renderer.domElement;
  const ballRest = V3(world.penaltySpot.x, 0.11, world.penaltySpot.z);
  const aim = { x: 0, y: 1.2 };
  let on = false, stage = 'idle', fails = 0, shots = 0, last = null, drag = null, onResult = null, onSkip = null, aimTimer = null, aimSaid = '', cueShown = false;

  // aim reticle: fog white, no glow, no pulse
  const reticle = new THREE.Group(); reticle.visible = false; reticle.renderOrder = 20;
  { const m = new THREE.MeshBasicMaterial({ color: THEME.color.fog100, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 40), m), dot = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), m);
    ring.renderOrder = dot.renderOrder = 20; reticle.add(ring, dot); scene.add(reticle); }
  const updateReticle = () => reticle.position.set(aim.x, aim.y, GOAL_Z + 0.35);
  function announceAim() {   // polite and throttled (leading + trailing, 0.6 s)
    const flush = () => { const t = aimText(aim.x, aim.y, HALF_W, GOAL_H); if (t !== aimSaid) { aimSaid = t; hud.say(t); } };
    if (aimTimer) return;
    flush(); aimTimer = setTimeout(() => { aimTimer = null; flush(); }, 600);
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function aimFromPointer(ev) {
    ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight * 2 - 1)); ray.setFromCamera(ndc, camera);
    const d = ray.ray.direction, o = ray.ray.origin, t = (GOAL_Z - o.z) / d.z, mx = HALF_W + 0.4, my = GOAL_H + 0.4;   // the goal mouth plus a small margin
    if (d.z < -1e-3 && t > 0) { aim.x = clamp(o.x + d.x * t, -mx, mx); aim.y = clamp(o.y + d.y * t, 0.05, my); } else { aim.x = Math.sign(d.x || 1) * mx; aim.y = my; }
    updateReticle(); announceAim();
  }
  dom.addEventListener('pointermove', (ev) => { if (drag && drag.id === ev.pointerId) { if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 6) drag.moved = true; aimFromPointer(ev); } else if (on && stage === 'aim' && !ctl.dragging) dom.style.cursor = 'crosshair'; }, { signal });
  const endDrag = (ev) => {
    if (!drag || drag.id !== ev.pointerId) return;
    const d = drag; drag = null; dom.style.cursor = 'grab'; try { dom.releasePointerCapture(ev.pointerId); } catch {}
    if (ev.type === 'pointerup') { if (d.moved) shoot(aim.x, aim.y); else hud.toast('Drag to aim, then release', PACE.toastAim); }
  };
  dom.addEventListener('pointerup', endDrag, { signal }); dom.addEventListener('pointercancel', endDrag, { signal });
  addEventListener('keydown', (ev) => {
    if (ev.defaultPrevented) return;   // the key that skipped the lead-in (flow.js) does not also shoot
    if (!on || stage !== 'aim' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key;
    if ((k === ' ' || k === 'Spacebar') && ev.target.closest?.('button, input, a, textarea, select')) return;   // Space on a control (the chip's Skip) activates that control
    if (k === 'ArrowLeft') aim.x = clamp(aim.x - 0.4, -3.5, 3.5); else if (k === 'ArrowRight') aim.x = clamp(aim.x + 0.4, -3.5, 3.5);
    else if (k === 'ArrowUp') aim.y = clamp(aim.y + 0.3, 0.15, 2.3); else if (k === 'ArrowDown') aim.y = clamp(aim.y - 0.3, 0.15, 2.3);
    else if (k === ' ' || k === 'Spacebar') { ev.preventDefault(); shoot(aim.x, aim.y); return; } else return;
    ev.preventDefault(); updateReticle(); announceAim();
  }, { signal });

  const faceGoalAngles = () => anglesFor(PENALTY_VIEW.pos, PENALTY_VIEW.target);
  let framed = false;
  // the staged framing: the avatar back on its mark facing the run-up, the camera on the solved boom (eases over from the arrival or the held flight view)
  function frame() {
    framed = true; const A = roam.avatar;
    roam.frame(PENALTY_VIEW);
    if (A) { if (A.offset.x || A.offset.z) A.clearOffset(); A.face(KICK_H); }
  }
  function startAim() {
    frame(); stage = 'aim'; aim.x = 0; aim.y = 1.2; aimSaid = ''; updateReticle(); reticle.visible = true;
    hud.chip(hud.isTouch() ? 'Drag to aim, release to shoot.' : 'Drag to aim, release to shoot. Keys: arrows aim, Space shoots.', 'Skip the kick', () => onSkip?.());
    if (!cueShown && hud.isTouch()) { cueShown = true; hud.toast('Drag towards the goal', PACE.toastAim); }
  }
  // The keeper: saves only inside his dive envelope on his side; top corners always score; after ANY one failed shot (save or miss) the next one beats him.
  const envelope = (side, x, y) => ((x - side * 1.9) / 2.2) ** 2 + ((y - 1.1) / 1.5) ** 2 <= 1 && Math.abs(x) <= keeper.reach;
  function shoot(ax, ay) {
    if (!on || stage !== 'aim') return false;
    ax = clamp(ax, -5.5, 5.5); ay = clamp(ay, 0.05, 3.6);
    stage = 'flight'; reticle.visible = false; hud.hideChip();
    const r = rng(), wrongWay = fails >= 1;
    let side = r < 0.5 ? -1 : 1; if (wrongWay) { side = ax >= 0 ? -1 : 1; ax = clamp(ax, -(HALF_W - 0.4), HALF_W - 0.4); ay = clamp(ay, 0.2, GOAL_H - 0.3); }   // the mercy shot always lands in the mouth
    const inMouth = Math.abs(ax) <= HALF_W - 0.05 && ay <= GOAL_H - 0.05;
    const corner = inMouth && Math.abs(ax) >= 2.3 && ay >= 1.45;
    const outcome = !inMouth ? 'miss' : (corner || wrongWay) ? 'goal' : envelope(side, ax, ay) ? 'save' : 'goal';
    last = { outcome, ax, ay, side: side < 0 ? 'left' : 'right', wrongWay }; shots++;
    const E = V3(ax, ay, outcome === 'save' ? GOAL_Z + 0.55 : GOAL_Z), pose = side < 0 ? 'diveLeft' : 'diveRight', dist = ballRest.distanceTo(E);
    // the avatar runs up and strikes; the ball leaves (and the keeper reads it, the slow-mo beat is timed) from the boot's contact, not the key press
    const launch = () => {
      if (!on) return;
      tl.after(PACE.diveDelay, () => tl.tween(PACE.dive, (u) => { keeper.setPose(pose, u); if (outcome === 'save') keeper.object.position.x = clamp(ax * 0.9, -2.6, 2.6) * easeOut(u); }));
      if (outcome === 'goal') cine?.goal(ball, PACE.flight, { fov: 52 });   // the camera tracks the ball in, slow motion as it hits the net
      tl.tween(PACE.flight, (u) => { ball.position.lerpVectors(ballRest, E, u); ball.position.y += 0.5 * Math.sin(Math.PI * u) * Math.min(1, dist / 12); ball.rotation.x -= 0.5; ball.rotation.z += 0.12; }, () => {
        if (!on) return;
        if (outcome === 'goal') onGoal(ax, ay); else if (outcome === 'save') onSave(side); else onMiss(ay);
      });
    };
    roam.hold(true);   // the camera stays put through the run-up and the flight (the track only turns it)
    if (roam.avatar) roam.avatar.kickAt({ x: ballRest.x, z: ballRest.z }, { onContact: launch }); else launch();
    return true;
  }
  function onGoal(ax, ay) {
    goal.ripple(1, ax, ay); crowd.cheer(0); audio.roar(1); hud.toast('Goal', PACE.toastGoal); stage = 'goal';
    roam.avatar?.celebrate({ dir: 1, dur: PACE.postGoal - 0.1 });   // the wheel-away fits inside the existing post-goal beat
    const from = ball.position.clone(); tl.tween(PACE.goalDrop, (u) => { const e = easeOut(u); ball.position.set(from.x * (1 - 0.1 * e), Math.max(0.11, from.y - 0.9 * e * e), from.z - 1.5 * e); });
    tl.after(PACE.postGoal, () => { if (!on) return; resetBall(); keeper.setPose('idle', sim.t); on = false; stage = 'idle'; const cb = onResult; onResult = null; cb?.({ outcome: 'goal', ...last }); });
  }
  function onSave(side) {
    fails++; hud.toast('Saved. Take it again', PACE.toast); const from = ball.position.clone(); stage = 'save'; roam.avatar?.walkBack(PACE.retake - 0.5, KICK_H);
    tl.tween(PACE.saveArc, (u) => { const t = u * 0.8; ball.position.set(from.x + side * 1.8 * t, Math.max(0.11, from.y + 3 * t - 4.9 * t * t), from.z + 5.5 * t); ball.rotation.x += 0.3; });
    tl.after(PACE.retake, retake);
  }
  function onMiss(ay) {
    fails++; hud.toast(ay > GOAL_H ? 'Over the bar. Take it again' : 'Wide. Take it again', PACE.toast); const from = ball.position.clone(), d = from.clone().sub(ballRest).setY(0).normalize(); stage = 'miss'; roam.avatar?.walkBack(PACE.retake - 0.5, KICK_H);
    tl.tween(PACE.missArc, (u) => { ball.position.set(from.x + d.x * 5 * u, from.y + 0.5 * u, from.z + d.z * 5 * u); });
    tl.after(PACE.retake, retake);
  }
  function retake() { if (!on) return; resetBall(); keeper.setPose('idle', sim.t); startAim(); }
  function resetBall() { ball.position.copy(ballRest); ball.rotation.set(0, 0, 0); }

  const api = {
    id: 'penalty', label: 'Take the challenge', skipLabel: 'Skip the kick', aim, PACE,
    active: () => on,
    // walk onto the spot and face the goal (skippable 2-4 s camera move when the guest is elsewhere)
    prepare(station, ready) {
      const a = faceGoalAngles(), at = roam.pos, F = PENALTY_VIEW.feet, far = Math.hypot(at.x - F[0], at.z - F[1]) > 0.05;
      const turned = Math.abs(((ctl.yaw - a.yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) > 0.02 || Math.abs(ctl.pitch - a.pitch) > 0.02;
      if (!far && !turned && Math.abs(camera.fov - PENALTY_VIEW.fov) < 0.1) { ready(); return; }
      roam.setBoom(roam.frameFor(PENALTY_VIEW).boom); framed = true;   // the glide ends on the staged framing
      roam.glide({ pts: far ? [V3(F[0], 0, F[1])] : [], yaw: a.yaw, pitch: a.pitch, fov: PENALTY_VIEW.fov, dur: far ? PACE.prepare : PACE.faceGoal, done: ready });
    },
    start({ onResult: cb, onSkip: sk }) { on = true; fails = 0; onResult = cb; onSkip = sk; resetBall(); keeper.setPose('idle', sim.t); startAim(); },
    stop() { cine?.stopTrack(); roam.hold(false); if (framed) { framed = false; roam.resetBoom(); } on = false; stage = 'idle'; drag = null; onResult = null; onSkip = null; reticle.visible = false; resetBall(); keeper.setPose('idle', sim.t); clearTimeout(aimTimer); aimTimer = null; },
    filter(ev) {   // while aiming, any drag on the scene aims (and the release shoots)
      if (!on || stage !== 'aim') return true;
      drag = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, moved: false }; dom.setPointerCapture(ev.pointerId); dom.style.cursor = 'crosshair'; aimFromPointer(ev); return false;
    },
    shoot,
    state: () => ({ on, stage, fails, shots, aim: { ...aim }, last: last && { ...last } }),
  };
  return api;
}
