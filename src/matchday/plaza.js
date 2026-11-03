// Entrance plaza (south): asphalt, brick-and-steel gatehouse with a floodlit "KICK-OFF ARENA" sign, street lamps, and the turnstile bank split into
// two ENDS: HOME END (home red, x < 0) and AWAY END (away navy, x > 0), each with a floodlit lightbox sign, a kiosk and its own open turnstile.
import * as THREE from 'three';
import { D } from './dims.js';
import { EVENT, VENUE_UC, THEME, KIT_HEX, fontCss } from './config.js';
import { pbr, canvasTex, normalFromHeight, Geo, Beams, V, mulberry32 } from './util.js';
import { loadModel } from './loadModel.js';

function brickTextures() {
  const rng = mulberry32(99);
  const W = 1152, H = 960, bw = W / 10, bh = H / 24;
  const height = document.createElement('canvas'); height.width = W; height.height = H; const hc = height.getContext('2d');
  hc.fillStyle = '#000'; hc.fillRect(0, 0, W, H);
  const colour = canvasTex(W, H, (c) => {
    c.fillStyle = '#9a9288'; c.fillRect(0, 0, W, H); // mortar
    const pal = ['#8c3d2b', '#7d3526', '#9a4a33', '#6f2f23', '#a35538', '#85402e', '#74382a'];
    for (let r = 0; r < 24; r++) for (let k = -1; k < 11; k++) {
      const x = k * bw + (r % 2 ? bw / 2 : 0) + 2, y = r * bh + 2, w = bw - 4, h = bh - 4;
      c.fillStyle = pal[Math.floor(rng() * pal.length)]; c.globalAlpha = 0.85 + rng() * 0.15; c.fillRect(x, y, w, h); c.globalAlpha = 1;
      hc.fillStyle = `rgb(${150 + Math.floor(rng() * 105)},0,0)`; hc.fillRect(x, y, w, h);
      for (let n = 0; n < 6; n++) { c.fillStyle = `rgba(${rng() < 0.5 ? '0,0,0' : '255,220,190'},${0.04 + rng() * 0.06})`; c.fillRect(x + rng() * w, y + rng() * h, 6 + rng() * 22, 3 + rng() * 6); }
    }
  });
  const normal = new THREE.CanvasTexture(normalFromHeight(height, 2.2));
  for (const t of [colour, normal]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  return { colour, normal };
}

// Ground shading in world space, so the big flat grounds (car park, verge) read as a surface with form from the aerial view and never show their texture tile:
//   - the albedo is sampled at two scales and blended by low-frequency noise (breaks the repeat grid; `anti`),
//   - brightness drifts by +/- amp across `big` / `small` metre noise (patchy wear),
//   - gain lifts the albedo (the 1k maps are very dark at dusk sun elevation),
//   - a warm floodlight pool of strength `pool` over radius `poolR` m around the stadium centre.
// Deterministic (hash noise, no randomness).
function macroVariation(mat, { amp = 0.25, big = 90, small = 23, gain = 1, pool = 0, poolR = 170, anti = true, key = 'macro' } = {}) {
  for (const t of [mat.map, mat.normalMap, mat.aoMap]) if (t) t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;   // no hard seam at the tile edge
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMacroP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvMacroP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vMacroP;
float mvH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float mvN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mvH(i), mvH(i + vec2(1.0, 0.0)), f.x), mix(mvH(i + vec2(0.0, 1.0)), mvH(i + vec2(1.0, 1.0)), f.x), f.y); }`)
      .replace('#include <map_fragment>', `
float mvn = mvN(vMacroP.xz / ${big.toFixed(1)}) * 0.6 + mvN(vMacroP.xz / ${small.toFixed(1)} + 7.3) * 0.4;
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D(map, vMapUv);
  ${anti ? 'sampledDiffuseColor = mix(sampledDiffuseColor, texture2D(map, vMapUv * 0.37 + vec2(0.31, 0.17)), smoothstep(0.3, 0.7, mvN(vMacroP.xz / 41.0 + 3.1)));' : ''}
  diffuseColor *= sampledDiffuseColor;
#endif
float mvPool = ${pool.toFixed(3)} * exp(-dot(vMacroP.xz, vMacroP.xz) / (2.0 * ${poolR.toFixed(1)} * ${poolR.toFixed(1)}));
diffuseColor.rgb *= ${gain.toFixed(3)} * (1.0 + ${amp.toFixed(3)} * (mvn - 0.5) * 2.0) * mix(vec3(1.04, 0.99, 0.92), vec3(0.95, 0.98, 1.04), mvn) * (1.0 + mvPool * vec3(1.0, 0.85, 0.65));`);
  };
  mat.customProgramCacheKey = () => [key, amp, big, small, gain, pool, poolR, anti].join('|');
  return mat;
}

export async function buildPlaza() {
  const group = new THREE.Group(); group.name = 'plaza'; const bloom = [], lights = [];
  // ---- ground ---------------------------------------------------------------------------------------------------
  // beyond the plaza: a grass verge to the horizon (leafy_grass) around a marked car park (asphalt_02 + painted bays)
  const verge = macroVariation(pbr('leafy_grass', { rx: 2400 / 5, ry: 2400 / 5, color: 0xd2dca0, aniso: 8 }), { amp: 0.3, big: 140, small: 37, gain: 1.5, pool: 0.5, poolR: 220, key: 'verge' });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), verge); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; ground.name = 'ground'; group.add(ground);
  const asphaltFull = macroVariation(pbr('asphalt_02', { rx: 330 / 6, ry: 380 / 6, color: 0xb9b4ae, aniso: 8 }), { amp: 0.3, big: 70, small: 17, gain: 2.2, pool: 0.7, poolR: 150, key: 'asphalt' });
  const carpark = new THREE.Mesh(new THREE.PlaneGeometry(330, 380), asphaltFull); carpark.rotation.x = -Math.PI / 2; carpark.position.set(0, -0.03, 55); carpark.receiveShadow = true; carpark.name = 'carpark'; group.add(carpark);
  // bay lines: 2.5 m bays, two rows back to back with a 6 m aisle (tile = 2.5 x 16 m)
  const bayTex = canvasTex(64, 512, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#ece9e1'; c.fillRect(0, 0, 3, 160); c.fillRect(0, 352, 3, 160); });
  bayTex.repeat.set(330 / 2.5, 230 / 16);
  const bays = new THREE.Mesh(new THREE.PlaneGeometry(330, 230), new THREE.MeshStandardMaterial({ map: bayTex, transparent: true, alphaTest: 0.4, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  bays.rotation.x = -Math.PI / 2; bays.position.set(0, -0.022, -20); bays.receiveShadow = true; group.add(bays);   // bays stop short of the entrance forecourt
  const paveMat = pbr('concrete_floor_02', { rx: 24 / 2.5, ry: 60 / 2.5, color: 0xc4c2bd, desat: 0.8 });
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(24, 60), paveMat); pave.rotation.x = -Math.PI / 2; pave.position.set(0, -0.015, 138); pave.receiveShadow = true; group.add(pave);
  const paveIn = new THREE.Mesh(new THREE.PlaneGeometry(14, 12.6), paveMat); paveIn.rotation.x = -Math.PI / 2; paveIn.position.set(0, 0.02, 101.8); paveIn.receiveShadow = true; group.add(paveIn); // passage floor

  // ---- gatehouse (brick + steel) -------------------------------------------------------------------------------------
  const { colour, normal } = brickTextures();
  const brick = new THREE.MeshStandardMaterial({ map: colour, normalMap: normal, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.85 });
  const g = new Geo(); const TU = 2.25, TV = 1.8;
  const face = (p, n, tx) => g.quad(p[0], p[1], p[2], p[3], n, p.map((q) => [(tx === 'x' ? q[0] : q[2]) / TU, q[1] / TV]));
  const box = (x0, x1, y0, y1, z0, z1, faces) => {
    if (faces.includes('+z')) face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], 'x');
    if (faces.includes('+x')) face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], 'z');
    if (faces.includes('-x')) face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], 'z');
    if (faces.includes('+y')) g.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], [[x0 / TU, z0 / TU], [x1 / TU, z0 / TU], [x1 / TU, z1 / TU], [x0 / TU, z1 / TU]]);
    if (faces.includes('-y')) g.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [[x0 / TU, z0 / TU], [x1 / TU, z0 / TU], [x1 / TU, z1 / TU], [x0 / TU, z1 / TU]]);
  };
  const z0 = 96.5, z1 = 108, gh = D.gateHalf, xo = 29.5, top = 9.0;
  box(-xo, -gh, 0, top, z0, z1, ['+z', '-x', '+x', '+y']);           // left wing
  box(gh, xo, 0, top, z0, z1, ['+z', '-x', '+x', '+y']);             // right wing
  box(-gh, gh, 5.0, top, z0, z1, ['+z', '-y', '+y']);                // header over the passage
  const brickMesh = new THREE.Mesh(g.build(), brick); brickMesh.castShadow = true; brickMesh.receiveShadow = true; group.add(brickMesh);
  // passage ceiling (concrete) is the header's underside above; add a dark concrete ceiling light strip row
  const steel = new THREE.MeshStandardMaterial({ color: 0x3d444c, metalness: 0.85, roughness: 0.4 });
  const steelBright = new THREE.MeshStandardMaterial({ color: 0xb8bfc7, metalness: 0.9, roughness: 0.3 });
  const sb = new Beams();
  for (const x of [-xo, -gh, gh, xo, -18, 18]) sb.box(V(x, 4.5, z1 + 0.18), 0.5, 9.0, 0.35);                     // columns in front of the brick
  sb.box(V(0, 4.95, z1 + 0.2), 2 * xo + 0.6, 0.35, 0.45);                                                          // lintel band
  sb.box(V(0, 9.15, z1 + 0.1), 2 * xo + 0.8, 0.35, 0.9);                                                           // parapet coping
  sb.box(V(0, 5.5, z1 + 3.0), 22, 0.28, 6.0);                                                                      // entrance canopy
  for (const x of [-10.6, 10.6]) sb.box(V(x, 2.7, z1 + 5.6), 0.3, 5.4, 0.3);
  for (const x of [-9, 9]) sb.add(V(x, 8.6, z1), V(x, 5.7, z1 + 3.0), 0.1, 0.1);
  for (const x of [-18, -6, 6, 18]) { sb.box(V(x, 7.0, z1 + 0.06), 4.2, 0.18, 0.12); }                           // steel mullion trim
  group.add(sb.build(steel));
  // passage walls inside are the wings' +x/-x faces (brick). Ceiling lights:
  const pl = new Beams(); for (const z of [99.5, 103, 106.5]) pl.box(V(0, 4.97, z), 1.8, 0.04, 0.5);
  const plm = pl.build(new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff2dc, emissiveIntensity: 3 }), { cast: false, receive: false }); group.add(plm); bloom.push(plm);
  // canopy downlights
  const dl = new Beams(); for (const x of [-8, -4, 0, 4, 8]) dl.box(V(x, 5.34, z1 + 3.0), 0.5, 0.04, 0.5);
  const dlm = dl.build(new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff0d0, emissiveIntensity: 3.5 }), { cast: false, receive: false }); group.add(dlm); bloom.push(dlm);

  // ---- floodlit sign ---------------------------------------------------------------------------------------------
  const signTex = canvasTex(2048, 420, (c, w, h) => {
    c.fillStyle = THEME.color.ink900; c.fillRect(0, 0, w, h);
    c.strokeStyle = EVENT.kits.home; c.lineWidth = 14; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = THEME.color.paper100; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = fontCss(800, 168);
    c.fillText(VENUE_UC, w / 2 + 150, h / 2 - 4);
    // football badge
    c.fillStyle = EVENT.kits.home; c.beginPath(); c.arc(190, h / 2, 100, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(190, h / 2, 76, 0, Math.PI * 2); c.fill();
    c.fillStyle = THEME.color.ink900; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c.lineTo(190 + Math.cos(a) * 42, h / 2 + Math.sin(a) * 42); } c.fill();
  });
  const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.95, metalness: 0 });
  const sw = 26, sh = sw * 420 / 2048, sy = 12.2, sz = z1 - 0.2;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), signMat); sign.position.set(0, sy, sz + 0.28); sign.name = 'sign'; group.add(sign);   // no bloom: the sign stays crisp, lit by its two spotlights
  const back = new THREE.Mesh(new THREE.BoxGeometry(sw + 0.8, sh + 0.8, 0.5), steel); back.position.set(0, sy, sz); back.castShadow = true; group.add(back);
  const sp = new Beams(); for (const x of [-11, -3, 3, 11]) sp.add(V(x, 9.0, sz - 0.2), V(x, sy - sh / 2, sz - 0.1), 0.35, 0.35); group.add(sp.build(steel));
  // lamp arms + spotlights washing the sign
  const lamps = new Beams(); const lampHeads = new Beams();
  for (const x of [-10, -3.3, 3.3, 10]) { const hy = sy + sh / 2 + 0.5; lamps.add(V(x, hy, sz + 0.3), V(x, hy + 0.3, sz + 2.4), 0.12, 0.12); lampHeads.box(V(x, hy + 0.3, sz + 2.5), 0.7, 0.3, 0.45); }
  group.add(lamps.build(steel));
  const lh = lampHeads.build(new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff0d0, emissiveIntensity: 6 }), { cast: false }); group.add(lh); bloom.push(lh);
  for (const x of [-6.6, 6.6]) { const s = new THREE.SpotLight(0xfff0d8, 1100, 0, 0.62, 0.8, 2); s.position.set(x, sy + sh / 2 + 0.8, sz + 2.6); s.target.position.set(x * 0.4, sy - 0.8, sz); s.castShadow = false; group.add(s, s.target); lights.push(s); }

  // ---- turnstile bank ---------------------------------------------------------------------------------------------
  const zt = 103; const turn = new THREE.Group(); turn.name = 'turnstiles'; group.add(turn);
  const stain = new THREE.MeshStandardMaterial({ color: 0xc7ccd2, metalness: 0.95, roughness: 0.28 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.5, metalness: 0.4 });
  const xs = [-3.75, -2.25, -0.75, 0.75, 2.25, 3.75];
  xs.forEach((x, i) => {
    const hsg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.05, 1.15), stain); hsg.position.set(x, 0.525, zt); hsg.castShadow = true; hsg.receiveShadow = true; turn.add(hsg);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 1.2), dark); cap.position.set(x, 1.075, zt); turn.add(cap);
  });
  const lanes = [];
  const ACTIVE = { 1: 'home', 3: 'away' };   // one open turnstile per END; the centre lane (i = 2) is closed by the divider
  for (let i = 0; i < 5; i++) {
    const cx = -3 + i * 1.5, hx = xs[i + 1]; // right-hand housing of the lane (x greater)
    // reader pod on the right-hand housing, angled to the lane
    const pod = new THREE.Group(); pod.position.set(hx - 0.02, 1.1, zt - 0.3); turn.add(pod);
    const podBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.26), dark); podBody.rotation.x = 0.35; pod.add(podBody);
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.17), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: ACTIVE[i] ? 0xffb020 : 0xff2a1a, emissiveIntensity: ACTIVE[i] ? 3.5 : 1.6, roughness: 0.3 }));
    light.position.set(0, 0.052, 0.0); light.rotation.x = 0.35; pod.add(light); bloom.push(light);
    // tripod arm pivot on the lane-facing side of the right housing; spin it about local z by multiples of 120 degrees
    const arm = new THREE.Group(); arm.position.set(hx - 0.17, 0.92, zt); turn.add(arm);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 14), stain); hub.rotation.x = Math.PI / 2; arm.add(hub);
    for (let k = 0; k < 3; k++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 10), stain); const ang = Math.PI + k * 2 * Math.PI / 3; // k=0 points across the lane (-x)
      bar.position.set(Math.cos(ang) * 0.31, Math.sin(ang) * 0.31, 0); bar.rotation.z = ang - Math.PI / 2 + Math.PI; bar.castShadow = true; arm.add(bar);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), stain); tip.position.set(Math.cos(ang) * 0.62, Math.sin(ang) * 0.62, 0); arm.add(tip);
    }
    lanes.push({ arm, readerLight: light, x: cx, side: ACTIVE[i] || null });
  }
  const mainLane = lanes[2];
  // closed centre lane: a perspex gate panel between the two middle housings
  const perspex = new THREE.MeshPhysicalMaterial({ color: 0xd6e6ee, transparent: true, opacity: 0.35, roughness: 0.08, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const closed = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), perspex); closed.position.set(0, 0.6, zt + 0.2); turn.add(closed);
  // queue rails: the lane divider down the middle (x = 0) and the two outer rails, so each END is its own lane from the plaza to the turnstiles
  const qb = new Beams();
  const rail = (x, za, zb) => { for (let z = za; z <= zb + 1e-6; z += 2) { qb.add(V(x, 0, z), V(x, 1.0, z), 0.07, 0.07); if (z + 2 <= zb + 1e-6) { qb.add(V(x, 1.0, z), V(x, 1.0, z + 2), 0.05, 0.05); qb.add(V(x, 0.55, z), V(x, 0.55, z + 2), 0.04, 0.04); } } };
  rail(0, 104, 130); rail(-5.2, 113, 129); rail(5.2, 113, 129);
  group.add(qb.build(stain));

  // ---- the two ENDS: floodlit lightbox signs under the canopy + a kiosk per lane ----------------------------------------------
  const sides = {};
  const kioskBody = new THREE.MeshStandardMaterial({ color: 0x2b3038, metalness: 0.7, roughness: 0.38 });
  const kioskBrushed = new THREE.MeshStandardMaterial({ color: 0xb9c0c8, metalness: 0.92, roughness: 0.26 });
  const signHang = new Beams(), signLamps = new Beams();
  for (const side of ['home', 'away']) {
    const sx = side === 'home' ? -1 : 1, kit = side === 'home' ? EVENT.kits.home : EVENT.kits.away, kitN = side === 'home' ? KIT_HEX.home : KIT_HEX.away;
    const title = side === 'home' ? 'HOME END' : 'AWAY END', sub = side === 'home' ? "YES, I'LL BE THERE" : "I'LL BE AWAY ON THE DATE";
    // lightbox sign: team-colour face, white type, a steel frame; hung from the canopy on two rods, lamp heads washing it from above
    const tex = canvasTex(1024, 220, (c, w, hh) => {
      c.fillStyle = kit; c.fillRect(0, 0, w, hh);
      const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.18)'); c.fillStyle = g; c.fillRect(0, 0, w, hh);
      c.fillStyle = '#fff'; c.fillRect(0, hh - 10, w, 10);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff'; c.font = fontCss(800, 104); c.fillText(title, w / 2, 86);
      c.font = fontCss(700, 38); c.globalAlpha = 0.86; c.fillText(sub, w / 2, 168); c.globalAlpha = 1;
    });
    const sMat = new THREE.MeshStandardMaterial({ color: 0x202020, map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.5 });
    const sw = 4.4, sh = sw * 220 / 1024, sxp = sx * 2.6, syp = 4.35, szp = 113.55;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), sMat); face.position.set(sxp, syp, szp + 0.09); face.name = side + 'EndSign'; group.add(face); bloom.push(face);
    const box = new THREE.Mesh(new THREE.BoxGeometry(sw + 0.16, sh + 0.16, 0.16), steel); box.position.set(sxp, syp, szp); box.castShadow = true; group.add(box);
    for (const dx of [-1.6, 1.6]) { signHang.add(V(sxp + dx, syp + sh / 2, szp), V(sxp + dx, 5.36, szp), 0.05, 0.05); signLamps.box(V(sxp + dx * 0.9, syp + sh / 2 + 0.16, szp + 0.42), 0.5, 0.12, 0.22); }
    signHang.add(V(sxp - 1.4, syp + sh / 2 + 0.16, szp + 0.42), V(sxp + 1.4, syp + sh / 2 + 0.16, szp + 0.42), 0.04, 0.04);
    // kiosk: brushed-steel pedestal on a plinth, a slanted touch screen (canvas), a team-colour band and a ticket slot. Faces +z (the arriving guest).
    const kx = sx * 3.45, kz = 110.6, kiosk = new THREE.Group(); kiosk.position.set(kx, 0, kz); kiosk.name = side + 'Kiosk'; group.add(kiosk);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.08, 0.62), kioskBody); plinth.position.y = 0.04; kiosk.add(plinth);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.02, 0.42), kioskBrushed); ped.position.y = 0.59; kiosk.add(ped);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.565, 0.1, 0.425), new THREE.MeshStandardMaterial({ color: kitN, roughness: 0.45, emissive: kitN, emissiveIntensity: 0.35 })); band.position.y = 0.9; kiosk.add(band);
    const head = new THREE.Group(); head.position.set(0, 1.18, 0.02); head.rotation.x = -0.55; kiosk.add(head);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.5, 0.07), kioskBody); head.add(bezel);
    const screen = canvasTex(512, 384, (c, w, hh) => {
      c.fillStyle = THEME.color.ink900; c.fillRect(0, 0, w, hh); c.fillStyle = kit; c.fillRect(0, 0, w, 64);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = fontCss(800, 40); c.fillText(title, w / 2, 34);
      c.fillStyle = THEME.color.fog300; c.font = fontCss(600, 26); c.fillText('STATION 1 OF ' + (side === 'home' ? '4' : '1'), w / 2, 118);
      c.fillStyle = THEME.color.fog100; c.font = fontCss(700, 48); c.fillText('Your name,', w / 2, 194); c.fillText('please', w / 2, 250);
      c.fillStyle = THEME.color.fog300; c.font = fontCss(500, 24); c.fillText('then hand in your ticket', w / 2, 326);
    });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.435), new THREE.MeshStandardMaterial({ color: 0x111111, map: screen, emissiveMap: screen, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.25 }));
    scr.position.z = 0.036; head.add(scr); bloom.push(scr);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.05), dark); slot.position.set(0, 0.86, 0.215); kiosk.add(slot);
    kiosk.traverse((o) => { if (o.isMesh) { o.castShadow = o !== scr; o.receiveShadow = true; } });
    const lane = lanes.find((l) => l.side === side);
    sides[side] = {
      side, title, lane, kiosk, screen: scr, sign: face,
      kioskPos: V(kx, 1.25, kz),                     // the screen: what the arriving guest looks at
      stand: [sx * 2.35, 112.5],                     // where the guest stands to use the kiosk (station 1)
      handIn: { pos: [lane.x, 1.7, 108.4], target: [lane.x + 0.75, 1.0, zt - 0.3] },   // the hand-in pose: in the lane, facing that lane's reader
      obstacle: [kx - 0.42, kx + 0.42, kz - 0.34, kz + 0.34],
    };
  }
  group.add(signHang.build(steel));
  const sl = signLamps.build(new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff0d0, emissiveIntensity: 5 }), { cast: false }); group.add(sl); bloom.push(sl);

  // ---- street lamps (Poly Haven street_lamp_01, CC0) ----------------------------------------------------------------
  const lamp = await loadModel('/world/models/street_lamp_01/street_lamp_01.gltf');
  const lampSpots = [[-15, 118, 0], [15, 118, Math.PI], [-15, 134, 0], [15, 134, Math.PI], [-15, 150, 0], [15, 150, Math.PI], [-34, 116, 0], [34, 116, Math.PI]];
  const glow = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffd9a0, emissiveIntensity: 6 });
  const glowBeams = new Beams();
  for (const [x, z, yaw] of lampSpots) {
    const l = lamp.clone(true); l.position.set(x, 0, z); l.rotation.y = yaw; l.scale.setScalar(1.35); group.add(l);
    // lamp head sits at the top of the arm; the Poly Haven lamp's arm points to +x in model space
    const c = Math.cos(yaw), s = Math.sin(yaw); const hxm = 0.0 * 1.35, hy = 3.78 * 1.35;
    glowBeams.box(V(x + (c * hxm), hy, z - s * hxm), 0.5, 0.08, 0.3);
  }
  const gb = glowBeams.build(glow, { cast: false }); group.add(gb); bloom.push(gb);

  return {
    group, bloom, lights, ground,
    turnstile: { group: turn, arm: mainLane.arm, readerLight: mainLane.readerLight, armAxis: 'z', lanes, home: sides.home.lane, away: sides.away.lane, position: V(0, 0, zt), z: zt },
    sides,
    sign, gatehouse: brickMesh,
  };
}
