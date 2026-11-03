// Stadium shell: two-tier rounded-rectangle bowl (stepped concrete, instanced seats, aisles, vomitories, railings),
// facade, cantilever roof with visible steel trusses + LED lip, floodlight masts, scoreboard, players' tunnel + concourse.
import * as THREE from 'three';
import { EVENT, TITLE_UC, THEME, fontCss } from './config.js';
import { D, lowerY, upperY, roofDeckY } from './dims.js';
import { pbr, canvasTex, makePath, polyline, Geo, Beams, V, mulberry32 } from './util.js';

const TILE = 2.5;
const hexLin = (h) => new THREE.Color(h);

export function buildStadium() {
  const rng = mulberry32(7771);
  const group = new THREE.Group(); group.name = 'stadium';
  const bloom = [];
  const lights = [];
  const { hx, hz, R } = D.bowl;
  const base = makePath(hx, hz, R);
  const a = hx - R, sl = D.slot, gh = D.gateHalf;
  const tOf = (x) => (a - x) / (2 * a);
  const poly = polyline(base, { lineStep: 4, extra: (p) => (p.id === 'S' ? [tOf(sl), tOf(-sl), tOf(gh), tOf(-gh)] : []) });
  const P = (v, d, y) => [v.x - v.nx * d, y, v.z - v.nz * d];

  // ---- materials ----------------------------------------------------------------------------------------------
  const concrete = pbr('concrete_floor_02', { color: 0xd2d0cc, normalScale: 0.8, desat: 0.8 });
  const concreteDark = pbr('concrete_floor_02', { color: 0xa09e9a, normalScale: 0.8, desat: 0.8 });
  const corrugated = pbr('corrugated_iron', { color: 0x8c97a4, normalScale: 1.2, metalness: 0.0, desat: 0.5 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x59616b, metalness: 0.85, roughness: 0.42 });
  const steelLight = new THREE.MeshStandardMaterial({ color: 0xaab2bb, metalness: 0.8, roughness: 0.35 });
  const roofTopMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.5, roughness: 0.55, side: THREE.DoubleSide });
  const accentMat = new THREE.MeshStandardMaterial({ color: D.accent, roughness: 0.5, metalness: 0.1 });

  // ---- stepped stands -------------------------------------------------------------------------------------------
  const gStand = new Geo(), gFacade = new Geo(), gRoofUnder = new Geo(), gRoofTop = new Geo(), gBand = new Geo(), gRoofSteel = new Geo();
  const nrm = (v0, v1) => { const x = v0.nx + v1.nx, z = v0.nz + v1.nz, l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
  const inSlot = (v0, v1) => v0.piece === 'S' && v1.piece === 'S' && Math.abs((v0.x + v1.x) / 2) < sl;
  const inGate = (v0, v1) => v0.piece === 'S' && v1.piece === 'S' && Math.abs((v0.x + v1.x) / 2) < gh;
  const tread = (g, v0, v1, d0, d1, y, tile = TILE) => g.quad(P(v0, d0, y), P(v1, d0, y), P(v1, d1, y), P(v0, d1, y), [0, 1, 0], [[v0.s / tile, d0 / tile], [v1.s / tile, d0 / tile], [v1.s / tile, d1 / tile], [v0.s / tile, d1 / tile]]);
  const wall = (g, v0, v1, d, y0, y1, dir, tile = TILE) => { const [nx, nz] = nrm(v0, v1); g.quad(P(v0, d, y0), P(v1, d, y0), P(v1, d, y1), P(v0, d, y1), [nx * dir, 0, nz * dir], [[v0.s / tile, y0 / tile], [v1.s / tile, y0 / tile], [v1.s / tile, y1 / tile], [v0.s / tile, y1 / tile]]); };

  for (let i = 0; i < poly.length - 1; i++) {
    const v0 = poly[i], v1 = poly[i + 1]; if (v1.s - v0.s < 1e-4) continue;
    const slot = inSlot(v0, v1), gate = inGate(v0, v1);
    // lower tier
    if (!slot) wall(gStand, v0, v1, 0, 0, D.lowerY0, +1);
    for (let r = 0; r < D.lowerRows; r++) {
      if (slot && r <= 5) { if (r < 5) continue; }
      const d0 = D.rowDepth * r, y = lowerY(r);
      tread(gStand, v0, v1, d0, d0 + D.rowDepth, y);
      if (r >= 1 && !(slot && r === 5)) wall(gStand, v0, v1, d0, lowerY(r - 1), y, +1);
    }
    // mid fascia between tiers
    wall(gStand, v0, v1, D.upperD0, lowerY(D.lowerRows - 1), D.midWallTop, +1);
    // upper tier
    for (let r = 0; r < D.upperRows; r++) {
      const d0 = D.upperD0 + D.rowDepth * r, y = upperY(r);
      tread(gStand, v0, v1, d0, d0 + D.rowDepth, y);
      if (r >= 1) wall(gStand, v0, v1, d0, upperY(r - 1), y, +1);
    }
    // back wall interior face (above the top row) + facade exterior face
    wall(gStand, v0, v1, D.backD, upperY(D.upperRows - 1), roofDeckY(D.backD) - 0.2, +1);
    const fy0 = gate ? 5.0 : 0, d = D.backD + 0.5;
    wall(gFacade, v0, v1, d, fy0, roofDeckY(D.backD + 0.5) + 0.1, -1, 2.0);
    // accent band
    wall(gBand, v0, v1, d + 0.04, 11.0, 12.6, -1);
    // roof
    const dIn = D.roofIn, dOut = D.roofOut, yIn = roofDeckY(dIn), yOut = roofDeckY(dOut);
    const T = 2.0;
    gRoofUnder.quad(P(v0, dIn, yIn - 0.2), P(v1, dIn, yIn - 0.2), P(v1, dOut, yOut - 0.2), P(v0, dOut, yOut - 0.2), [0, -1, 0], [[v0.s / T, 0], [v1.s / T, 0], [v1.s / T, (dOut - dIn) / T], [v0.s / T, (dOut - dIn) / T]]);
    gRoofTop.quad(P(v0, dIn, yIn + 0.05), P(v1, dIn, yIn + 0.05), P(v1, dOut, yOut + 0.05), P(v0, dOut, yOut + 0.05), [0, 1, 0]);
    // roof fascia (facing the pitch) and outer edge
    const [nx, nz] = nrm(v0, v1);
    gRoofSteel.quad(P(v0, dIn, yIn - 0.7), P(v1, dIn, yIn - 0.7), P(v1, dIn, yIn + 0.5), P(v0, dIn, yIn + 0.5), [nx, 0, nz]);
    gRoofSteel.quad(P(v0, dOut, yOut - 0.6), P(v1, dOut, yOut - 0.6), P(v1, dOut, yOut + 0.5), P(v0, dOut, yOut + 0.5), [-nx, 0, -nz]);
  }
  // slot (tunnel box) side walls between stands and tunnel are handled by the box below
  const standMesh = new THREE.Mesh(gStand.build(), concrete);
  const facadeMesh = new THREE.Mesh(gFacade.build(), corrugated);
  const bandMesh = new THREE.Mesh(gBand.build(), accentMat);
  const roofUnder = new THREE.Mesh(gRoofUnder.build(), corrugated);
  const roofTop = new THREE.Mesh(gRoofTop.build(), roofTopMat);
  const roofSteel = new THREE.Mesh(gRoofSteel.build(), steelLight);
  for (const m of [standMesh, facadeMesh, bandMesh, roofUnder, roofTop, roofSteel]) { m.castShadow = true; m.receiveShadow = true; group.add(m); }
  // the roof underside is lit by the stadium's own glow: give it a faint warm emissive so it doesn't die to black under the sun shadow
  corrugated.emissive = new THREE.Color(0x201510); corrugated.emissiveIntensity = 0.5;

  // ---- LED strip along the roof lip ----------------------------------------------------------------------------
  {
    const g = new Geo();
    for (let i = 0; i < poly.length - 1; i++) {
      const v0 = poly[i], v1 = poly[i + 1]; if (v1.s - v0.s < 1e-4) continue; const [nx, nz] = nrm(v0, v1); const y = roofDeckY(D.roofIn);
      g.quad(P(v0, D.roofIn - 0.04, y - 0.55), P(v1, D.roofIn - 0.04, y - 0.55), P(v1, D.roofIn - 0.04, y - 0.2), P(v0, D.roofIn - 0.04, y - 0.2), [nx, 0, nz]);
    }
    const led = new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xfff0d8, emissiveIntensity: 3.2, roughness: 0.4 }));
    led.castShadow = false; group.add(led); bloom.push(led); led.name = 'roofLED';
  }

  // ---- vomitories (dark openings) -------------------------------------------------------------------------------
  const NA = 36, aisleSp = base.length / NA, aisleOff = 0.37;
  const aisleS = (k) => (k + aisleOff) * aisleSp;
  {
    const g = new Geo(); const frame = new Geo();
    const add = (s, d, y0, y1) => {
      const b = base.at(s); const tx = -b.nz, tz = b.nx; const w = 1.6; const off = 0.035;
      const c = [b.x - b.nx * (d - off), b.z - b.nz * (d - off)];
      g.quad([c[0] - tx * w, y0, c[1] - tz * w], [c[0] + tx * w, y0, c[1] + tz * w], [c[0] + tx * w, y1, c[1] + tz * w], [c[0] - tx * w, y1, c[1] - tz * w], [b.nx, 0, b.nz]);
      // lintel frame
      const f = 0.08; const c2 = [b.x - b.nx * (d - off - 0.02), b.z - b.nz * (d - off - 0.02)];
      frame.quad([c2[0] - tx * (w + .3), y1, c2[1] - tz * (w + .3)], [c2[0] + tx * (w + .3), y1, c2[1] + tz * (w + .3)], [c2[0] + tx * (w + .3), y1 + 0.35, c2[1] + tz * (w + .3)], [c2[0] - tx * (w + .3), y1 + 0.35, c2[1] - tz * (w + .3)], [b.nx, 0, b.nz]);
    };
    for (let k = 0; k < NA; k += 3) { add(aisleS(k), D.upperD0, lowerY(D.lowerRows - 1) + 0.04, 13.0); add(aisleS(k), D.backD, upperY(D.upperRows - 1) + 0.05, upperY(D.upperRows - 1) + 2.5); }
    const m = new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({ color: 0x08080a, emissive: 0x5a2f10, emissiveIntensity: 0.55, roughness: 0.9 }));
    const mf = new THREE.Mesh(frame.build(), accentMat); group.add(m, mf);
  }

  // ---- seats (1 instanced draw call) ---------------------------------------------------------------------------
  const seats = []; // for the crowd
  {
    const sg = new Geo(); const hw = 0.2;
    sg.quad([-hw, 0.43, -0.18], [hw, 0.43, -0.18], [hw, 0.43, 0.24], [-hw, 0.43, 0.24], [0, 1, 0]);                  // pan top
    sg.quad([-hw, 0.36, 0.24], [hw, 0.36, 0.24], [hw, 0.43, 0.24], [-hw, 0.43, 0.24], [0, 0, 1]);                    // pan front
    sg.quad([-0.09, 0.0, 0.0], [0.09, 0.0, 0.0], [0.09, 0.36, 0.0], [-0.09, 0.36, 0.0], [0, 0, 1]);                  // pedestal front
    sg.quad([-hw, 0.43, -0.16], [hw, 0.43, -0.16], [hw, 0.86, -0.16], [-hw, 0.86, -0.16], [0, 0, 1]);                // backrest front
    sg.quad([-hw, 0.43, -0.2], [hw, 0.43, -0.2], [hw, 0.86, -0.2], [-hw, 0.86, -0.2], [0, 0, -1]);                   // backrest back
    sg.quad([-hw, 0.86, -0.2], [hw, 0.86, -0.2], [hw, 0.86, -0.16], [-hw, 0.86, -0.16], [0, 1, 0]);                  // backrest top
    const geo = sg.build();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.0 });
    const list = [];
    const bp = Object.fromEntries(base.pieces.map((p) => [p.id, p]));
    const make = (tier, rows, d0, yFn) => {
      for (let r = 0; r < rows; r++) {
        const d = d0 + D.rowDepth * r + 0.42, y = yFn(r) + 0.02;
        const path = makePath(hx + d, hz + d, R + d);
        const n = Math.floor(path.length / D.seatPitch), step = path.length / n;
        for (let k = 0; k < n; k++) {
          const q = path.at((k + 0.5) * step);
          const bs = bp[q.piece.id].s0 + bp[q.piece.id].len * q.t;
          let m = (bs / aisleSp - aisleOff) % 1; if (m < 0) m += 1; if (Math.min(m, 1 - m) * aisleSp < 1.0) continue;
          if (tier === 0 && r < 5 && q.piece.id === 'S' && Math.abs(q.x) < sl + 0.45) continue;
          list.push({ x: q.x, y, z: q.z, yaw: Math.atan2(q.nx, q.nz), phase: bs / base.length, tier, row: r });
        }
      }
    };
    make(0, D.lowerRows, 0, lowerY);
    make(1, D.upperRows, D.upperD0, upperY);
    const inst = new THREE.InstancedMesh(geo, mat, list.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    const red = hexLin(D.accent);
    list.forEach((s, i) => {
      m4.compose(p.set(s.x, s.y, s.z), q.setFromAxisAngle(up, s.yaw), one); inst.setMatrixAt(i, m4);
      const j = 0.82 + rng() * 0.22; c.copy(red).multiplyScalar(j); inst.setColorAt(i, c);
    });
    inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
    inst.castShadow = false; inst.receiveShadow = true; inst.frustumCulled = false; inst.name = 'seats';
    group.add(inst); seats.push(...list);
  }

  // ---- railings, aisle rails, facade columns, trusses (instanced beams) ---------------------------------------------
  const rails = new Beams(), structure = new Beams();
  {
    // front rails of both tiers
    const frontRail = (d, y0) => {
      for (let i = 0; i < poly.length - 1; i++) {
        const v0 = poly[i], v1 = poly[i + 1]; if (v1.s - v0.s < 1e-4) continue; if (d === 0 && inSlot(v0, v1)) continue;
        const A = V(...P(v0, d + 0.12, y0 + 1.05)), B = V(...P(v1, d + 0.12, y0 + 1.05));
        rails.add(A, B, 0.07, 0.07); rails.add(A.clone().setY(y0 + 0.55), B.clone().setY(y0 + 0.55), 0.04, 0.04);
        rails.add(V(...P(v0, d + 0.12, y0)), A, 0.05, 0.05);
      }
    };
    frontRail(0, D.lowerY0); frontRail(D.upperD0, D.midWallTop - 0.0);
    // aisle rails
    for (let k = 0; k < NA; k++) {
      const b = base.at(aisleS(k)); const tx = -b.nz, tz = b.nx;
      const tier = (d0, d1, yf) => {
        for (const sgn of [-1, 1]) {
          const at = (d) => [b.x - b.nx * d + tx * 0.85 * sgn, b.z - b.nz * d + tz * 0.85 * sgn];
          const [x0, z0] = at(d0 + 0.2), [x1, z1] = at(d1 - 0.2);
          rails.add(V(x0, yf(d0 + 0.2) + 1.0, z0), V(x1, yf(d1 - 0.2) + 1.0, z1), 0.05, 0.05);
          for (let j = 0; j <= 5; j++) { const dd = d0 + 0.3 + (d1 - d0 - 0.6) * j / 5; const [px, pz] = at(dd); rails.add(V(px, yf(dd), pz), V(px, yf(dd) + 1.0, pz), 0.05, 0.05); }
        }
      };
      tier(0, 19.6, (d) => D.lowerY0 + 0.5 * d);
      tier(D.upperD0 + 0.4, D.backD - 0.4, (d) => D.upperY0 + 0.5 * (d - D.upperD0));
    }
    // facade columns every ~8 m on the outer path + diagonal bracing
    const outer = makePath(hx + D.backD + 0.9, hz + D.backD + 0.9, R + D.backD + 0.9);
    const nCol = Math.round(outer.length / 8);
    const cols = [];
    for (let i = 0; i < nCol; i++) {
      const q = outer.at(i * outer.length / nCol); if (Math.abs(q.x) < gh + 1.2 && q.z > 0) { cols.push(null); continue; }
      structure.box(V(q.x, 14.9, q.z), 0.6, 29.8, 0.6, Math.atan2(q.nx, q.nz)); cols.push(q);
    }
    for (let i = 0; i < nCol; i++) {
      const A = cols[i], B = cols[(i + 1) % nCol]; if (!A || !B) continue;
      structure.add(V(A.x, 0.5, A.z), V(B.x, 11, B.z), 0.16, 0.16); structure.add(V(A.x, 11, A.z), V(B.x, 0.5, B.z), 0.16, 0.16);
      structure.add(V(A.x, 29.0, A.z), V(B.x, 29.0, B.z), 0.35, 0.35);
    }
    // cantilever trusses
    const mid = makePath(hx + 30, hz + 30, R + 30); const bp = Object.fromEntries(base.pieces.map((p) => [p.id, p]));
    const nT = Math.round(mid.length / 7);
    const bt = (d, y, b) => V(b.x - b.nx * d, y, b.z - b.nz * d);
    for (let i = 0; i < nT; i++) {
      const q = mid.at(i * mid.length / nT); const b = base.pt(bp[q.piece.id], q.t);
      const dR = 36.5, dT = D.roofIn + 0.2, N = 6;
      const top = (d) => roofDeckY(d) - 0.3;
      const bot = (d) => 24.2 + (36.5 - d) * 0.045;
      structure.add(bt(dR, top(dR), b), bt(dT, top(dT), b), 0.32, 0.32);
      structure.add(bt(dR, roofDeckY(dR) + 0.28, b), bt(dT, roofDeckY(dT) + 0.28, b), 0.3, 0.3);   // raised standing rib on the roof deck: reads from the air
      structure.add(bt(dR, bot(dR), b), bt(dT, bot(dT), b), 0.32, 0.32);
      for (let k = 0; k <= N; k++) {
        const d = dR + (dT - dR) * k / N;
        structure.add(bt(d, bot(d), b), bt(d, top(d), b), 0.18, 0.18);
        if (k < N) { const d2 = dR + (dT - dR) * (k + 1) / N; if (k % 2 === 0) structure.add(bt(d, bot(d), b), bt(d2, top(d2), b), 0.16, 0.16); else structure.add(bt(d, top(d), b), bt(d2, bot(d2), b), 0.16, 0.16); }
      }
    }
    // circumferential purlins
    for (const dd of [D.roofIn + 0.5, 27, 32]) for (let i = 0; i < poly.length - 1; i++) {
      const v0 = poly[i], v1 = poly[i + 1]; if (v1.s - v0.s < 1e-4) continue;
      const y = roofDeckY(dd) - 0.4; structure.add(V(...P(v0, dd, y)), V(...P(v1, dd, y)), 0.24, 0.24);
    }
  }
  group.add(rails.build(steelLight, { cast: false }), structure.build(steel));

  // ---- tunnel box + corridor + concourse hall --------------------------------------------------------------------
  const interior = new Geo();
  const iTile = 2.5;
  const rect = (g, pts, n, t = iTile) => { g.quad(pts[0], pts[1], pts[2], pts[3], n, pts.map((p) => [(Math.abs(n[0]) > 0.5 ? p[2] : p[0]) / t, (Math.abs(n[1]) > 0.5 ? p[2] : p[1]) / t])); };
  const room = (g, x0, x1, y0, y1, z0, z1, { north, south } = {}) => {
    rect(g, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, 1, 0]);
    rect(g, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, -1, 0]);
    rect(g, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [1, 0, 0]);
    rect(g, [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [-1, 0, 0]);
    const wallZ = (z, nz, op) => {
      if (!op) { rect(g, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, nz]); return; }
      const [o0, o1, oy] = op;
      rect(g, [[x0, y0, z], [o0, y0, z], [o0, y1, z], [x0, y1, z]], [0, 0, nz]);
      rect(g, [[o1, y0, z], [x1, y0, z], [x1, y1, z], [o1, y1, z]], [0, 0, nz]);
      rect(g, [[o0, oy, z], [o1, oy, z], [o1, y1, z], [o0, y1, z]], [0, 0, nz]);
    };
    wallZ(z0, 1, north); wallZ(z1, -1, south);
  };
  const zMouth = hz;                      // tunnel mouth at the front wall, z = 60
  room(interior, -15, 15, 0.02, 5.0, 84, 95.5, { north: [-2.0, 2.0, 2.8], south: [-gh, gh, 5.0] }); // concourse hall
  room(interior, -2.0, 2.0, 0.02, 2.8, zMouth, 84.0, { north: [-2.0, 2.0, 2.8], south: [-2.0, 2.0, 2.8] }); // players' tunnel (open ends)
  const interiorMat = concreteDark.clone(); interiorMat.color = new THREE.Color(0x9a9894); interiorMat.side = THREE.FrontSide;
  // indoors: the mast spots cast no shadow, so without this they would light the tunnel and the hall through the stand as brightly as the pitch.
  // Direct light on these surfaces is cut to 12% (sky and bounce stay), so the players' tunnel reads dark against the floodlit mouth.
  interiorMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), 0.8);')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directDiffuse *= 0.12; reflectedLight.directSpecular *= 0.12;');
  };
  interiorMat.customProgramCacheKey = () => 'interior-indoor';
  interiorMat.envMapIntensity = 0.55;
  // the tunnel's side walls are coplanar with stand faces near the mouth: pull the (inward-facing, FrontSide) interior forward so it always wins
  interiorMat.polygonOffset = true; interiorMat.polygonOffsetFactor = -1; interiorMat.polygonOffsetUnits = -4;
  const interiorMesh = new THREE.Mesh(interior.build(), interiorMat); interiorMesh.receiveShadow = true; group.add(interiorMesh);
  {
    // outer tunnel box (visible protrusion above the first rows) + red mouth lintel
    const b = new Beams(); const s = sl;
    b.box(V(0, 2.925, zMouth + 2.0), 2 * s, 0.15, 4.0);                      // roof slab, top flush with row 5 tread at y = 3.0
    b.box(V(-(s - 0.2), 1.45, zMouth + 2.0), 0.4, 2.9, 4.0); b.box(V((s - 0.2), 1.45, zMouth + 2.0), 0.4, 2.9, 4.0);
    group.add(b.build(concrete));
    const lint = new THREE.Mesh(new THREE.BoxGeometry(2 * s + 0.1, 0.22, 0.12), accentMat); lint.position.set(0, 2.74, zMouth - 0.02); lint.castShadow = true; group.add(lint);
    // ceiling light strips (tunnel + hall) glow
    const lb = new Beams();
    for (let z = zMouth + 3; z < 84; z += 4) lb.box(V(0, 2.76, z), 1.0, 0.04, 0.4);
    for (const x of [-9, -3, 3, 9]) for (const z of [87, 92]) lb.box(V(x, 4.96, z), 1.6, 0.04, 0.6);
    const lm = lb.build(new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff2dc, emissiveIntensity: 1.8 }), { cast: false, receive: false });
    group.add(lm); bloom.push(lm);
    // hall furniture: kiosks + signage boards so it doesn't read as an empty box
    const k = new Beams(); for (const x of [-11, 11]) { k.box(V(x, 0.55, 90), 2.2, 1.1, 5.0); k.box(V(x, 1.25, 90), 2.4, 0.15, 5.2); }
    group.add(k.build(steel));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshStandardMaterial({
      map: canvasTex(1024, 190, (c, w, h) => { c.fillStyle = THEME.color.ink900; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = fontCss(700, 96); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PLAYERS  →  PITCH', w / 2, h / 2 + 4); }),
      emissiveMap: null, emissive: 0xffffff, emissiveIntensity: 0.0, roughness: 0.6 }));
    sign.material.emissiveMap = sign.material.map; sign.material.emissiveIntensity = 0.9;
    sign.position.set(0, 3.7, 83.94); sign.rotation.y = Math.PI; group.add(sign);
  }

  // ---- floodlight masts (4) ---------------------------------------------------------------------------------------
  const masts = [];
  {
    const mb = new Beams(); const lensB = new Beams(); const frameB = new Beams();
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff3dd, emissiveIntensity: 9, roughness: 0.3 });
    const cx = a + 58 * Math.SQRT1_2, cz = (hz - R) + 58 * Math.SQRT1_2;
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const x = sx * cx, z = sz * cz, H = 52;
      const corner = (y, w) => [[-w, y, -w], [w, y, -w], [w, y, w], [-w, y, w]].map(([a, b, c]) => V(x + a, b, z + c));
      const w = (y) => 2.0 + (0.9 - 2.0) * y / H;
      const lev = 13;
      for (let j = 0; j <= lev; j++) {
        const y = H * j / lev, c = corner(y, w(y));
        for (let e = 0; e < 4; e++) mb.add(c[e], c[(e + 1) % 4], 0.14, 0.14);
        if (j < lev) { const y2 = H * (j + 1) / lev, c2 = corner(y2, w(y2)); for (let e = 0; e < 4; e++) { mb.add(c[e], c2[e], 0.22, 0.22); const f = (e + 1) % 4; mb.add(c[e], c2[f], 0.1, 0.1); mb.add(c[f], c2[e], 0.1, 0.1); } }
      }
      // lamp rig facing the pitch
      const rig = new THREE.Group(); rig.position.set(x, H + 2.6, z);
      const yaw = Math.atan2(-x, -z); rig.rotation.set(0, yaw, 0);
      const tilt = new THREE.Group(); tilt.rotation.x = Math.atan2(H, Math.hypot(x, z)) * 0.9; rig.add(tilt); // tilt down (+rot about x tips +z side down)
      const body = new THREE.Mesh(new THREE.BoxGeometry(8.2, 5.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x23282e, metalness: 0.6, roughness: 0.6 })); body.castShadow = false; tilt.add(body);
      const lensGeo = new THREE.BoxGeometry(0.75, 0.75, 0.12), cols = 6, rows = 4, lens = new THREE.InstancedMesh(lensGeo, lensMat, cols * rows);
      const m4 = new THREE.Matrix4(); let i = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { m4.makeTranslation((c - (cols - 1) / 2) * 1.25, (r - (rows - 1) / 2) * 1.15, 0.31); lens.setMatrixAt(i++, m4); }
      tilt.add(lens); lens.castShadow = false; bloom.push(lens);
      // visor ring and catwalk
      const cat = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.12, 1.4), steel); cat.position.set(0, -2.8, 0.1); tilt.add(cat);
      group.add(rig);
      const spot = new THREE.SpotLight(0xfff0d8, 26000, 0, 0.5, 0.6, 2);
      spot.position.set(x, H + 2.6, z); spot.target.position.set(-sx * 8, 0, -sz * 14); spot.castShadow = false;
      group.add(spot, spot.target); lights.push(spot);
      masts.push({ position: V(x, 0, z), rig });
    }
    group.add(mb.build(steel));
  }

  // ---- scoreboard on the north stand ---------------------------------------------------------------------------
  const scoreboard = (() => {
    const W = 2048, H = 640, LED_BG = '#05070a';
    const tex = canvasTex(W, H, () => {});
    const ctx = tex.userData.ctx;
    const api = {
      texture: tex, canvas: tex.userData.canvas, ctx, width: W, height: H, flash: 0,
      // lines: array of strings or {text|parts, size, color, weight}; drawn centred top to bottom. Pass nothing to redraw the default.
      // parts: array of strings and {flip:[from,to]} digits. Digits sit in fixed-width slots (tabular) and flip like a split-flap when opts.p (0..1) is set:
      // p<.5 the old digit's top half folds down, p>=.5 the new digit's bottom half folds out. p undefined / 1 draws the new digit.
      draw(lines, opts = {}) {
        lines = lines || [{ text: TITLE_UC, size: 74, color: THEME.color.scoreboardDim }, { parts: ['HOME ', { flip: [0, 0] }, '–0 AWAY'], size: 210, color: THEME.color.scoreboardText, weight: 800 }, { text: EVENT.shortDate, size: 78, color: THEME.color.scoreboardAccent }];
        ctx.fillStyle = LED_BG; ctx.fillRect(0, 0, W, H);
        const items = lines.map((l) => (typeof l === 'string' ? { text: l, size: 120, color: THEME.color.scoreboardText } : l));
        const total = items.reduce((s, l) => s + l.size * 1.2, 0); let y = (H - total) / 2;
        ctx.textBaseline = 'middle';
        const p = opts.p;
        for (const l of items) {
          const wt = l.weight || 700, parts = l.parts || [l.text];
          let size = l.size; const setFont = () => { ctx.font = fontCss(wt, size); };
          const slotW = () => Math.max(...'0123456789'.split('').map((d) => ctx.measureText(d).width));
          const widths = () => parts.map((q) => (typeof q === 'string' ? ctx.measureText(q).width : slotW()));
          setFont(); while (widths().reduce((a, b) => a + b, 0) > W - 120 && size > 20) { size -= 4; setFont(); }
          const ws = widths(), cy = y + l.size * 0.6; let x = (W - ws.reduce((a, b) => a + b, 0)) / 2;
          ctx.fillStyle = l.color || THEME.color.scoreboardText; ctx.textAlign = 'left';
          parts.forEach((q, i) => {
            if (typeof q === 'string') { ctx.fillText(q, x, cy); x += ws[i]; return; }
            const [from, to] = q.flip, cx = x + ws[i] / 2, mid = cy + size * 0.04, half = (str, top, sy) => {   // draw one half of a digit, squeezed about the midline
              ctx.save(); ctx.beginPath(); ctx.rect(x - 4, top ? cy - size : mid, ws[i] + 8, top ? mid - (cy - size) : size); ctx.clip();
              ctx.translate(0, mid); ctx.scale(1, sy); ctx.translate(0, -mid); ctx.textAlign = 'center'; ctx.fillText(str, cx, cy); ctx.restore();
            };
            if (p === undefined || p >= 1 || from === to) half(String(to), true, 1), half(String(to), false, 1);
            else if (p < 0.5) { half(String(to), true, 1); half(String(from), false, 1); half(String(from), true, Math.max(0.001, 1 - p * 2)); }
            else { half(String(to), true, 1); half(String(from), false, 1); half(String(to), false, Math.max(0.001, p * 2 - 1)); }
            if (p !== undefined && p < 1 && from !== to) { ctx.fillStyle = LED_BG; ctx.fillRect(x - 4, mid - 2, ws[i] + 8, 4); ctx.fillStyle = l.color || THEME.color.scoreboardText; }   // the flap hinge
            x += ws[i];
          });
          y += l.size * 1.2;
        }
        // LED pixel grid
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; for (let x = 0; x < W; x += 8) ctx.fillRect(x, 0, 2, H); for (let yy = 0; yy < H; yy += 8) ctx.fillRect(0, yy, W, 2);
        // accent edge bars
        ctx.fillStyle = EVENT.kits.home; ctx.fillRect(0, 0, W, 14); ctx.fillRect(0, H - 14, W, 14);
        tex.needsUpdate = true;
      },
    };
    api.draw();
    const w = 22, h = 7, zc = -(hz + 22), yc = 20.8;
    const g = new THREE.Group(); g.position.set(0, yc, zc);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, h + 0.8, 0.6), steel); bezel.castShadow = true; g.add(bezel);
    const mat = new THREE.MeshStandardMaterial({ color: 0x050505, map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.4 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); screen.position.z = 0.32; g.add(screen);
    const rb = new Beams(); for (const sx of [-1, 1]) for (const sy of [-1, 1]) rb.add(V(sx * (w / 2 - 1), yc + h / 2 + 0.4, zc), V(sx * (w / 2 - 1.5 + sx * 0.5), roofDeckY(D.roofIn) - 0.7, zc - 0.3), 0.16, 0.16);
    group.add(g, rb.build(steel));   // no bloom: the LED digits stay crisp
    api.mesh = screen; api.group = g; api.position = V(0, yc, zc);
    return api;
  })();

  // players' tunnel + concourse path for camera glides (turnstile -> concourse -> tunnel -> pitch)
  const tunnelPath = [V(0, 1.7, 112), V(0, 1.7, 103), V(0, 1.7, 96), V(0, 1.7, 90), V(0, 1.7, 84.5), V(0, 1.7, 72), V(0, 1.7, 61), V(0, 1.7, 55)];

  return { group, bloom, lights, seats, scoreboard, masts, tunnelPath, base, poly, aisleS, NA, materials: { concrete, concreteDark, corrugated, steel, steelLight, accentMat } };
}
