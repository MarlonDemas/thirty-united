// Instanced low-poly spectators (2 draw calls: lower tier / upper tier). All motion is per-instance in the vertex shader,
// driven by uniforms stepped from the sim clock (O(1) per step, so simStep stays cheap and deterministic).
import * as THREE from 'three';
import { mulberry32, reducedMotion } from './util.js';
import { KIT_HEX } from './config.js';

function spectatorGeometry(detail) {
  const pos = [], idx = [], part = [], tip = [];
  const v = (x, y, z, p, t = 0) => { pos.push(x, y, z); part.push(p); tip.push(t); return pos.length / 3 - 1; };
  // torso: tapered 4-sided frustum, open at the bottom
  {
    const b = [v(-0.19, 0.45, -0.12, 0), v(0.19, 0.45, -0.12, 0), v(0.19, 0.45, 0.12, 0), v(-0.19, 0.45, 0.12, 0)];
    const t = [v(-0.25, 0.98, -0.13, 0), v(0.25, 0.98, -0.13, 0), v(0.25, 0.98, 0.13, 0), v(-0.25, 0.98, 0.13, 0)];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; idx.push(b[i], b[j], t[j], b[i], t[j], t[i]); }
    idx.push(t[0], t[2], t[1], t[0], t[3], t[2]);
  }
  // head
  if (detail === 'high') {
    const hb = [v(-0.1, 0.99, -0.1, 1), v(0.1, 0.99, -0.1, 1), v(0.1, 0.99, 0.1, 1), v(-0.1, 0.99, 0.1, 1)];
    const ht = [v(-0.095, 1.24, -0.095, 1), v(0.095, 1.24, -0.095, 1), v(0.095, 1.24, 0.095, 1), v(-0.095, 1.24, 0.095, 1)];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; idx.push(hb[i], hb[j], ht[j], hb[i], ht[j], ht[i]); }
    idx.push(ht[0], ht[2], ht[1], ht[0], ht[3], ht[2]);
    // legs: thigh slab on top + shin front (knees forward), dark trousers
    const a = v(-0.19, 0.47, 0.0, 4), b = v(0.19, 0.47, 0.0, 4), c = v(0.19, 0.47, 0.36, 4), d = v(-0.19, 0.47, 0.36, 4), e = v(-0.17, 0.02, 0.36, 4), f = v(0.17, 0.02, 0.36, 4);
    idx.push(a, d, c, a, c, b, d, e, c, c, e, f);
  } else {
    const top = v(0, 1.25, 0, 1); const r = [v(-0.12, 1.02, -0.1, 1), v(0.12, 1.02, -0.1, 1), v(0.0, 1.02, 0.13, 1)];
    idx.push(top, r[1], r[0], top, r[2], r[1], top, r[0], r[2]);
  }
  // arms: strips in the XY plane, pivot at the shoulder (shader rotates about z)
  for (const s of [1, -1]) {
    const p = s > 0 ? 2 : 3;
    if (detail === 'high') {
      const a = v(s * 0.235, 0.94, 0.02, p, 0), b = v(s * 0.305, 0.94, 0.02, p, 0), c = v(s * 0.26, 0.70, 0.02, p, 0.5), d = v(s * 0.335, 0.70, 0.02, p, 0.5), e = v(s * 0.27, 0.46, 0.02, p, 1), f = v(s * 0.345, 0.46, 0.02, p, 1);
      idx.push(a, c, b, b, c, d, c, e, d, d, e, f);
    } else {
      const a = v(s * 0.235, 0.94, 0.02, p, 0), b = v(s * 0.305, 0.94, 0.02, p, 0), e = v(s * 0.28, 0.46, 0.02, p, 1), f = v(s * 0.355, 0.46, 0.02, p, 1);
      idx.push(a, e, b, b, e, f);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

const SKIN = [0xf1c7a5, 0xe0a87c, 0xc68a62, 0xa8714d, 0x8a5a3c, 0x6b4430, 0x4a2f22];

export function buildCrowd(seats, uniformsTarget = {}) {
  const rng = mulberry32(424242);
  const uniforms = { uTime: { value: 0 }, uCheerT: { value: -1 }, uWaveT: { value: 0 }, uWaveOn: { value: 0 }, uClap: { value: 0 }, uCalm: { value: 0 } };
  const group = new THREE.Group(); group.name = 'crowd';
  const red = new THREE.Color(KIT_HEX.home), white = new THREE.Color(0xe9e9ec), navy = new THREE.Color(KIT_HEX.away), dark = new THREE.Color(0x2a2d33), black = new THREE.Color(0x14151a);
  const mkMat = () => {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
attribute float aPart; attribute float aTip; attribute vec3 aShirt; attribute vec3 aSkin; attribute vec3 aScarf; attribute vec2 aRnd;
uniform float uTime; uniform float uCheerT; uniform float uWaveT; uniform float uWaveOn; uniform float uClap; uniform float uCalm;
varying vec3 vCrowd;`).replace('#include <begin_vertex>', `
float seed = aRnd.x; float tt = uTime + seed * 40.0;
float cheerEnv = 0.0;
if (uCheerT >= 0.0 && uCheerT < 3.0) cheerEnv = smoothstep(0.0, 0.3, uCheerT) * (1.0 - smoothstep(2.3, 3.0, uCheerT));
float waveEnv = 0.0;
if (uWaveOn > 0.5) { float w = fract(uWaveT / 16.0 - aRnd.y); waveEnv = smoothstep(0.0, 0.012, w) * (1.0 - smoothstep(0.035, 0.07, w)); }
float mv = 1.0 - uCalm;   // reduced motion: no bob, jump or sway, arms hold a still pose
float jump = (cheerEnv * abs(sin((uCheerT * 2.4 + seed * 2.0) * 3.14159)) * (0.16 + 0.12 * fract(seed * 7.0)) + waveEnv * 0.32) * mv;
float lean = (sin(tt * 1.7) * 0.02 + cheerEnv * sin(tt * 9.0) * 0.035) * mv;
vec3 transformed = vec3(position);
transformed.y += 0.012 * sin(tt * 2.3) * mv + jump;
transformed.x += lean * position.y;
if (aPart > 0.5 && aPart < 1.5) { transformed.z += 0.015 * sin(tt * 1.3 + 1.0) * mv; transformed.y += cheerEnv * 0.02 * sin(tt * 12.0) * mv; }
if (aPart > 1.5 && aPart < 3.5) {
  float sgn = aPart < 2.5 ? 1.0 : -1.0;
  vec3 pivot = vec3(sgn * 0.27, 0.94, 0.0);
  float idleA = 0.1 + 0.07 * sin(tt * 1.9 + sgn) * mv;
  idleA = mix(idleA, -0.5 - 0.35 * sin(tt * 13.0 + seed * 3.0) * mv, uClap);
  float up = max(cheerEnv, waveEnv * 0.85);
  float ang = mix(idleA, 2.75 + 0.25 * sin(tt * 10.0 + seed * 20.0 + sgn) * mv, up);
  float th = sgn * ang; float c = cos(th), s = sin(th);
  vec3 p = position - pivot; vec3 r = vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
  transformed = r + pivot; transformed.y += 0.012 * sin(tt * 2.3) * mv + jump; transformed.x += lean * position.y;
}
vec3 col = aShirt;
if (aPart > 0.5 && aPart < 1.5) col = aSkin; else if (aPart > 3.5) col = mix(vec3(0.02, 0.03, 0.07), vec3(0.09, 0.075, 0.05), fract(seed * 13.0)); else if (aPart > 1.5) col = mix(aShirt, aScarf, smoothstep(0.6, 0.75, aTip));
vCrowd = col;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCrowd;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vCrowd;');
    };
    return m;
  };
  const make = (list, detail, name) => {
    const g = spectatorGeometry(detail); const n = list.length;
    const aShirt = new Float32Array(n * 3), aSkin = new Float32Array(n * 3), aScarf = new Float32Array(n * 3), aRnd = new Float32Array(n * 2);
    const mesh = new THREE.InstancedMesh(g, mkMat(), n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
    list.forEach((st, i) => {
      const sc = 0.9 + rng() * 0.2; m4.compose(p.set(st.x, st.y, st.z), q.setFromAxisAngle(up, st.yaw), s.set(sc, sc * (0.96 + rng() * 0.1), sc)); mesh.setMatrixAt(i, m4);
      const r = rng(); const shirt = r < 0.78 ? red : r < 0.9 ? white : r < 0.96 ? navy : dark;
      c.copy(shirt).multiplyScalar(0.8 + rng() * 0.35); aShirt.set([c.r, c.g, c.b], i * 3);
      c.setHex(SKIN[Math.floor(rng() * SKIN.length)]).multiplyScalar(0.85 + rng() * 0.2); aSkin.set([c.r, c.g, c.b], i * 3);
      const sr = rng(); const scarf = shirt === red ? (sr < 0.7 ? white : black) : (sr < 0.7 ? red : white); c.copy(scarf); aScarf.set([c.r, c.g, c.b], i * 3);
      aRnd[2 * i] = rng(); aRnd[2 * i + 1] = st.phase;
    });
    g.setAttribute('aShirt', new THREE.InstancedBufferAttribute(aShirt, 3)); g.setAttribute('aSkin', new THREE.InstancedBufferAttribute(aSkin, 3));
    g.setAttribute('aScarf', new THREE.InstancedBufferAttribute(aScarf, 3)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(aRnd, 2));
    mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = false; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.name = name;
    mesh.userData.trisEach = g.index.count / 3;
    return mesh;
  };
  const lower = [], upper = [];
  for (const s of seats) { if (rng() < (s.tier === 0 ? 0.84 : 0.70)) (s.tier === 0 ? lower : upper).push(s); }
  const mLower = make(lower, 'high', 'crowdLower'), mUpper = make(upper, 'low', 'crowdUpper');
  group.add(mLower, mUpper);

  // ---- sim-clock driven state ---------------------------------------------------------------------------------------
  const st = { t: 0, cheerT: -1, waveT: 0, waveLeft: 0, clapLeft: 0 };
  const api = {
    group, meshes: [mLower, mUpper], uniforms, count: lower.length + upper.length,
    triangles: lower.length * mLower.userData.trisEach + upper.length * mUpper.userData.trisEach,
    // 3 s jump-and-cheer burst, scarves up. `at` seconds into the burst (default 0), e.g. to freeze a mid-cheer frame.
    cheer(at = 0) { st.cheerT = at; },
    // Mexican wave around the bowl; seconds = how long it keeps going (one lap = 16 s). wave(false) stops it.
    wave(seconds = 32) { if (seconds === false || seconds <= 0 || reducedMotion()) { st.waveLeft = 0; uniforms.uWaveOn.value = 0; } else { st.waveLeft = seconds; st.waveT = 0; uniforms.uWaveOn.value = 1; } },
    // polite applause (AWAY branch), arms clapping for `seconds`
    applaud(seconds = 4) { st.clapLeft = seconds; },
    step(dt) {
      st.t += dt; uniforms.uTime.value = st.t; uniforms.uCalm.value = reducedMotion() ? 1 : 0;
      if (st.cheerT >= 0) { st.cheerT += dt; if (st.cheerT > 3.0) st.cheerT = -1; }
      uniforms.uCheerT.value = st.cheerT;
      if (st.waveLeft > 0) { st.waveT += dt; st.waveLeft -= dt; if (st.waveLeft <= 0) uniforms.uWaveOn.value = 0; }
      uniforms.uWaveT.value = st.waveT;
      if (st.clapLeft > 0) { st.clapLeft -= dt; uniforms.uClap.value = Math.min(1, st.clapLeft * 2); } else uniforms.uClap.value = 0;
    },
    get state() { return { ...st }; },
  };
  return api;
}
