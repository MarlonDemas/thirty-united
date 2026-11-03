// Shared helpers: seeded RNG, PBR texture loading, rounded-rectangle bowl path, instanced beams.
import * as THREE from 'three';

export const mulberry32 = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ---- user preferences: read once, here ------------------------------------------------------------------------
// Reduced motion: the OS setting (read live), or ?motion=reduce / ?motion=full to force it (testing).
const URL_Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const MQ_REDUCE = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
export const reducedMotion = () => (URL_Q.get('motion') === 'reduce' ? true : URL_Q.get('motion') === 'full' ? false : !!MQ_REDUCE?.matches);
// Lite tier: <= 4 cores, Save-Data, or ?lite. DPR 1, no ambient occlusion, 2048 shadow map, no high-performance GPU hint.
export const LITE = URL_Q.has('lite') || (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency <= 4 || !!navigator.connection?.saveData));

// ---- textures -------------------------------------------------------------------------------------------------
const pending = [];
const tl = new THREE.TextureLoader();
export const texturesReady = () => Promise.all(pending);   // rejects if any texture failed to load (main.js then shows the fast-lane page)
export function loadTex(url, { srgb = false, rx = 1, ry = 1, aniso = 8 } = {}) {
  let t;
  const p = new Promise((res, rej) => { t = tl.load(url, () => res(), undefined, () => rej(new Error('texture failed to load: ' + url))); });
  p.catch(() => {});   // texturesReady() reports it; this only keeps an early failure from logging as unhandled
  pending.push(p);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Poly Haven 1k set (diff, nor_gl, arm = ao/rough/metal). rx/ry = repeats over the mesh's UV range.
export function pbr(slug, { rx = 1, ry = 1, color = 0xffffff, normalScale = 1, roughness = 1, metalness = 0, side, aniso = 8, desat = 0 } = {}) {
  const f = (k, srgb) => loadTex(`/world/textures/${slug}/${k}_1k.jpg`, { srgb, rx, ry, aniso });
  const arm = f('arm');
  const m = new THREE.MeshStandardMaterial({
    map: f('diff', true), normalMap: f('nor_gl'), normalScale: new THREE.Vector2(normalScale, normalScale),
    aoMap: arm, roughnessMap: arm, metalnessMap: arm, color, roughness, metalness,
  });
  if (side !== undefined) m.side = side;
  if (desat > 0) {
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), ${desat.toFixed(3)});`); };
    m.customProgramCacheKey = () => 'desat' + desat;
  }
  return m;
}
export function canvasTex(w, h, draw, { srgb = true, repeat } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(...repeat);
  t.userData = { canvas: c, ctx, drawnAt: performance.now() };
  return t;
}
// height canvas -> tangent-space normal map canvas (sobel)
export function normalFromHeight(srcCanvas, strength = 2) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const src = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const octx = out.getContext('2d'); const img = octx.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x - 1, y) + H(x - 1, y + 1));
    const dy = (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x, y - 1) + H(x + 1, y - 1));
    let nx = -dx * strength, ny = dy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * w + x) * 4; img.data[i] = (nx * 0.5 + 0.5) * 255; img.data[i + 1] = (ny * 0.5 + 0.5) * 255; img.data[i + 2] = (nz * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  octx.putImageData(img, 0, 0); return out;
}

// ---- rounded-rectangle path ------------------------------------------------------------------------------------
// Pieces run: S (+z straight, x from +a to -a), arc(-x,+z), W (-x straight), arc(-x,-z), N (-z straight), arc(+x,-z), E (+x straight), arc(+x,+z).
// n = inward normal (towards the pitch). Offsetting outward by d keeps the same normals: p(d) = p - n*d.
export function makePath(hx, hz, R) {
  const a = hx - R, b = hz - R, q = Math.PI / 2;
  const pieces = [
    { id: 'S', type: 'line', p0: [a, hz], p1: [-a, hz], n: [0, -1] },
    { id: 'A1', type: 'arc', c: [-a, b], th0: q, th1: 2 * q },
    { id: 'W', type: 'line', p0: [-hx, b], p1: [-hx, -b], n: [1, 0] },
    { id: 'A2', type: 'arc', c: [-a, -b], th0: 2 * q, th1: 3 * q },
    { id: 'N', type: 'line', p0: [-a, -hz], p1: [a, -hz], n: [0, 1] },
    { id: 'A3', type: 'arc', c: [a, -b], th0: 3 * q, th1: 4 * q },
    { id: 'E', type: 'line', p0: [hx, -b], p1: [hx, b], n: [-1, 0] },
    { id: 'A4', type: 'arc', c: [a, b], th0: 0, th1: q },
  ];
  let s0 = 0;
  for (const p of pieces) { p.len = p.type === 'line' ? Math.hypot(p.p1[0] - p.p0[0], p.p1[1] - p.p0[1]) : R * (p.th1 - p.th0); p.s0 = s0; s0 += p.len; }
  const pt = (p, t) => {
    if (p.type === 'line') return { x: p.p0[0] + (p.p1[0] - p.p0[0]) * t, z: p.p0[1] + (p.p1[1] - p.p0[1]) * t, nx: p.n[0], nz: p.n[1] };
    const th = p.th0 + (p.th1 - p.th0) * t, ct = Math.cos(th), st = Math.sin(th);
    return { x: p.c[0] + R * ct, z: p.c[1] + R * st, nx: -ct, nz: -st };
  };
  return {
    hx, hz, R, pieces, length: s0, pt,
    at(s) { s = ((s % s0) + s0) % s0; const p = pieces.find((p) => s < p.s0 + p.len) || pieces[pieces.length - 1]; const t = (s - p.s0) / p.len; return { ...pt(p, t), piece: p, t }; },
    // normalised position 0..1 along the base path of a point of this (offset) path
    frac(piece, t) { return (piece.s0 / s0) + (piece.len / s0) * t; },
  };
}
// Polyline of the base path with vertices (x,z,nx,nz,s). lineStep metres on straights, arcSteps per corner; extra(id) -> array of t (0..1) breakpoints on a straight.
export function polyline(path, { lineStep = 2, arcSteps = 24, extra } = {}) {
  const pts = [];
  for (const p of path.pieces) {
    let ts = [];
    if (p.type === 'line') {
      const n = Math.max(1, Math.round(p.len / lineStep)); for (let i = 0; i <= n; i++) ts.push(i / n);
      if (extra) ts.push(...extra(p));
      ts = [...new Set(ts.map((t) => +t.toFixed(5)))].sort((u, v) => u - v);
    } else for (let i = 0; i <= arcSteps; i++) ts.push(i / arcSteps);
    for (const t of ts) { const q = path.pt(p, t); pts.push({ ...q, s: p.s0 + p.len * t, piece: p.id, t }); }
  }
  // drop duplicate join points
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) if (Math.hypot(pts[i].x - out[out.length - 1].x, pts[i].z - out[out.length - 1].z) > 1e-4) out.push(pts[i]);
  // close the loop
  const last = out[out.length - 1];
  if (Math.hypot(last.x - out[0].x, last.z - out[0].z) < 1e-3) { last.s = path.length; last.closing = true; } else out.push({ ...out[0], s: path.length, closing: true });
  return out;
}

// ---- merged-geometry builder -----------------------------------------------------------------------------------
export class Geo {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.idx = []; this.col = null; }
  // quad a,b,c,d counter-clockwise when seen from the side the normal points to; wanted normal gives the winding fix.
  quad(a, b, c, d, nrm, uvs) {
    const i = this.pos.length / 3;
    for (const p of [a, b, c, d]) this.pos.push(p[0], p[1], p[2]);
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const flip = cr[0] * nrm[0] + cr[1] * nrm[1] + cr[2] * nrm[2] < 0;
    for (let k = 0; k < 4; k++) this.nor.push(nrm[0], nrm[1], nrm[2]);
    const u = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]]; for (const t of u) this.uv.push(t[0], t[1]);
    if (!flip) this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3); else this.idx.push(i, i + 2, i + 1, i, i + 3, i + 2);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx); g.computeBoundingSphere(); g.computeBoundingBox(); return g;
  }
}

// ---- instanced structural members -------------------------------------------------------------------------------
export class Beams {
  constructor() { this.items = []; }
  add(a, b, w = 0.2, h = w) { this.items.push([a, b, w, h]); }
  // axis-aligned box centred at p
  box(p, sx, sy, sz, ry = 0) { this.items.push([p, null, sx, sy, sz, ry]); }
  build(material, { cast = true, receive = true } = {}) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, this.items.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), d = new THREE.Vector3(), z = new THREE.Vector3(0, 0, 1), e = new THREE.Euler();
    this.items.forEach((it, i) => {
      if (it[1] === null) { p.copy(it[0]); q.setFromEuler(e.set(0, it[5], 0)); s.set(it[2], it[3], it[4]); }
      else { const [a, b, w, h] = it; p.copy(a).add(b).multiplyScalar(0.5); d.copy(b).sub(a); const L = d.length(); q.setFromUnitVectors(z, d.divideScalar(L || 1)); s.set(w, h, L); }
      m.compose(p, q, s); mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = cast; mesh.receiveShadow = receive; mesh.frustumCulled = false;
    return mesh;
  }
}
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---- motion maths (shared by the flow and the ticket) ---------------------------------------------------------------------------
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpAngle = (a, b, w) => a + (((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * w;
export const smoother = (u) => Math.min(1, Math.max(0, u * u * u * (u * (u * 6 - 15) + 10)));   // clamped: float error at u ~ 1 can overshoot 1 and break curve lookups
export const easeOut = (u) => 1 - Math.pow(1 - u, 3);
export const bezier = (x1, y1, x2, y2) => (x) => {   // CSS cubic-bezier easing
  if (x <= 0 || x >= 1) return clamp(x, 0, 1);
  let t = x; for (let i = 0; i < 8; i++) { const u = 1 - t, cx = 3 * x1 * t * u * u + 3 * x2 * t * t * u + t ** 3 - x, d = 3 * x1 * u * u + 6 * (x2 - x1) * t * u + 3 * (1 - x2) * t * t; if (Math.abs(d) < 1e-6) break; t = clamp(t - cx / d, 0, 1); }
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
};
export const smooth01 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const anglesFor = (pos, target) => { const d = V(...target).sub(V(...pos)).normalize(); return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(clamp(d.y, -1, 1)) }; };
