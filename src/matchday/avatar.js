// matchday-rsvp: the guest's own footballer (third person). A HOME-kit figure (buildFootballer, the taker's look) that stands on roam's feet point and is
// seen from roam's follow boom. Every pose is driven by the sim step (flow.step -> avatar.step(dt)) and the flow's sim-clock timeline, so
// window.__dbg.simStep(dt) stays deterministic. The avatar is never in a raycast (roam's tap pickables, the ticket and the aim drags are whitelists) and is
// not a smoke agent (it is the guest).
//
// API (part B wires the challenges to it; roam.avatar is the same object):
//   step(dt)                         per sim step, after roam and the challenges: follows the bound feet point, eases the heading toward the direction of
//                                    travel, advances the stride phase with the DISTANCE moved (no foot slide) and applies the pose
//   bind({ pos, move })              roam does this: pos = roam's live feet point { x, z }; move(x, z) = roam.moveTo (used by carry: true)
//   snap(heading) / face(heading)    turn now (teleports, staged views) / turn in place, eased, until the guest moves (heading: forward = (sin h, cos h))
//   offset                           { x, z } the figure stands this far from the feet point after a run-up or a celebration with carry: false (the camera
//                                    held still); roam folds it into the feet point at the next walk, glide or moveTo, and teleport clears it
//   kick({ runUp = 0, carry = false, onContact, onDone })   an optional run-up of runUp metres along the heading (~4 m/s, accelerating into the ball),
//                                    then the taker's swing (kickPose, KICK.swing sim s). onContact fires at foot contact (KICK_CONTACT of the swing, i.e.
//                                    runUp / 4 + 0.285 s after the call); onDone when the follow-through ends. carry: true moves roam's feet point (the
//                                    camera follows the run-up); false moves only the figure (the camera holds its framing). Returns the tween.
//   kickAt({ x, z }, opts)           kick() aimed so the right boot meets a ball at (x, z): turns the figure and sets the run-up from where it stands now
//                                    (CONTACT: the ball's centre in the figure's frame at foot contact). kickFrom(x, z, h, runUp) = where to stand for it.
//   celebrate({ dir = 1, carry = false, dur = 1.2, onDone })   an arms-out wheel-away (dir 1 = curving to the figure's right, -1 = left), ~4 m of ground
//   walkBack(dur, h)                 the figure walks its offset back to the feet point over dur (a retake), then turns to heading h
//   phase                            the stride phase (rad, 2 pi per two steps); the right foot touches down at (phase / 2 pi + 0.5) % 1 = 0
//   siuuu({ take, air, hold, turn, onLand, onDone })   the corner celebration's jump. The caller (cine.js siuuuRig on roam.glide) runs the feet point to
//                                    the corner (the run gait and planted feet come from that); take = sim s from now to the take-off. Then a jump of `air` s
//                                    with a half turn (turn = +1 / -1) so it lands facing back the way it came, onLand at touchdown, and a wide, slightly
//                                    crouched stance (leg IK: soles on the grass), chest out, both arms thrust straight down and back, held `hold` s. It ends
//                                    in the 'siuuu' hold, so the pose stays until setPose() changes it. Skippable (skip / reduced motion: the end pose).
//   cut()                            the next step re-plants the feet where the figure now stands without dropping the stride speed (a cinematic cut)
//   setPose('huddle' | 'applaud' | 'siuuu' | null)   an upper-body hold that eases in while the guest stands (null = back to idle / gait); one hold
//                                    cross-fades into the next
//   setName(name, number = '30')     the shirt back: the name over the seat number (the placeholder 30 until the reply is saved) (canvas fillText only); '' hides it
//   reset(), state(), object (the root group), joints
import * as THREE from 'three';
import { buildFootballer, kickPose, idlePose, KICK_CONTACT } from './people.js';
import { pose } from './teammates.js';
import { KIT_HEX, fontCss } from './config.js';
import { clamp, lerp, lerpAngle, smoother, smooth01, reducedMotion } from './util.js';

// Gait. The stride phase is 2*pi per full cycle (two steps) and advances with the distance moved, cycle(speed) metres per cycle. The legs are a small
// sagittal two-bone IK: in stance (the first `duty` of each leg's cycle) the ankle runs backward in a straight line at exactly the body's speed, so the
// planted foot does not slide; in swing it comes forward on an eased arc. Stance length is capped (STANCE) so the leg always reaches; the cycle grows with
// speed (a walk ~1.5 m, the 4.2 m/s roam jog ~2.5 m, the 8.5 m/s run ~3.7 m), so the duty factor falls from a walk's ~0.5 to a sprint's ~0.2 (flight).
// teammates.js pose() still drives the upper body (spine twist, elbows); the arms counter-swing to the feet.
// Planted feet: each stance foot is pinned to the world point (and heading) where it touched down, so turning while walking pivots on it instead of
// skating; the legs abduct (hip z) to reach a pinned foot off the hip line, and the boot keeps its planted heading. Turning on the spot also steps:
// the stride phase advances with the turn (GAIT.turnStep metres per radian) and those steps land under the hips.
const THIGH = 0.44, SHIN = 0.43, ANKLE = 0.074, HIP_X = 0.095;   // people.js: hip -> knee, knee -> ankle, ankle above the sole, hip joint off the centre line
export const GAIT = { stance: 0.32, turn: 10, lift: 0.07, turnStep: 0.45 }; // stance: half the stance length (m); lift: puts the soles on the grass in the FK poses (idle, kick)
export const KICK = { swing: 0.5, runUpSpeed: 4.0 };      // sim seconds for the swing; the run-up's average speed (m/s)
export const CONTACT = { fwd: 0.32, right: 0.142 };
// where the feet stand so that a kick with this run-up along heading h meets a ball at (x, z) (static: the challenges' staged views use it)
export function kickStart(x, z, h, runUp = 0) { const f = CONTACT.fwd + runUp; return [x - Math.sin(h) * f + Math.cos(h) * CONTACT.right, z - Math.cos(h) * f - Math.sin(h) * CONTACT.right]; }       // the ball's centre at foot contact (kickPose at KICK_CONTACT): metres ahead of and right of the feet point
export const CELEBRATE = { dur: 1.2, radius: 2.4, angle: 1.7 };
// the Siuuu: air time (s), the landing stance (ankle targets lat metres off each hip joint, hip joints this far over the soles: a ~0.13 m crouch), the
// touchdown's knee dip (m over s), the arms' throw (shoulder x = back, z = out) and the chest-out lean
export const SIUUU = { air: 0.5, lat: 0.27, hipH: 0.745, dip: 0.07, dipT: 0.26, armBack: 0.62, armOut: 0.3, chest: -0.2, head: -0.3 };
const GRAV = 9.81;
const JN = ['hips', 'spine', 'head', 'shL', 'shR', 'elL', 'elR', 'hipL', 'hipR', 'kneeL', 'kneeR', 'footL', 'footR'];
const TAU = Math.PI * 2;

export function createAvatar(world, { tl }) {
  const fig = buildFootballer({ shirt: KIT_HEX.home, shorts: 0xf2f2f2, socks: KIT_HEX.home, boots: 0xf0f0f0, skin: 0xd9a477, hair: 0x2a1a10, name: 'avatar' });
  const J = { ...fig.joints }, root = fig.root;
  J.footL = J.kneeL.children.find((o) => o.isGroup); J.footR = J.kneeR.children.find((o) => o.isGroup);   // the ankles: kept level in stance
  root.userData.avatar = true;
  world.scene.add(root);

  // ---- the shirt back: a canvas decal wrapped on the torso's back (an elliptic cylinder strip just off the shirt, spine-local) -------------------------
  // The strip covers spine y 0.13-0.57; everything is drawn below canvas row ~200 (spine y < 0.46), on the torso's straight part, because above it the
  // shirt narrows into the shoulders and would cut the top of the letters. theta pi -/+ 1.0 is the back (-z); u runs from the figure's left (+x) to its
  // right, which reads left to right from behind. The name is condensed (like shirt lettering) and shrinks to fit the back's width.
  const CW = 512, CH = 800, ARC = 2.0, NAME = { maxPx: 120, minPx: 40, width: 440, squeeze: 0.8, capTop: 214 };
  const canvas = document.createElement('canvas'); canvas.width = CW; canvas.height = CH;
  const c = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const decal = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.44, 24, 1, true, Math.PI - ARC / 2, ARC),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.4, roughness: 0.75, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
  decal.scale.set(0.19, 1, 0.122); decal.position.y = 0.35; decal.visible = false; decal.name = 'avatarShirtBack';
  J.spine.add(decal);
  let shown = null;
  let shownNo = '30';
  function setName(name = '', number = '30') {
    const n = String(name).toUpperCase(), no = n ? String(number) : '30';
    if (n === shown && no === shownNo) return; shown = n; shownNo = no;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, CW, CH);
    if (!n) { decal.visible = false; tex.needsUpdate = true; return; }
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    let px = NAME.maxPx; c.font = fontCss(800, px);
    while (c.measureText(n).width * NAME.squeeze > NAME.width && px > NAME.minPx) { px -= 2; c.font = fontCss(800, px); }
    c.setTransform(NAME.squeeze, 0, 0, 1, CW / 2, 0); c.fillText(n, 0, NAME.capTop + Math.round(px * 0.73), NAME.width / NAME.squeeze);   // cap height ~0.73 em
    c.setTransform(1, 0, 0, 1, 0, 0); let npx = 400; c.font = fontCss(800, npx); while (c.measureText(no).width > 440 && npx > 160) { npx -= 20; c.font = fontCss(800, npx); }
    c.fillText(no, CW / 2, 720);
    tex.needsUpdate = true; decal.visible = true;
  }

  // ---- pose buffers: the idle pose, then the gait / kick / holds blended over it ---------------------------------------------------------------------
  const NB = JN.length * 3 + 1, bufA = new Float32Array(NB), bufB = new Float32Array(NB), bufC = new Float32Array(NB);
  const save = (b) => { JN.forEach((k, i) => { const r = J[k].rotation; b[3 * i] = r.x; b[3 * i + 1] = r.y; b[3 * i + 2] = r.z; }); b[NB - 1] = J.hips.position.y; };
  const mixFrom = (b, w) => {   // current = lerp(b, current, w)
    JN.forEach((k, i) => { const r = J[k].rotation; r.set(lerp(b[3 * i], r.x, w), lerp(b[3 * i + 1], r.y, w), lerp(b[3 * i + 2], r.z, w)); });
    J.hips.position.y = lerp(b[NB - 1], J.hips.position.y, w);
  };
  const neutral = () => { for (const k of JN) J[k].rotation.set(0, 0, 0); J.hips.position.y = 0.92; };
  const cycle = (speed) => 1.2 + 0.3 * Math.max(0, speed);
  // one leg: hip joint at local height hy, ankle target (tz forward, ty up, lat = sideways off the hip joint, +x) in the root frame; sets the hip's
  // abduction (rotation.z) and the sagittal hip and knee (rotation.x) and returns the shin's angle
  function legIK(hip, knee, hy, tz, ty, lat = 0) {
    const ab = Math.asin(clamp(lat / Math.max(0.3, hy - ty), -0.45, 0.45)), dy = (ty - hy) / Math.cos(ab);
    const d = Math.min(THIGH + SHIN - 1e-4, Math.hypot(tz, dy)), phi = Math.atan2(tz, -dy);   // phi: the target's angle forward of straight down
    const kneeFlex = Math.PI - Math.acos(clamp((THIGH * THIGH + SHIN * SHIN - d * d) / (2 * THIGH * SHIN), -1, 1));
    const psi = phi + Math.acos(clamp((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d), -1, 1));   // the thigh's forward angle (the knee points forward)
    hip.rotation.x = -psi; hip.rotation.z = ab; knee.rotation.x = kneeFlex;
    return -psi + kneeFlex;   // rotation of the shin from straight down (positive = foot behind)
  }
  // root frame <-> world (the root turns by S.h about y)
  const toWorld = (lx, lz) => { const c = Math.cos(S.h), s = Math.sin(S.h); return [root.position.x + lx * c + lz * s, root.position.z - lx * s + lz * c]; };
  const toLocal = (wx, wz) => { const c = Math.cos(S.h), s = Math.sin(S.h), dx = wx - root.position.x, dz = wz - root.position.z; return [dx * c - dz * s, dx * s + dz * c]; };
  // per leg: the planted foot { on, x, z, h } (world), the lift-off point (root frame) the swing starts from, and the previous cycle position q
  const legs = [{ hipX: HIP_X, pin: { on: false }, from: null, q: null }, { hipX: -HIP_X, pin: { on: false }, from: null, q: null }];
  const unpin = () => { for (const l of legs) { l.pin.on = false; l.from = null; l.q = null; } };
  // rho = the share of the stride driven by travel (1 straight walking, 0 turning on the spot): the steps land rho * SH ahead
  function gaitPose(phase, speed, rho = 1) {
    const runF = smooth01(1.5, 5.0, speed), Lc = cycle(speed), SH = Math.min(GAIT.stance, Lc * 0.26), duty = clamp(2 * SH / Lc, 0.15, 0.6);
    pose(J, phase, runF);   // upper body: spine twist, elbows, the hips' base (overridden below)
    const qL = (phase / TAU) % 1, ground = ANKLE - GAIT.lift, lift = lerp(0.12, 0.3, runF) * lerp(0.6, 1, rho), land = SH * rho;
    const bob = 0.03 * runF * -Math.cos(4 * Math.PI * (qL - duty / 2));   // lowest at each mid-stance, highest in flight
    const SHh = SH * Math.max(rho, 0.4), hy = ground + Math.sqrt((THIGH + SHIN - 0.005) ** 2 - SHh * SHh) + bob;   // hip joint height: the stance leg just reaches the ends of its track
    J.hips.position.y = hy + 0.05;   // the hip joints sit 5 cm under the hips group (people.js)
    const zs = [];
    for (const [i, q, hip, knee, foot] of [[0, qL, J.hipL, J.kneeL, J.footL], [1, (qL + 0.5) % 1, J.hipR, J.kneeR, J.footR]]) {
      const L = legs[i]; let tz, ty, lat = L.hipX, toe = 0, yaw = 0;
      if (q < duty) {
        // stance: planted where it touched down (or, joining the gait mid-stance, where the nominal track has it now); the body walks over it
        const touchdown = L.q !== null && (L.q >= duty || L.q > q);
        if (!L.pin.on || touchdown) { const [wx, wz] = toWorld(L.hipX, land - 2 * land * (q / duty)); Object.assign(L.pin, { on: true, x: wx, z: wz, h: S.h }); }   // on the nominal track this frame: no jump at touchdown
        let [lx, lz] = toLocal(L.pin.x, L.pin.z);
        const off = Math.hypot(lx - L.hipX, lz);
        if (off > 0.62) { const k = 0.62 / off; lx = L.hipX + (lx - L.hipX) * k; lz *= k; const [wx, wz] = toWorld(lx, lz); L.pin.x = wx; L.pin.z = wz; }   // out of reach (a cut): it slides
        tz = lz; lat = lx; ty = ground; yaw = clamp(Math.atan2(Math.sin(L.pin.h - S.h), Math.cos(L.pin.h - S.h)), -1, 1);
        L.from = null; L.yaw = yaw;
      } else {
        // swing: from where it lifted off to the next landing under the hip line (rho * SH ahead), on an arc
        const w = (q - duty) / (1 - duty), e = smoother(w);
        if (!L.from) L.from = L.pin.on ? [...toLocal(L.pin.x, L.pin.z), L.yaw ?? 0] : [L.hipX, -SH, 0];   // lift-off where the foot stood (this frame's root), so it doesn't jump with the body
        const f = L.from; L.pin.on = false;
        tz = lerp(f[1], land, e) - 0.18 * runF * Math.sin(Math.PI * Math.min(1, w * 1.6)); lat = lerp(f[0], L.hipX, e); yaw = f[2] * (1 - e);
        ty = ground + lift * Math.sin(Math.PI * w); toe = 0.35 * Math.sin(Math.PI * w);
      }
      L.q = q;
      const shin = legIK(hip, knee, hy, tz, ty, lat - L.hipX);
      foot.rotation.x = -shin + toe; foot.rotation.y = yaw;   // level sole in stance, toe pointing down in swing; a planted boot keeps its heading
      zs.push(clamp(tz / SH, -1.2, 1.2));
    }
    // arms counter-swing to the feet (an arm goes back as its own side's foot goes forward); trunk lean with the run
    J.shL.rotation.x = 0.55 * zs[0] * (0.4 + 0.6 * runF); J.shR.rotation.x = 0.55 * zs[1] * (0.4 + 0.6 * runF);
    J.elL.rotation.x = J.elR.rotation.x = -0.3 - 0.95 * runF;
    J.spine.rotation.x = 0.03 + 0.11 * runF;
  }

  // ---- the Siuuu poses (set over neutral; the caller blends). Legs by leg IK, so the soles sit on the grass in the stance ----------------------------
  const GROUND = ANKLE - GAIT.lift;
  // one leg to an ankle target; the sole kept flat (pitch and the abduction's roll) and toed out by `toe`
  function plant(hip, knee, foot, hy, tz, ty, lat, toe = 0) { const shin = legIK(hip, knee, hy, tz, ty, lat); foot.rotation.set(-shin, toe, -hip.rotation.z); }
  const armsDown = (k) => {   // k = 1: both arms thrust straight down and back, a little out (clear of the shorts), elbows locked
    J.shL.rotation.set(SIUUU.armBack + k, 0, SIUUU.armOut); J.shR.rotation.set(SIUUU.armBack + k, 0, -SIUUU.armOut); J.elL.rotation.set(-0.04, 0, 0); J.elR.rotation.set(-0.04, 0, 0);
  };
  // the landing stance; tL = sim s since touchdown: the knees give and recover, the arms whip down and back (a small overshoot), chest out, chin up
  function siuuuLand(tL) {
    const dk = Math.sin(Math.PI * clamp(tL / SIUUU.dipT, 0, 1)), hy = GROUND + SIUUU.hipH - SIUUU.dip * dk;
    J.hips.position.y = hy + 0.05;
    plant(J.hipL, J.kneeL, J.footL, hy, 0.03, GROUND, SIUUU.lat, 0.3); plant(J.hipR, J.kneeR, J.footR, hy, 0.03, GROUND, -SIUUU.lat, -0.3);
    armsDown(0.14 * Math.sin(Math.PI * clamp(tL / 0.32, 0, 1)));
    J.spine.rotation.set(SIUUU.chest + 0.14 * dk, 0, 0); J.head.rotation.set(SIUUU.head + 0.12 * dk, 0, 0);
  }
  // in the air, v = 0..1: take-off extension, a tuck at the top while the body turns, the legs spreading into the stance and the arms (up and out
  // through the spin) thrown down and back just before touchdown
  function siuuuAir(v) {
    const k = Math.sin(Math.PI * v), sp = smooth01(0.45, 1, v), th = smooth01(0.7, 1, v);
    const hy = lerp(0.86, GROUND + SIUUU.hipH, smooth01(0.55, 1, v)), lat = lerp(0.02, SIUUU.lat, sp), ty = GROUND + 0.3 * k, tz = 0.1 * k + 0.03 * sp;
    J.hips.position.y = hy + 0.05;
    plant(J.hipL, J.kneeL, J.footL, hy, tz, ty, lat, 0.3 * sp); plant(J.hipR, J.kneeR, J.footR, hy, tz, ty, -lat, -0.3 * sp);
    J.shL.rotation.set(lerp(-0.35 * k, SIUUU.armBack, th), 0, lerp(0.35 + 0.95 * k, SIUUU.armOut, th)); J.shR.rotation.set(lerp(-0.35 * k, SIUUU.armBack, th), 0, -lerp(0.35 + 0.95 * k, SIUUU.armOut, th));
    J.elL.rotation.set(lerp(-0.75 * k, -0.04, th), 0, 0); J.elR.rotation.set(lerp(-0.75 * k, -0.04, th), 0, 0);
    J.spine.rotation.set(lerp(0.14 * k, SIUUU.chest, th), 0, 0); J.head.rotation.set(lerp(-0.05 * k, SIUUU.head, th), 0, 0);
  }
  // the held upper-body (and, for the Siuuu, whole-body) poses
  function holdPose(name, t) {
    if (name === 'huddle') {   // leaning in, arms round the neighbours' backs (teammates.js huddle), a little bounce
      const b = Math.abs(Math.sin(t * 7));
      J.spine.rotation.set(0.5, 0, 0); J.head.rotation.set(0.3, 0, 0); J.shL.rotation.set(0.55, 0, 1.2); J.shR.rotation.set(0.55, 0, -1.2);
      J.elL.rotation.set(-0.35, 0, 0); J.elR.rotation.set(-0.35, 0, 0); J.kneeL.rotation.set(0.3, 0, 0); J.kneeR.rotation.set(0.3, 0, 0); J.hips.position.y = 0.86 + 0.05 * b;
    } else if (name === 'applaud') {   // hands up in front, clapping, eyes up to the stands
      const k = 0.5 + 0.5 * Math.sin(t * 13);
      J.shL.rotation.set(-1.15, 0, 0.12 + 0.22 * k); J.shR.rotation.set(-1.15, 0, -0.12 - 0.22 * k); J.elL.rotation.set(-1.05, 0, 0); J.elR.rotation.set(-1.05, 0, 0); J.head.rotation.set(-0.15, 0, 0);
    } else if (name === 'siuuu') { siuuuLand(9); J.spine.rotation.x += 0.012 * Math.sin(t * 2.2); }   // the landing stance, settled, breathing
  }

  // ---- state ----------------------------------------------------------------------------------------------------------------------------------------
  let anchor = { x: 0, z: 0 }, mover = null, backT = null;
  const S = { h: 0, faceTo: null, phase: 0, speed: 0, turnV: 0, rho: 1, lx: null, lz: null, mode: 'auto', act: null, hold: null, holdW: 0, prevHold: null, xf: 1, cut: false };
  const offset = { x: 0, z: 0 };
  const fwd = (h) => [Math.sin(h), Math.cos(h)], rightOf = (h) => [-Math.cos(h), Math.sin(h)];   // the figure's forward and its own right
  function moveFigure(carry, x, z) { if (carry) mover?.(x, z); else { offset.x = x; offset.z = z; } }
  function endAct(a) { if (S.act !== a) return; tl.cancel(a.tw); S.act = null; S.mode = 'auto'; }

  // A strike on the run (strike()): the body keeps moving (the caller moves the feet point). The swing starts when the left (plant) foot will be mid-stance at
  // contact, so it is down as the right boot meets the ball; it then runs KICK.swing to contact and on through a follow-through step (k to 1.5).
  function advanceStrike(a, dt) {
    if (a.wait) {
      a.w += dt;
      const Lc = cycle(S.speed), SH = Math.min(GAIT.stance, Lc * 0.26), duty = clamp(2 * SH / Lc, 0.15, 0.6);
      const q = ((S.phase + S.speed * KICK.swing * KICK_CONTACT / Lc * TAU) / TAU) % 1, e = ((q - duty / 2 + 1.5) % 1) - 0.5;   // the left foot's cycle position at contact, off mid-stance
      if ((a.e !== null && a.e < 0 && e >= 0 && e - a.e < 0.5) || a.w > 1) a.wait = false;
      a.e = e; return;
    }
    a.t += dt; a.k = a.t / KICK.swing;
    if (!a.contacted && a.k >= KICK_CONTACT) { a.contacted = true; a.onContact?.(); }
    if (a.k >= 1.5) { if (S.act === a) { S.act = null; S.mode = 'auto'; } a.onDone?.(); }
  }

  function step(dt) {
    const t = world.sim.t, x = anchor.x + offset.x, z = anchor.z + offset.z, cut = S.cut;
    if (S.lx === null || cut) { S.lx = x; S.lz = z; S.cut = false; if (cut) unpin(); }   // a cut: re-plant here, keep the stride speed
    const dx = x - S.lx, dz = z - S.lz, d = Math.hypot(dx, dz);
    S.lx = x; S.lz = z;
    const owned = S.act?.kind === 'siuuu' && S.act.ph !== 'run';   // the jump owns the heading (the half turn in the air)
    if (dt > 0 && !cut) {
      if (d > Math.max(1.2, 15 * dt)) { S.speed = 0; S.turnV = 0; unpin(); }   // a jump (teleport, staged view, a cut): no stride, no turn
      else {
        const h0 = S.h;
        S.speed += (d / dt - S.speed) * (1 - Math.exp(-14 * dt));
        if (owned) { /* heading set by the act */ } else if (d / dt > 0.4) { S.h = lerpAngle(S.h, Math.atan2(dx, dz), 1 - Math.exp(-GAIT.turn * dt)); S.faceTo = null; }
        else if (S.faceTo !== null) S.h = lerpAngle(S.h, S.faceTo, 1 - Math.exp(-6 * dt));
        // the turn steps too: turnStep metres of stride per radian of heading change (that is what moves the feet on an in-place turn)
        const turn = Math.abs(Math.atan2(Math.sin(S.h - h0), Math.cos(S.h - h0))) * GAIT.turnStep;
        S.turnV += (turn / dt - S.turnV) * (1 - Math.exp(-14 * dt));
        if (d + turn > 1e-5) S.rho += (d / (d + turn) - S.rho) * (1 - Math.exp(-10 * dt));
        S.phase = (S.phase + (d + turn) / cycle(S.speed) * TAU) % (TAU * 1000);
      }
    }
    root.position.set(x, GAIT.lift, z); root.rotation.y = S.h;

    // idle (the taker's sway plus a slow breath), the gait over it by speed (and turn rate), then the act (kick / celebration) and the holds
    neutral(); idlePose(J, t); J.spine.rotation.x += 0.012 * Math.sin(t * 1.7); J.hips.position.y += 0.003 * Math.sin(t * 1.7);
    const g = smooth01(0.03, 0.4, S.speed + S.turnV);   // the IK gait takes over early: a blend with the idle slides the planted feet
    if (g > 0) { save(bufA); neutral(); gaitPose(S.phase, S.speed, S.rho); mixFrom(bufA, g); } else unpin();
    const a = S.act;
    if (a?.run) advanceStrike(a, dt);
    if (a && a.kind === 'kick' && a.k > 0 && a.run) {   // a strike on the run: the right leg and the upper body swing, the left leg keeps running (the plant foot) and the hips keep the gait's height
      save(bufA); neutral(); kickPose(J, a.k); mixFrom(bufA, smooth01(0, 0.25, a.k) * (1 - smooth01(0.85, 1.5, a.k)));
      for (const k of ['hipL', 'kneeL', 'footL']) { const i = JN.indexOf(k); J[k].rotation.set(bufA[3 * i], bufA[3 * i + 1], bufA[3 * i + 2]); }
      J.hips.position.y = bufA[NB - 1];
    } else if (a && a.kind === 'kick' && a.k > 0) { save(bufA); neutral(); kickPose(J, a.k); mixFrom(bufA, smooth01(0, 0.12, a.k) * (1 - smooth01(0.92, 1, a.k) * 0.6)); }
    if (a && a.kind === 'celebrate') {
      const w = smooth01(0, 0.15, a.u) * (1 - smooth01(0.85, 1, a.u)); save(bufB);
      J.shL.rotation.set(-0.25, 0, 1.35 + 0.1 * Math.sin(t * 9)); J.shR.rotation.set(-0.25, 0, -1.35 - 0.1 * Math.sin(t * 9)); J.elL.rotation.set(-0.1, 0, 0); J.elR.rotation.set(-0.1, 0, 0);
      J.spine.rotation.z = -a.dir * 0.18; J.head.rotation.x = -0.2;
      mixFrom(bufB, w);
    }
    if (a && a.kind === 'siuuu' && a.ph !== 'run') {   // the jump and the landing: the whole body, taking over from the run within the first 15% of the air time
      save(bufA); neutral();
      if (a.ph === 'air') siuuuAir(a.v); else siuuuLand(a.tL);
      mixFrom(bufA, a.ph === 'air' ? smooth01(0, 0.15, a.v) : 1);
      root.position.y += a.y;
    }
    S.holdW = clamp(S.holdW + (S.hold && !a ? 1 : -1) * dt * 3.5, 0, 1);
    if (S.xf < 1) { S.xf = Math.min(1, S.xf + dt * 2.8); if (S.xf >= 1) S.prevHold = null; }
    if (S.holdW > 0 && S.holdName) {
      const w = smoother(S.holdW) * (S.holdName === 'siuuu' ? 1 : 1 - g); save(bufB);
      if (S.prevHold && S.xf < 1) { holdPose(S.prevHold, t); save(bufC); mixFrom(bufB, 0); holdPose(S.holdName, t); mixFrom(bufC, smoother(S.xf)); }   // one hold into the next
      else holdPose(S.holdName, t);
      mixFrom(bufB, w);
    }
  }

  const api = {
    object: root, joints: J, offset, GAIT, KICK,
    step,
    bind({ pos, move }) { anchor = pos; mover = move; S.lx = null; },
    snap(h) { S.h = h; S.faceTo = null; S.lx = null; unpin(); },
    face(h) { S.faceTo = h; },
    get heading() { return S.h; },
    get phase() { return S.phase; },
    // where the feet stand so that a kick with this run-up along heading h meets a ball at (x, z)
    kickFrom: kickStart,
    walkBack(dur, h) {
      tl.cancel(backT); const x0 = offset.x, z0 = offset.z;
      backT = tl.tween(dur, (u) => { const e = smoother(u); offset.x = x0 * (1 - e); offset.z = z0 * (1 - e); }, () => { backT = null; if (h !== undefined) S.faceTo = h; });
      return backT;
    },
    kickAt(B, o = {}) {
      const ux = B.x - (anchor.x + offset.x), uz = B.z - (anchor.z + offset.z), d = Math.hypot(ux, uz);
      const f = Math.sqrt(Math.max(1e-6, d * d - CONTACT.right * CONTACT.right));
      S.h = Math.atan2(ux, uz) + Math.atan2(CONTACT.right, f); S.faceTo = null;   // the ball ends up CONTACT.right to the figure's right
      return api.kick({ ...o, runUp: Math.max(0, f - CONTACT.fwd) });
    },
    // a strike on the move: the caller keeps moving the feet point; the swing waits for the plant foot, then contacts ~0.29 s later
    strike({ onContact, onDone } = {}) {
      if (S.act) endAct(S.act); tl.cancel(backT); backT = null;
      const a = { kind: 'kick', run: true, wait: true, k: 0, t: 0, w: 0, e: null, contacted: false, onContact, onDone };
      S.act = a; S.mode = 'kick'; return a;
    },
    // 0..1 = how far a strike on the run is to contact (1 from contact on); -1 = none, or still waiting for the plant foot
    get strikeU() { const a = S.act; return a?.run && !a.wait ? Math.min(1, a.k / KICK_CONTACT) : -1; },
    kick({ runUp = 0, carry = false, onContact, onDone } = {}) {
      if (S.act) endAct(S.act); tl.cancel(backT); backT = null;
      const h = S.h, [fx, fz] = fwd(h), base = carry ? [anchor.x, anchor.z] : [offset.x, offset.z];
      const tRun = runUp > 0 ? runUp / KICK.runUpSpeed : 0, total = tRun + KICK.swing;
      const a = { kind: 'kick', k: 0, contacted: false, tw: null };
      S.act = a; S.mode = 'kick';
      a.tw = tl.tween(total, (u) => {
        if (S.act !== a) return;
        const t = u * total;
        if (t < tRun) { const v = t / tRun, e = 0.5 * v + 0.5 * v * v; moveFigure(carry, base[0] + fx * runUp * e, base[1] + fz * runUp * e); a.k = 0; return; }   // accelerating into the ball
        if (runUp > 0 && !a.ran) { a.ran = true; moveFigure(carry, base[0] + fx * runUp, base[1] + fz * runUp); }
        a.k = clamp((t - tRun) / KICK.swing, 0, 1);
        if (!a.contacted && a.k >= KICK_CONTACT) { a.contacted = true; onContact?.(); }
      }, () => {
        if (S.act === a && !a.contacted) { a.contacted = true; onContact?.(); }   // a finished-early tween still makes contact once
        if (S.act === a) { S.act = null; S.mode = 'auto'; }
        onDone?.();
      });
      return a.tw;
    },
    celebrate({ dir = 1, carry = false, dur = CELEBRATE.dur, onDone } = {}) {
      if (S.act) endAct(S.act); tl.cancel(backT); backT = null;
      const h = S.h, [fx, fz] = fwd(h), [rx, rz] = rightOf(h), base = carry ? [anchor.x, anchor.z] : [offset.x, offset.z], R = CELEBRATE.radius * Math.min(1, dur / CELEBRATE.dur);
      const a = { kind: 'celebrate', u: 0, dir, tw: null };
      S.act = a; S.mode = 'celebrate';
      a.tw = tl.tween(dur, (u) => {
        if (S.act !== a) return;
        a.u = u; const phi = CELEBRATE.angle * smoother(u), f = R * Math.sin(phi), s = dir * R * (1 - Math.cos(phi));
        moveFigure(carry, base[0] + fx * f + rx * s, base[1] + fz * f + rz * s);
      }, () => { if (S.act === a) { S.act = null; S.mode = 'auto'; } onDone?.(); });
      return a.tw;
    },
    // the Siuuu jump (see the header). face = the heading it lands on (forward = (sin h, cos h)); the half turn goes the `turn` way round to it
    siuuu({ take = 0, air = SIUUU.air, hold = 0.8, face, turn = 1, onLand, onDone } = {}) {
      if (S.act) endAct(S.act); tl.cancel(backT); backT = null; S.hold = false; S.holdW = 0; S.prevHold = null; S.xf = 1;
      const a = { kind: 'siuuu', ph: 'run', v: 0, tL: 0, y: 0, h0: null, sweep: 0, landed: false, tw: null }, total = take + air + hold, H = GRAV * air * air / 8;
      const end = face ?? S.h + turn * Math.PI;
      S.act = a; S.mode = 'siuuu';
      const takeOff = () => { if (a.h0 !== null) return; a.h0 = S.h; let dd = Math.atan2(Math.sin(end - S.h), Math.cos(end - S.h)); if (turn > 0 && dd < 0) dd += TAU; if (turn < 0 && dd > 0) dd -= TAU; a.sweep = dd; };
      const land = () => { if (a.landed) return; a.landed = true; onLand?.(); };
      a.tw = tl.tween(total, (u) => {
        if (S.act !== a) return;
        const t = u * total;
        if (t < take) { a.ph = 'run'; return; }
        takeOff(); S.faceTo = null;
        if (t < take + air) { const v = (t - take) / air; a.ph = 'air'; a.v = v; a.y = 4 * H * v * (1 - v); S.h = a.h0 + a.sweep * smoother(clamp((v - 0.05) / 0.85, 0, 1)); return; }
        a.ph = 'land'; a.v = 1; a.y = 0; a.tL = t - take - air; S.h = end; land();
      }, () => {
        if (S.act === a) { S.act = null; S.mode = 'auto'; S.h = end; S.faceTo = null; S.hold = true; S.holdName = 'siuuu'; S.holdW = 1; }   // the pose stays (the 'siuuu' hold)
        land(); onDone?.();
      }, { skip: true });
      if (reducedMotion()) tl.finish(a.tw);   // reduced motion: straight to the held pose
      return a.tw;
    },
    cut() { S.cut = true; },
    setPose(name = null) {
      if (name && S.hold && S.holdName && S.holdName !== name && S.holdW > 0) { S.prevHold = S.holdName; S.xf = 0; }   // cross-fade from the current hold
      S.hold = !!name; if (name) S.holdName = name;
    },
    setName,
    // fold the figure's offset into the feet point (roam calls this before it moves the guest); returns the offset that was folded
    takeOffset() { tl.cancel(backT); backT = null; const o = { x: offset.x, z: offset.z }; offset.x = 0; offset.z = 0; return o; },
    clearOffset() { tl.cancel(backT); backT = null; offset.x = 0; offset.z = 0; S.lx = null; },
    reset() {
      if (S.act) endAct(S.act); tl.cancel(backT); backT = null;
      S.act = null; S.mode = 'auto'; S.hold = false; S.holdW = 0; S.holdName = null; S.prevHold = null; S.xf = 1; S.cut = false; S.faceTo = null; S.speed = 0; S.turnV = 0; S.rho = 1; S.phase = 0; S.lx = null; unpin();
      offset.x = 0; offset.z = 0; setName('');
    },
    state: () => ({ x: +root.position.x.toFixed(3), z: +root.position.z.toFixed(3), heading: +S.h.toFixed(4), speed: +S.speed.toFixed(3), phase: +S.phase.toFixed(4), mode: S.mode, pose: S.hold ? S.holdName : null, siuuu: S.act?.kind === 'siuuu' ? S.act.ph : null, air: +(root.position.y - GAIT.lift).toFixed(3), name: shown, offset: [+offset.x.toFixed(3), +offset.z.toFixed(3)] }),
  };
  setName('');
  return api;
}
