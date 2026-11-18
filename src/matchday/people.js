// Code-built footballers (goalkeeper + penalty taker) with a jointed hierarchy, plus the ball (truncated-icosahedron pattern).
import * as THREE from 'three';
import { KIT_HEX } from './config.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function capsule(r, len, m, sx = 1, sz = 1) { const g = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 5, 14), m); g.scale.set(sx, 1, sz); g.castShadow = true; g.receiveShadow = true; return g; }
function ball(r, m, sy = 1) { const g = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); g.scale.y = sy; g.castShadow = true; g.receiveShadow = true; return g; }

export function buildFootballer({ shirt, shorts, socks, skin = 0xc68a62, hair = 0x1b1410, gloves = null, boots = 0x111111, longSleeves = false, name = 'player' }) {
  const mShirt = mat(shirt, { roughness: 0.78 }), mShorts = mat(shorts, { roughness: 0.82 }), mSocks = mat(socks, { roughness: 0.9 }), mSkin = mat(skin, { roughness: 0.6 });
  const mHair = mat(hair, { roughness: 0.9 }), mBoot = mat(boots, { roughness: 0.35, metalness: 0.1 }), mGlove = mat(gloves ?? skin, { roughness: gloves ? 0.55 : 0.6 });
  const root = new THREE.Group(); root.name = name;
  const hips = new THREE.Group(); hips.position.y = 0.92; root.add(hips);
  // pelvis / shorts
  const pel = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.19, 0.27, 18), mShorts); pel.scale.z = 0.72; pel.position.y = -0.04; pel.castShadow = true; hips.add(pel);
  const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine);
  const torso = capsule(0.165, 0.32, mShirt, 1.12, 0.68); torso.position.y = 0.30; spine.add(torso);
  const chest = ball(0.19, mShirt, 0.55); chest.scale.set(1.0, 0.55, 0.62); chest.position.y = 0.52; chest.castShadow = true; spine.add(chest);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.1, 12), mSkin); neck.position.y = 0.67; spine.add(neck);
  const head = new THREE.Group(); head.position.y = 0.79; spine.add(head);
  const skull = ball(0.108, mSkin, 1.12); skull.scale.set(0.92, 1.12, 1.0); head.add(skull);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.113, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mHair); cap.scale.set(0.93, 1.13, 1.02); cap.rotation.x = -0.25; cap.position.y = 0.012; cap.castShadow = true; head.add(cap);
  const nose = ball(0.018, mSkin); nose.position.set(0, -0.005, 0.108); head.add(nose);
  for (const s of [-1, 1]) { const eye = ball(0.012, mat(0x120d0a)); eye.position.set(s * 0.036, 0.022, 0.097); head.add(eye); const ear = ball(0.02, mSkin); ear.position.set(s * 0.1, -0.005, 0); head.add(ear); }
  const joints = { root, hips, spine, head };
  // arms
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.215, 0.56, 0); spine.add(sh);
    const up = capsule(0.047, 0.2, longSleeves ? mShirt : mShirt, 1, 1); up.position.y = -0.14; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
    const fore = capsule(0.04, 0.19, longSleeves ? mShirt : mSkin); fore.position.y = -0.13; el.add(fore);
    const hand = ball(gloves ? 0.062 : 0.04, mGlove); hand.scale.set(1, 1.1, 0.8); hand.position.y = -0.3; el.add(hand);
    if (gloves) { const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.05, 12), mat(0x111111)); cuff.position.y = -0.255; el.add(cuff); }
    joints[s < 0 ? 'shR' : 'shL'] = sh; joints[s < 0 ? 'elR' : 'elL'] = el;   // left = +x side when facing +z? (facing +z, the figure's own left is +x)
  }
  // legs
  for (const s of [-1, 1]) {
    const hp = new THREE.Group(); hp.position.set(s * 0.095, -0.05, 0); hips.add(hp);
    const thigh = capsule(0.078, 0.28, mSkin); thigh.position.y = -0.22; hp.add(thigh);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.115, 0.26, 14), mShorts); sleeve.position.y = -0.13; sleeve.castShadow = true; hp.add(sleeve);
    const kn = new THREE.Group(); kn.position.y = -0.44; hp.add(kn);
    const shin = capsule(0.052, 0.3, mSocks); shin.position.y = -0.22; kn.add(shin);
    const foot = new THREE.Group(); foot.position.y = -0.43; kn.add(foot);
    const boot = ball(0.055, mBoot); boot.scale.set(1.0, 0.8, 2.6); boot.position.set(0, -0.03, 0.06); foot.add(boot);
    joints[s < 0 ? 'hipR' : 'hipL'] = hp; joints[s < 0 ? 'kneeR' : 'kneeL'] = kn;
  }
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root, joints, mats: { shirt: mShirt, shorts: mShorts, socks: mSocks } };   // the kit materials: avatar.js recolours them in place (setKit)
}

const rot = (o, x = 0, y = 0, z = 0) => o.rotation.set(x, y, z);

// Goalkeeper: stands on the goal line facing +z (towards the pitch). Dive sides are SCREEN directions as seen by the
// penalty taker looking north: 'diveLeft' = world -x, 'diveRight' = world +x.
export function buildKeeper() {
  const fig = buildFootballer({ shirt: 0xe8c400, shorts: 0x15171b, socks: 0x15171b, gloves: 0xf2f2f2, boots: 0x1c1c1c, longSleeves: true, skin: 0xa87050, hair: 0x15100c, name: 'keeper' });
  const J = fig.joints, home = { x: 0, z: 0 };
  const api = {
    object: fig.root, joints: J, reach: 3.7, // approx. lateral reach of a full dive from the centre of the goal (m)
    pose: 'idle', t: 0,
    // 'idle' (t = sim seconds: sways on the line), 'diveLeft' | 'diveRight' (t = 0..1 dive progress, clamps at 1)
    setPose(pose, t = 0) {
      api.pose = pose; api.t = t;
      rot(J.root); J.root.position.set(home.x, 0, home.z);
      if (pose === 'diveLeft' || pose === 'diveRight') {
        const side = pose === 'diveRight' ? 1 : -1, tt = clamp01(t), p = ease(tt);
        const lift = Math.sin(Math.PI * clamp01(tt * 1.05)) * 0.85;
        J.root.position.set(home.x + side * 2.05 * p, 0.12 * p + lift, home.z + 0.15 * p);
        rot(J.root, 0, 0, -side * (0.2 + 1.2 * p));
        rot(J.spine, 0.05, 0, 0); rot(J.head, 0, 0, side * 0.25 * p);
        J.shL.rotation.set(0, 0, 0.35 + 2.5 * p); J.shR.rotation.set(0, 0, -0.35 - 2.5 * p);
        J.elL.rotation.set(-0.1, 0, 0); J.elR.rotation.set(-0.1, 0, 0);
        J.hipL.rotation.set(-0.2 * p, 0, 0.1 + 0.25 * p * side); J.hipR.rotation.set(0.15 * p, 0, -0.1 + 0.25 * p * side);
        J.kneeL.rotation.set(0.5 * p, 0, 0); J.kneeR.rotation.set(0.7 * p, 0, 0);
        J.hips.position.y = 0.92; rot(J.hips);
        return;
      }
      // idle: wide crouch, hands up and forward, side-shuffle along the line
      const sway = Math.sin(t * 1.3) * 0.38, step = Math.sin(t * 2.6), bob = Math.sin(t * 5.2) * 0.008;
      J.root.position.x = home.x + sway; J.root.rotation.z = -Math.cos(t * 1.3) * 0.03;
      J.hips.position.y = 0.85 + bob; rot(J.hips);
      rot(J.spine, 0.22, 0, 0); rot(J.head, -0.12, Math.sin(t * 0.7) * 0.12, 0);
      J.shL.rotation.set(-0.85, 0, 0.42); J.shR.rotation.set(-0.85, 0, -0.42);
      J.elL.rotation.set(-0.9, 0, 0); J.elR.rotation.set(-0.9, 0, 0);
      J.hipL.rotation.set(-0.4 + step * 0.1, 0, 0.18); J.hipR.rotation.set(-0.4 - step * 0.1, 0, -0.18);
      J.kneeL.rotation.set(0.8 + Math.max(0, step) * 0.12, 0, 0); J.kneeR.rotation.set(0.8 + Math.max(0, -step) * 0.12, 0, 0);
    },
    setHome(x, z) { home.x = x; home.z = z; },
  };
  api.setPose('idle', 0);
  return api;
}

// The taker's kick (t = 0..1, kicking leg = the figure's right): wind-up to t 0.45, swing through by 0.75; the foot meets the ball at ~KICK_CONTACT.
// Sets the legs, arms, spine and hip height only: callers zero the other joints first. Shared by the taker and the guest's avatar (avatar.js).
export const KICK_CONTACT = 0.57;
export function kickPose(J, t) {
  const tt = clamp01(t), back = clamp01(tt / 0.45), fwd = clamp01((tt - 0.45) / 0.3), swing = ease(fwd);
  const hipR = 0.9 * back * (1 - fwd) - 1.0 * swing, kneeR = 1.35 * back * (1 - swing) + 0.15 * swing;
  J.hipR.rotation.set(hipR, 0, -0.05); J.kneeR.rotation.set(kneeR, 0, 0);
  J.hipL.rotation.set(-0.12, 0, 0.05); J.kneeL.rotation.set(0.2, 0, 0);
  rot(J.spine, 0.15 * back - 0.1 * swing, 0.15 * swing, 0);
  J.shL.rotation.set(0.5 * back - 0.4 * swing, 0, 0.55); J.shR.rotation.set(-0.5 * back + 0.5 * swing, 0, -0.5);
  J.elL.rotation.set(-0.3, 0, 0); J.elR.rotation.set(-0.3, 0, 0);
  J.hips.position.y = 0.91;
}
// The taker's idle (t = sim seconds): a slow sway of the upper body, arms loose.
export function idlePose(J, t) {
  const sw = Math.sin(t * 1.1) * 0.03;
  rot(J.spine, 0.05, sw, 0);
  J.shL.rotation.set(0, 0, 0.12); J.shR.rotation.set(0, 0, -0.12);
  J.elL.rotation.set(-0.25, 0, 0); J.elR.rotation.set(-0.25, 0, 0);
  J.hipL.rotation.set(0, 0, 0.04); J.hipR.rotation.set(0, 0, -0.04);
  J.kneeL.rotation.set(0.05, 0, 0); J.kneeR.rotation.set(0.05, 0, 0);
}

// Penalty taker: faces -z (towards the north goal). pose 'idle' (t = sim seconds) or 'kick' (t = 0..1, kicking leg = the figure's right).
export function buildTaker() {
  const fig = buildFootballer({ shirt: KIT_HEX.home, shorts: 0xf2f2f2, socks: KIT_HEX.home, boots: 0xf0f0f0, skin: 0xd9a477, hair: 0x2a1a10, name: 'taker' });
  const J = fig.joints; fig.root.rotation.y = Math.PI;
  const api = {
    object: fig.root, joints: J, pose: 'idle',
    setPose(pose, t = 0) {
      api.pose = pose;
      for (const k of ['root', 'hips', 'spine', 'head']) if (k !== 'root') J[k].rotation.set(0, 0, 0);
      J.hips.position.y = 0.92;
      if (pose === 'kick') { kickPose(J, t); return; }
      idlePose(J, t);
    },
  };
  api.setPose('idle', 0);
  return api;
}

// Ball: real 0.22 m diameter. Pattern = a true truncated icosahedron (12 black pentagons, 20 white hexagons, seams), coloured per vertex on a fine sphere.
export function buildBall() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const unit = (v) => new THREE.Vector3(...v).normalize();
  const pent = [], hexa = [];
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) { pent.push(unit([0, s1, s2 * phi]), unit([s1, s2 * phi, 0]), unit([s2 * phi, 0, s1])); }
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) hexa.push(unit([x, y, z]));
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) { hexa.push(unit([0, s1 / phi, s2 * phi]), unit([s1 / phi, s2 * phi, 0]), unit([s2 * phi, 0, s1 / phi])); }
  // truncated icosahedron vertices (even permutations) -> face-plane distances
  const verts = []; const cyc = (a, b, c) => [[a, b, c], [b, c, a], [c, a, b]];
  const add = (a, b, c) => { for (const sa of [-1, 1]) for (const sb of [-1, 1]) for (const sc of [-1, 1]) for (const p of cyc(a * sa, b * sb, c * sc)) verts.push(new THREE.Vector3(...p).normalize()); };
  add(0, 1, 3 * phi); add(1, 2 + phi, 2 * phi); add(phi, 2, 2 * phi + 1);
  const planeDist = (n, k) => verts.map((v) => v.dot(n)).sort((a, b) => b - a).slice(0, k).reduce((s, x) => s + x, 0) / k;
  const dP = planeDist(pent[0], 5), dH = planeDist(hexa[0], 6);
  const faces = [...pent.map((n) => ({ n, d: dP, p: true })), ...hexa.map((n) => ({ n, d: dH, p: false }))];
  const geo = new THREE.IcosahedronGeometry(0.11, 24);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), u = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    u.fromBufferAttribute(pos, i).normalize();
    let s1 = -9, s2 = -9, f1 = null;
    for (const f of faces) { const s = u.dot(f.n) / f.d; if (s > s1) { s2 = s1; s1 = s; f1 = f; } else if (s > s2) s2 = s; }
    if (s1 - s2 < 0.006) c.setHex(0x6b6b6b); else c.setHex(f1.p ? 0x0e0e10 : 0xf3f3f0);
    col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.0 }));
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'ball'; mesh.position.set(0, 0.11, -41.5);
  return mesh;
}
