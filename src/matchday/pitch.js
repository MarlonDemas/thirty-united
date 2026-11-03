// Pitch (grass + painted-in markings), goals with ripple-able nets, LED ad boards, dugouts, corner flags.
import * as THREE from 'three';
import { D } from './dims.js';
import { EVENT, KIT_HEX, TITLE_UC, THEME, fontCss } from './config.js';
import { loadTex, canvasTex, makePath, polyline, Geo, Beams, V } from './util.js';

const PW = 82.6, PL = 119.6;               // grass plane (pitch 68 x 105 plus run-off out to the stand wall)
const PPM = 20;

function markingsTexture() {
  return canvasTex(Math.round(PW * PPM), Math.round(PL * PPM), (c, w, h) => {
    const X = (x) => (x + PW / 2) * PPM, Z = (z) => (z + PL / 2) * PPM;
    // mown stripes: R channel = brightness multiplier, one band per 5.25 m of pitch length
    for (let z0 = -PL / 2; z0 < PL / 2; z0 += 0.25) {
      const b = Math.floor((z0 + 52.5) / 5.25); const dark = ((b % 2) + 2) % 2;
      c.fillStyle = dark ? 'rgb(190,0,0)' : 'rgb(255,0,0)'; c.fillRect(0, Z(z0), w, 0.25 * PPM + 1);
    }
    // markings: G channel = line mask
    c.strokeStyle = 'rgb(200,255,0)'; c.fillStyle = 'rgb(200,255,0)'; c.lineWidth = 0.12 * PPM; c.lineJoin = 'miter';
    const line = (x0, z0, x1, z1) => { c.beginPath(); c.moveTo(X(x0), Z(z0)); c.lineTo(X(x1), Z(z1)); c.stroke(); };
    c.strokeRect(X(-34), Z(-52.5), 68 * PPM, 105 * PPM);
    line(-34, 0, 34, 0);
    c.beginPath(); c.arc(X(0), Z(0), 9.15 * PPM, 0, Math.PI * 2); c.stroke();
    const dot = (x, z, r) => { c.beginPath(); c.arc(X(x), Z(z), r * PPM, 0, Math.PI * 2); c.fill(); };
    dot(0, 0, 0.11);
    for (const s of [-1, 1]) {
      const gz = s * 52.5;
      c.strokeRect(X(-20.16), Z(s < 0 ? gz : gz - 16.5), 40.32 * PPM, 16.5 * PPM);
      c.strokeRect(X(-9.16), Z(s < 0 ? gz : gz - 5.5), 18.32 * PPM, 5.5 * PPM);
      const sz = s * 41.5; dot(0, sz, 0.11);
      const ang = Math.acos((16.5 - 11) / 9.15), toward = s < 0 ? Math.PI / 2 : -Math.PI / 2;
      c.beginPath(); c.arc(X(0), Z(sz), 9.15 * PPM, toward - ang, toward + ang); c.stroke();
      for (const sx of [-1, 1]) { // corner arcs, r = 1 m, quarter facing the pitch
        const a0 = sx < 0 ? (s < 0 ? 0 : -Math.PI / 2) : (s < 0 ? Math.PI / 2 : Math.PI);
        c.beginPath(); c.arc(X(sx * 34), Z(gz), 1 * PPM, a0, a0 + Math.PI / 2); c.stroke();
      }
    }
  }, { srgb: false });
}

function netGeometry() {
  // Goal faces +z (pitch side); net hangs behind (-z). Depth 2.2 m at the ground, 1.0 m at the crossbar.
  const W = 7.32, H = 2.44, Db = 2.2, Dt = 1.0, cell = 0.12;
  const pos = [], uv = [], idx = [], dir = [];
  const panel = (p00, p10, p01, p11, nu, nv, d, uvScale) => {
    const o = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv;
      const p = [0, 1, 2].map((k) => (p00[k] * (1 - u) + p10[k] * u) * (1 - v) + (p01[k] * (1 - u) + p11[k] * u) * v);
      pos.push(...p); uv.push(u * uvScale[0], v * uvScale[1]); dir.push(...d);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = o + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, e = c + 1; idx.push(a, b, e, a, e, c); }
  };
  const hw = W / 2;
  // back panel: bottom-back to top-back
  panel([-hw, 0, -Db], [hw, 0, -Db], [-hw, H, -Dt], [hw, H, -Dt], 36, 14, [0, 0.35, -1], [W / cell, Math.hypot(H, Db - Dt) / cell]);
  // top panel
  panel([-hw, H, 0], [hw, H, 0], [-hw, H, -Dt], [hw, H, -Dt], 36, 5, [0, 1, -0.2], [W / cell, Dt / cell]);
  // side panels
  for (const s of [-1, 1]) panel([s * hw, 0, 0], [s * hw, 0, -Db], [s * hw, H, 0], [s * hw, H, -Dt], 12, 14, [s, 0, -0.2], [Db / cell, H / cell]);
  const g = new THREE.BufferGeometry();
  const P = new THREE.Float32BufferAttribute(pos, 3); P.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', P); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); g.userData = { base: new Float32Array(pos), dir: new Float32Array(dir) };
  g.computeBoundingSphere(); g.boundingSphere.radius += 2;
  return g;
}

export function buildGoal(sign) {
  const g = new THREE.Group(); g.name = sign < 0 ? 'goalNorth' : 'goalSouth';
  const W = 7.32, H = 2.44, t = 0.12;
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.35, metalness: 0.1 });
  const frame = new Beams(); const hw = W / 2;
  frame.add(V(-hw, 0, 0), V(-hw, H, 0), t, t); frame.add(V(hw, 0, 0), V(hw, H, 0), t, t); frame.add(V(-hw - t / 2, H, 0), V(hw + t / 2, H, 0), t, t);
  for (const s of [-1, 1]) { frame.add(V(s * hw, H, 0), V(s * hw, 0.0, -2.2), 0.05, 0.05); frame.add(V(s * hw, H, 0), V(s * hw, H, -1.0), 0.05, 0.05); frame.add(V(s * hw, 0.02, -2.2), V(s * hw, 0.02, 0), 0.05, 0.05); frame.add(V(s * hw, H, -1.0), V(s * hw, 0.0, -2.2), 0.04, 0.04); }
  frame.add(V(-hw, 0.02, -2.2), V(hw, 0.02, -2.2), 0.05, 0.05);
  g.add(frame.build(white));
  // net
  const cv = canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 9; c.strokeRect(0, 0, w, h); }, { srgb: false, repeat: [1, 1] });
  cv.wrapS = cv.wrapT = THREE.RepeatWrapping; cv.anisotropy = 8;
  const geo = netGeometry();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: cv, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false, roughness: 1, emissive: 0x333333 });
  const net = new THREE.Mesh(geo, mat); net.castShadow = false; net.receiveShadow = false; net.renderOrder = 2; g.add(net);
  const ripples = [];
  const api = {
    group: g, net, z: sign * D.halfL, width: W, height: H,
    // the mouth of the goal in world coordinates (centre of the plane between the posts)
    mouth: { center: V(0, H / 2, sign * D.halfL), halfWidth: W / 2, height: H },
    // impact: x (m, + is towards +x world), y (m up). strength 0..1+
    ripple(strength = 1, x = 0, y = 1.2) { const lx = sign < 0 ? x : -x; ripples.push({ t0: api._t, x: lx, y, amp: 0.55 * strength }); api._active = true; },
    _t: 0, _active: false,
    update(t) {
      api._t = t; if (!api._active) return;
      const pos = geo.attributes.position, base = geo.userData.base, dir = geo.userData.dir;
      for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > 3.2) ripples.splice(i, 1);
      for (let i = 0; i < pos.count; i++) {
        const bx = base[3 * i], by = base[3 * i + 1], bz = base[3 * i + 2]; let w = 0;
        for (const r of ripples) {
          const tau = t - r.t0, d = Math.hypot(bx - r.x, by - r.y, 0);
          const front = Math.max(0, Math.min(1, (tau - d / 7) / 0.08));
          w += r.amp * Math.exp(-d * d / (2 * 1.15 * 1.15)) * Math.exp(-1.9 * tau) * Math.cos(12 * tau - 3.4 * d) * front;
        }
        pos.setXYZ(i, bx + dir[3 * i] * w, by + dir[3 * i + 1] * w, bz + dir[3 * i + 2] * w);
      }
      pos.needsUpdate = true; if (!ripples.length) api._active = false;
    },
  };
  g.position.set(0, 0, sign * D.halfL); if (sign > 0) g.rotation.y = Math.PI;
  return api;
}

function dugout(color, label) {
  const g = new THREE.Group(); const W = 6.0, Dp = 2.2;
  const steel = new THREE.MeshStandardMaterial({ color: 0x40464e, metalness: 0.8, roughness: 0.4 });
  const team = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  const perspex = new THREE.MeshPhysicalMaterial({ color: 0xcfe4ee, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const b = new Beams();
  for (const x of [-W / 2, 0, W / 2]) { b.add(V(x, 0, -Dp / 2), V(x, 1.9, -Dp / 2), 0.1, 0.1); }
  for (const x of [-W / 2, W / 2]) b.add(V(x, 0, Dp / 2 + 0.3), V(x, 1.7, Dp / 2 + 0.3), 0.09, 0.09);
  b.add(V(-W / 2, 1.9, -Dp / 2), V(W / 2, 1.9, -Dp / 2), 0.1, 0.1); b.add(V(-W / 2, 1.7, Dp / 2 + 0.3), V(W / 2, 1.7, Dp / 2 + 0.3), 0.1, 0.1);
  for (const x of [-W / 2, W / 2]) b.add(V(x, 1.9, -Dp / 2), V(x, 1.7, Dp / 2 + 0.3), 0.08, 0.08);
  g.add(b.build(steel));
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, 1.7, 0.08), new THREE.MeshStandardMaterial({ color: 0x1b2027, roughness: 0.7 })); back.position.set(0, 0.95, -Dp / 2 - 0.04); g.add(back);
  const side = (s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(Dp + 0.3, 1.7), perspex); m.rotation.y = Math.PI / 2; m.position.set(s * W / 2, 0.9, 0.15); g.add(m); }; side(-1); side(1);
  const roofLen = Math.hypot(Dp + 0.3, 0.2);
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, roofLen), perspex); roof.rotation.x = -Math.PI / 2 + Math.atan2(0.2, Dp + 0.3); roof.position.set(0, 1.8, 0.15); g.add(roof);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.12, 0.1), team); edge.position.set(0, 1.74, Dp / 2 + 0.38); g.add(edge);
  // bench
  const bench = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.08, 0.5), team); bench.position.set(0, 0.45, -Dp / 2 + 0.45); g.add(bench);
  const benchBack = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.5, 0.06), team); benchBack.position.set(0, 0.75, -Dp / 2 + 0.2); g.add(benchBack);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), new THREE.MeshStandardMaterial({ map: canvasTex(512, 116, (c, w, h) => { c.fillStyle = '#' + new THREE.Color(color).getHexString(); c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = fontCss(800, 80); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, w / 2, h / 2 + 4); }), roughness: 0.6 }));
  lab.position.set(0, 1.4, -Dp / 2 + 0.01); g.add(lab);
  g.traverse((o) => { if (o.isMesh || o.isInstancedMesh) { o.castShadow = o.material !== perspex; o.receiveShadow = true; } });
  return g;
}

export function buildPitch() {
  const group = new THREE.Group(); group.name = 'pitch';
  const bloom = [];
  // ---- grass --------------------------------------------------------------------------------------------------
  const rx = PW / 3.0, ry = PL / 3.0;
  const f = (k, srgb) => loadTex(`/world/textures/leafy_grass/${k}_1k.jpg`, { srgb, rx, ry, aniso: 16 });
  const arm = f('arm');
  const mat = new THREE.MeshPhysicalMaterial({ map: f('diff', true), normalMap: f('nor_gl'), aoMap: arm, roughnessMap: arm, color: 0x88c060, roughness: 1, specularIntensity: 0.2, envMapIntensity: 0.6 });
  const mk = markingsTexture(); mk.anisotropy = 16; mk.minFilter = THREE.LinearMipmapLinearFilter;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uMk = { value: mk };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPUv;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvPUv = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vPUv;\nuniform sampler2D uMk;')
      .replace('#include <map_fragment>', '#include <map_fragment>\nvec4 mkv = texture2D(uMk, vPUv);\ndiffuseColor.rgb = mix(diffuseColor.rgb * (0.28 + 0.9 * mkv.r), vec3(0.78), clamp(mkv.g, 0.0, 1.0));');
  };
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL), mat); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; pitch.name = 'pitch'; group.add(pitch);

  // ---- goals ----------------------------------------------------------------------------------------------------
  const goalN = buildGoal(-1), goalS = buildGoal(+1); group.add(goalN.group, goalS.group);

  // ---- LED ad boards (accent colour) ------------------------------------------------------------------------------
  {
    const { hx, hz, R } = D.bowl; const off = 1.3;
    const path = makePath(hx - off, hz - off, R - off);
    const pl = polyline(path, { lineStep: 2, arcSteps: 24 });
    const front = new Geo(), body = new Geo(); const H = 0.9, tile = 6.0;
    for (let i = 0; i < pl.length - 1; i++) {
      const v0 = pl[i], v1 = pl[i + 1]; if (v1.s - v0.s < 1e-4) continue;
      if (v0.piece === 'S' && v1.piece === 'S' && ((v0.x + v1.x) / 2) ** 2 < 25) continue;
      const nx = v0.nx + v1.nx, nz = v0.nz + v1.nz, l = Math.hypot(nx, nz) || 1, n = [nx / l, 0, nz / l];
      const A = [v0.x, 0.0, v0.z], B = [v1.x, 0.0, v1.z], A2 = [v0.x, H, v0.z], B2 = [v1.x, H, v1.z];
      const k = (v) => v.s / tile;
      front.quad(A, B, B2, A2, n, [[k(v0), 0], [k(v1), 0], [k(v1), 1], [k(v0), 1]]);
      const bk = 0.1; const Ab = [A[0] - n[0] * bk, 0, A[2] - n[2] * bk], Bb = [B[0] - n[0] * bk, 0, B[2] - n[2] * bk], A2b = [A2[0] - n[0] * bk, H, A2[2] - n[2] * bk], B2b = [B2[0] - n[0] * bk, H, B2[2] - n[2] * bk];
      body.quad(A2, B2, B2b, A2b, [0, 1, 0]); body.quad(Ab, Bb, B2b, A2b, [-n[0], 0, -n[2]]);
    }
    const ledTex = canvasTex(1536, 230, (c, w, h) => {
      c.fillStyle = EVENT.kits.home; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; c.font = fontCss(800, 118); c.textBaseline = 'middle'; c.textAlign = 'center';
      c.fillText(TITLE_UC, w * 0.3, h / 2 + 4);
      c.font = fontCss(700, 70); c.fillText(EVENT.led, w * 0.78, h / 2 - 28); c.fillStyle = THEME.color.scoreboardAccent; c.fillText(EVENT.shortDate, w * 0.78, h / 2 + 52);
      c.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 0; x < w; x += 6) c.fillRect(x, 0, 2, h); for (let y = 0; y < h; y += 6) c.fillRect(0, y, w, 2);
      c.fillStyle = '#fff'; c.fillRect(w - 6, 0, 6, h);
    });
    const led = new THREE.Mesh(front.build(), new THREE.MeshStandardMaterial({ color: 0x180000, map: ledTex, emissiveMap: ledTex, emissive: 0xffffff, emissiveIntensity: 1.15, roughness: 0.4 }));
    const bd = new THREE.Mesh(body.build(), new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.6 }));
    led.castShadow = bd.castShadow = true; group.add(led, bd); bloom.push(led); led.name = 'adBoards';
  }

  // ---- dugouts ---------------------------------------------------------------------------------------------------
  const home = dugout(KIT_HEX.home, 'HOME'), away = dugout(KIT_HEX.away, 'AWAY');
  for (const [d, z] of [[home, 8], [away, -8]]) { d.position.set(-37.4, 0, z); d.rotation.y = Math.PI / 2; group.add(d); }

  // ---- corner flags -----------------------------------------------------------------------------------------------
  const flags = [];
  {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.4 });
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xffd23a, roughness: 0.7, side: THREE.DoubleSide });
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.38, 0.14); sh.lineTo(0, 0.28); sh.lineTo(0, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.5, 8), poleMat); pole.position.set(sx * 34, 0.75, sz * 52.5);
      const pivot = new THREE.Group(); pivot.position.set(sx * 34, 1.22, sz * 52.5);
      const cloth = new THREE.Mesh(new THREE.ShapeGeometry(sh), flagMat); cloth.position.set(0.008, 0, 0); pivot.add(cloth);
      pole.castShadow = true; cloth.castShadow = true; group.add(pole, pivot); flags.push({ pivot, ph: sx * 1.3 + sz * 0.7 });
    }
  }

  const spot = { north: V(0, 0, -41.5), south: V(0, 0, 41.5) };
  return {
    group, bloom, pitch, goals: { north: goalN, south: goalS }, dugouts: { home, away }, flags, penaltySpot: spot.north, penaltySpots: spot,
    update(t) {
      goalN.update(t); goalS.update(t);
      for (const f of flags) f.pivot.rotation.y = Math.sin(t * 1.7 + f.ph) * 0.25 + (f.ph > 0 ? 0 : Math.PI);
    },
  };
}
