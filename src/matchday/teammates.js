// matchday-rsvp: HOME-kit teammates warming up (buildFootballer from people.js). Two passing pairs jog fixed, well separated loops and pass a ball across them;
// a few more stand and stretch near the stations. Every pose is a pure function of the sim clock, so window.__dbg.simStep(dt) is deterministic.
// agents() returns the movers in the smoke contract shape: { id, name, x, z, heading, radius, related } (forward = (sin h, cos h); related = the passing partner).
// wave(id, on) / face(id, x, z) turn and wave a teammate ("teammates wave you over"); drive(id, fn) hands an idle teammate to a challenge script
// (the dribble's passer and celebrator, the corner's striker), and a driven teammate counts as an agent while it moves (I.agent). huddle() gathers
// four more teammates round the guest before full time. Challenges add their own movers (the second keeper, a live ball) via addAgent().
import * as THREE from 'three';
import { buildFootballer, buildBall } from './people.js';
import { KIT_HEX } from './config.js';
import { mulberry32, lerpAngle } from './util.js';

const HOME_KIT = { shirt: KIT_HEX.home, shorts: 0xf2f2f2, socks: KIT_HEX.home, boots: 0x111111 };
const SKIN = [0x8d5a3b, 0xd9a477, 0x6b4128, 0xc68a62, 0xa87050, 0xe0b48c, 0x5a3622];
const HAIR = [0x15100c, 0x2a1a10, 0x0d0b0a, 0x4a3020, 0x1b1410];
// Loops sit clear of the straight lines between the tunnel and the stations, and > 60 m apart, so they never meet each other or a station.
export const LOOPS = [
  { id: 'A', cx: 17, cz: 29, r: 6, speed: 2.6, dir: 1 },
  { id: 'B', cx: -17, cz: -27, r: 6, speed: 2.4, dir: -1 },
];
// idle teammates (not agents unless a challenge drives them): the passer at the head of the dribble course (station 2), the striker in the box
// (station 3), one stretching by the tunnel mouth (he celebrates the dribble goal)
export const IDLE = [
  { id: 'dugout', x: -24.5, z: 14.05, face: [-27.46, 15.1] },
  { id: 'striker', x: 6.5, z: -45.5, face: [34, -52.5] },
  { id: 'tunnel', x: 4.2, z: 50.5, face: [0, 40] },
];

export function pose(J, t, run) {   // run: 0 = standing, 1 = jogging; t drives the stride phase
  const s = Math.sin(t), c = Math.cos(t);
  J.hipL.rotation.set(-0.55 * s * run, 0, 0.04); J.hipR.rotation.set(0.55 * s * run, 0, -0.04);
  J.kneeL.rotation.set(0.15 + (0.7 * Math.max(0, -s) + 0.25) * run, 0, 0); J.kneeR.rotation.set(0.15 + (0.7 * Math.max(0, s) + 0.25) * run, 0, 0);
  J.shL.rotation.set(0.5 * s * run, 0, 0.12); J.shR.rotation.set(-0.5 * s * run, 0, -0.12);
  J.elL.rotation.set(-0.3 - 0.9 * run, 0, 0); J.elR.rotation.set(-0.3 - 0.9 * run, 0, 0);
  J.spine.rotation.set(0.12 * run, 0.06 * c * run, 0); J.hips.position.y = 0.92 - 0.03 * run + 0.035 * Math.abs(c) * run;
}

export function createTeammates(world) {
  const { scene } = world;
  const sim = () => world.sim.t;
  const rng = mulberry32(1212);
  const group = new THREE.Group(); group.name = 'teammates'; scene.add(group);
  let n = 0;
  const make = (name) => {
    const f = buildFootballer({ ...HOME_KIT, skin: SKIN[n % SKIN.length], hair: HAIR[n % HAIR.length], name }); n++;
    f.root.traverse((o) => { if (o.isMesh && o.geometry.boundingSphere?.radius < 0.03) o.castShadow = false; });   // eyes/ears/nose: no shadow cost
    group.add(f.root); return f;
  };
  const runners = [], balls = [], idle = [];
  for (const L of LOOPS) {
    const ball = buildBall(); ball.castShadow = true; group.add(ball); balls.push(ball);
    for (const k of [0, 1]) runners.push({ id: `tm${L.id}${k + 1}`, name: `teammate ${L.id}${k + 1}`, loop: L, phase: k * Math.PI, fig: make(`teammate${L.id}${k + 1}`), stride: rng() * 6, x: 0, z: 0, h: 0 });
  }
  for (const I of IDLE) { const fig = make('teammate-' + I.id); idle.push({ ...I, home: [I.x, I.z], fig, ph: rng() * 6, wave: false, faceTo: I.face, ry: Math.atan2(I.face[0] - I.x, I.face[1] - I.z), drive: null, agent: false, related: [] }); }
  const extraAgents = new Map();   // challenge movers (the second keeper, a live ball) while active
  // the full-time huddle: four more HOME teammates, hidden until finale; they jog in from just outside the frame and close round the guest
  const huddlers = [0, 1, 2, 3].map((i) => { const fig = make('huddle' + (i + 1)); fig.root.visible = false; return { id: 'huddle' + (i + 1), fig, x: 0, z: 0, h: 0, from: [0, 0], to: [0, 0] }; });
  let hud = null, lastT = 0;   // { t0, run, cx, cz } while the huddle is on

  function step(t) {
    for (const r of runners) {
      const L = r.loop, w = L.dir * L.speed / L.r, th = r.phase + w * t;
      r.x = L.cx + L.r * Math.cos(th); r.z = L.cz + L.r * Math.sin(th);
      const vx = -Math.sin(th) * w, vz = Math.cos(th) * w; r.h = Math.atan2(vx, vz);
      r.fig.root.position.set(r.x, 0, r.z); r.fig.root.rotation.y = r.h;
      pose(r.fig.joints, r.stride + t * L.speed * 2.4, 1);
    }
    // passing: the ball rolls across the loop between partners, 1.5 s per pass, 0.35 s at the feet
    LOOPS.forEach((L, i) => {
      const a = runners[2 * i], b = runners[2 * i + 1], P = 1.85, u = (t % (2 * P)) / P, leg = Math.floor(u), f = Math.min(1, (u - leg) / (1.5 / P));
      const [from, to] = leg === 0 ? [a, b] : [b, a], e = f * (2 - f), ball = balls[i];
      const fx = from.x + Math.sin(from.h) * 0.45, fz = from.z + Math.cos(from.h) * 0.45, tx = to.x + Math.sin(to.h) * 0.45, tz = to.z + Math.cos(to.h) * 0.45;
      ball.position.set(fx + (tx - fx) * e, 0.11, fz + (tz - fz) * e); ball.rotation.x = t * 9; ball.rotation.z = t * 3;
      // the receiver's head tracks the ball
      for (const p of [a, b]) p.fig.joints.head.rotation.y = Math.max(-0.9, Math.min(0.9, Math.atan2(ball.position.x - p.x, ball.position.z - p.z) - p.h));
    });
    const dt = Math.max(0, Math.min(0.1, t - lastT)); lastT = t;
    for (const I of idle) {
      if (I.drive) { if (I.drive(I, t, dt) === 'done') { I.drive = null; I.agent = false; } I.fig.root.position.set(I.x, 0, I.z); I.fig.root.rotation.y = I.ry; continue; }   // a challenge script owns the figure (position, heading, joints)
      const J = I.fig.joints; I.fig.root.position.set(I.x, 0, I.z);
      I.ry = lerpAngle(I.ry, Math.atan2(I.faceTo[0] - I.x, I.faceTo[1] - I.z), 1 - Math.exp(-5 * dt)); I.fig.root.rotation.y = I.ry;   // turns, never snaps
      pose(J, 0, 0);
      if (I.wave) { J.shR.rotation.set(0, 0, -2.6 - 0.25 * Math.sin(t * 9)); J.elR.rotation.set(-0.4, 0, 0); }   // right arm up, waving
      else { const s = Math.sin(t * 0.9 + I.ph); J.spine.rotation.set(0.08 + 0.06 * s, 0.12 * Math.sin(t * 0.5 + I.ph), 0.05 * s); J.shL.rotation.set(-0.2 * s, 0, 0.25); J.shR.rotation.set(0.2 * s, 0, -0.25); }
    }
    if (hud) {   // run in (jog), then lean in with arms out over the neighbours' shoulders and bounce
      const u = Math.min(1, (t - hud.t0) / hud.run), e = u * u * (3 - 2 * u);
      for (const H of huddlers) {
        const J = H.fig.joints; H.x = H.from[0] + (H.to[0] - H.from[0]) * e; H.z = H.from[1] + (H.to[1] - H.from[1]) * e;
        H.h = Math.atan2(hud.cx - H.x, hud.cz - H.z); H.fig.root.position.set(H.x, 0, H.z); H.fig.root.rotation.y = H.h;
        if (u < 1) pose(J, t * 6.5 + H.h, 1 - e * e);
        else { pose(J, 0, 0); const b = Math.abs(Math.sin((t - hud.t0) * 7)); J.spine.rotation.set(0.5, 0, 0); J.head.rotation.set(0.3, 0, 0); J.shL.rotation.set(0.55, 0, 1.2); J.shR.rotation.set(0.55, 0, -1.2); J.elL.rotation.set(-0.35, 0, 0); J.elR.rotation.set(-0.35, 0, 0); J.kneeL.rotation.set(0.3, 0, 0); J.kneeR.rotation.set(0.3, 0, 0); J.hips.position.y = 0.86 + 0.05 * b; }   // leaning in, arms round the neighbours' backs
      }
    }
  }
  step(0);
  return {
    group, runners, idle, balls,
    step,
    agents: () => [...runners.map((r) => ({ id: r.id, name: r.name, x: r.x, z: r.z, heading: r.h, radius: 0.45, related: runners.filter((o) => o.loop === r.loop && o !== r).map((o) => o.id) })),
      ...idle.filter((I) => I.agent).map((I) => ({ id: I.id, name: 'teammate ' + I.id, x: I.x, z: I.z, heading: I.ry, radius: 0.45, related: [...I.related] })),
      ...(hud && sim() - hud.t0 < hud.run ? huddlers.map((H) => ({ id: H.id, name: 'teammate ' + H.id, x: H.x, z: H.z, heading: H.h, radius: 0.45, related: huddlers.filter((o) => o !== H).map((o) => o.id) })) : []),
      ...[...extraAgents.values()].map((f) => f()).filter(Boolean)],
    // obstacles for the guest's walk: every teammate's current footprint [x, z, r]
    obstacles: () => [...runners.map((r) => [r.x, r.z, 0.45]), ...idle.map((I) => [I.x, I.z, 0.45])],
    pickables: () => [],
    get: (id) => idle.find((i) => i.id === id) || null,
    addAgent(id, fn) { extraAgents.set(id, fn); },   // fn() -> an agent record, or null while inactive
    removeAgent(id) { extraAgents.delete(id); },
    wave(id, on = true) { const I = idle.find((i) => i.id === id); if (I) I.wave = on; },
    face(id, x, z) { const I = idle.find((i) => i.id === id); if (I) I.faceTo = x === undefined ? I.face : [x, z]; },   // face(id) turns back to the default
    // drive(id, fn): fn(I, t, dt) sets I.x, I.z, I.ry and the joints each step until it returns 'done'; set I.agent / I.related while the figure moves
    drive(id, fn) { const I = idle.find((i) => i.id === id); if (I) { I.drive = fn; I.wave = false; } return I; },
    // settle every driven teammate where it is now (its new idle spot): used before the huddle so nobody is mid-run
    settle() { for (const I of idle) if (I.drive) { I.drive = null; I.agent = false; I.related = []; I.faceTo = [I.x + Math.sin(I.ry), I.z + Math.cos(I.ry)]; } },
    // the huddle: an arc of four in front of (cx, cz) facing yaw (camera convention: forward = (-sin yaw, -cos yaw)), jogging in from about 5 m over `run` s
    huddle(cx, cz, yaw, { run = 1.1, inside = () => true } = {}) {
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      huddlers.forEach((H, i) => {
        const a = [-1.05, -0.36, 0.36, 1.05][i], dx = fx * Math.cos(a) - fz * Math.sin(a), dz = fx * Math.sin(a) + fz * Math.cos(a);
        H.to = [cx + dx * 1.15, cz + dz * 1.15]; let r = 5.2; while (r > 2.4 && !inside(cx + dx * r, cz + dz * r)) r -= 0.2; H.from = [cx + dx * r, cz + dz * r];
        H.fig.root.visible = true;
      });
      hud = { t0: sim(), run, cx, cz }; step(sim());
    },
    huddleState: () => (hud ? { on: true, settled: sim() - hud.t0 >= hud.run, at: huddlers.map((H) => [+H.x.toFixed(2), +H.z.toFixed(2)]) } : { on: false }),
    reset() {
      for (const I of idle) { const d = IDLE.find((e) => e.id === I.id); I.wave = false; I.drive = null; I.agent = false; I.related = []; I.x = d.x; I.z = d.z; I.faceTo = d.face; I.ry = Math.atan2(d.face[0] - d.x, d.face[1] - d.z); }
      extraAgents.clear(); hud = null; for (const H of huddlers) H.fig.root.visible = false;
    },
  };
}
