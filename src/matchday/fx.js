// Full-time effects: instanced confetti and fireworks. Seeded (mulberry32), analytic in time (every position is a pure function of the
// effect clock), so they advance deterministically with the sim clock and stay cheap (1500 confetti + ~2k firework sparks, 6 draw calls).
// Fireworks use emissive materials and are added to the bloom selection, so they glow.
import * as THREE from 'three';
import { mulberry32, reducedMotion } from './util.js';
import { KIT_HEX } from './config.js';

const BURST_COLORS = [0xff3b30, 0xffd23a, 0xfff4e0, 0x4aa8ff, 0x57ff9a];
const CONFETTI_COLORS = [KIT_HEX.home, 0xf4f4f0, 0xffd23a, KIT_HEX.away, 0xff7a45, 0x57d68d];

export function createFx(world, { onBang } = {}) {
  const { scene, bloom } = world;
  const rng = mulberry32(20261212);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const group = new THREE.Group(); group.name = 'fx'; scene.add(group);

  // ---- confetti ---------------------------------------------------------------------------------------------------------
  const NC = 1500;
  const cGeo = new THREE.PlaneGeometry(0.13, 0.08);
  const cMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x222222 });
  const conf = new THREE.InstancedMesh(cGeo, cMat, NC); conf.frustumCulled = false; conf.castShadow = false; conf.visible = false; conf.name = 'confetti';
  const C = [], col = new THREE.Color();
  for (let i = 0; i < NC; i++) {
    C.push({
      x0: (rng() * 2 - 1) * 33, z0: -(rng() * 2 - 1) * 48 - 0, y0: 14 + rng() * 12, vx: (rng() * 2 - 1) * 1.2, vz: (rng() * 2 - 1) * 1.2,
      fall: 1.1 + rng() * 0.9, wob: 0.6 + rng() * 1.2, w: 3 + rng() * 6, ph: rng() * 6.283, delay: rng() * 4, spin: [(rng() * 2 - 1) * 7, (rng() * 2 - 1) * 7, (rng() * 2 - 1) * 7],
      rx: rng() * 6.283, ry: rng() * 6.283, rz: rng() * 6.283,
    });
    conf.setColorAt(i, col.setHex(CONFETTI_COLORS[Math.floor(rng() * CONFETTI_COLORS.length)]));
    conf.setMatrixAt(i, ZERO);
  }
  conf.instanceColor.needsUpdate = true; group.add(conf);

  // ---- fireworks --------------------------------------------------------------------------------------------------------
  const NB = 20, NP = 110, DRAG = 1.5, GRAV = 7, LIFE = 3.3, RISE = 1.15;
  const dirs = [];                                   // Fibonacci sphere, jittered
  for (let i = 0; i < NP; i++) { const y = 1 - 2 * (i + 0.5) / NP, r = Math.sqrt(1 - y * y), a = i * 2.399963; dirs.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
  const bursts = [];
  for (let i = 0; i < NB; i++) {
    const north = i < 14, az = north ? (rng() * 2 - 1) * 1.3 : rng() * Math.PI * 2, dist = 95 + rng() * 40;
    bursts.push({
      c: i % 5, t0: 0.4 + i * 0.9 + rng() * 0.5, cx: Math.sin(az) * dist, cy: 62 + rng() * 34, cz: -Math.cos(az) * dist,
      speed: 22 + rng() * 8, size: 1.2 + rng() * 0.6, sparks: dirs.map((d) => [d[0] + (rng() - 0.5) * 0.12, d[1] + (rng() - 0.5) * 0.12, d[2] + (rng() - 0.5) * 0.12, 0.75 + rng() * 0.25]),
      banged: false, hidden: true,
    });
  }
  const fwMeshes = BURST_COLORS.map((hex) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: hex, emissiveIntensity: 7, roughness: 1 }));
  const sGeo = new THREE.IcosahedronGeometry(1, 0), meshes = [];
  const perColor = BURST_COLORS.map((_, c) => bursts.filter((b) => b.c === c));
  perColor.forEach((list, c) => {
    const m = new THREE.InstancedMesh(sGeo, fwMeshes[c], Math.max(1, list.length * (NP + 1))); m.frustumCulled = false; m.castShadow = false; m.visible = false; m.name = 'fireworks' + c;
    list.forEach((b, k) => { b.mesh = m; b.off = k * (NP + 1); });
    for (let i = 0; i < m.count; i++) m.setMatrixAt(i, ZERO);
    group.add(m); bloom.selection.add(m); meshes.push(m);
  });

  const state = { confetti: false, fireworks: false, tC: 0, tF: 0 };
  const hideBurst = (b) => { if (b.hidden) return; for (let i = 0; i <= NP; i++) b.mesh.setMatrixAt(b.off + i, ZERO); b.mesh.instanceMatrix.needsUpdate = true; b.hidden = true; };

  function stepConfetti() {
    const t = state.tC;
    for (let i = 0; i < NC; i++) {
      const c = C[i], tau = t - c.delay;
      if (tau < 0) continue;
      let y = c.y0 - c.fall * tau; const air = y > 0.04; if (!air) y = 0.04;
      const ta = air ? tau : (c.y0 - 0.04) / c.fall;   // freeze horizontal motion once landed
      const x = c.x0 + c.vx * ta + Math.sin(c.w * ta + c.ph) * c.wob * 0.5, z = c.z0 + c.vz * ta + Math.cos(c.w * ta + c.ph) * c.wob * 0.5;
      e.set(c.rx + c.spin[0] * ta, c.ry + c.spin[1] * ta, c.rz + c.spin[2] * ta);
      if (!air) e.set(-Math.PI / 2, 0, c.rz);
      conf.setMatrixAt(i, m4.compose(p.set(x, y, z), q.setFromEuler(e), s.set(1, 1, 1)));
    }
    conf.instanceMatrix.needsUpdate = true;
  }

  function stepFireworks() {
    const t = state.tF;
    for (const b of bursts) {
      const tau = t - b.t0;
      if (tau < -RISE || tau > LIFE) { hideBurst(b); continue; }
      b.hidden = false; const mesh = b.mesh;
      if (tau < 0) {                                   // rocket rising from the roof line to the burst point
        const u = 1 + tau / RISE, ee = 1 - (1 - u) * (1 - u);
        mesh.setMatrixAt(b.off, m4.compose(p.set(b.cx, 28 + (b.cy - 28) * ee, b.cz), q.identity(), s.setScalar(0.7 * b.size)));
        for (let i = 1; i <= NP; i++) mesh.setMatrixAt(b.off + i, ZERO);
      } else {
        if (!b.banged) { b.banged = true; onBang?.(); }
        mesh.setMatrixAt(b.off, ZERO);
        const k = (1 - Math.exp(-DRAG * tau)) / DRAG, fade = Math.max(0, 1 - tau / LIFE), tw = 0.75 + 0.25 * Math.sin(tau * 31);
        for (let i = 0; i < NP; i++) {
          const sp = b.sparks[i], v = b.speed * sp[3];
          const sc = b.size * Math.pow(fade, 0.8) * tw * (tau < 0.08 ? tau / 0.08 : 1);
          mesh.setMatrixAt(b.off + 1 + i, m4.compose(p.set(b.cx + sp[0] * v * k, b.cy + sp[1] * v * k - 0.5 * GRAV * tau * tau * 0.35, b.cz + sp[2] * v * k), q.identity(), s.setScalar(sc)));
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  const api = {
    group, state,
    startConfetti() { if (reducedMotion()) return; state.confetti = true; state.tC = 0; conf.visible = true; },
    startFireworks() { if (reducedMotion()) return; state.fireworks = true; state.tF = 0; for (const b of bursts) b.banged = false; for (const m of meshes) m.visible = true; },
    stop() {
      state.confetti = state.fireworks = false; state.tC = state.tF = 0; conf.visible = false; for (const m of meshes) m.visible = false;
      for (let i = 0; i < NC; i++) conf.setMatrixAt(i, ZERO); conf.instanceMatrix.needsUpdate = true; for (const b of bursts) { b.banged = false; hideBurst(b); }
    },
    step(dt) {
      if (state.confetti) { state.tC += dt; stepConfetti(); if (state.tC > 26) { state.confetti = false; conf.visible = false; } }
      if (state.fireworks) { state.tF += dt; stepFireworks(); if (state.tF > NB * 0.9 + LIFE + 2) { state.fireworks = false; for (const m of meshes) m.visible = false; } }
    },
    stats: { confetti: NC, sparks: NB * (NP + 1), drawCalls: 1 + BURST_COLORS.length },
  };
  return api;
}
