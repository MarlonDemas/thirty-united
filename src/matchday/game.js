// matchday-rsvp: the game. Loaded by main.js (dynamic import, so a scene failure can fall back to fallback.js). Stadium scene (scene.js), the warm-up teammates
// (teammates.js) and the open-roam RSVP journey (flow.js, which orchestrates roam.js, stations.js, hud.js and challenges/).
import { world } from './scene.js';
import { createAudio } from './audio.js';
import { createFx } from './fx.js';
import { createFlow, VIEWS } from './flow.js';
import { createTeammates } from './teammates.js';
import { onTeardown } from './teardown.js';

const { sim, crowd, renderer } = world;
const ac = new AbortController();   // everything this module adds to window; aborted by teardown
// If the scene is abandoned (context lost for good, a later import fails), fallback.js runs these: stop drawing, drop the canvas, release the keyboard.
onTeardown(() => { ac.abort(); renderer.setAnimationLoop(null); renderer.domElement.remove(); });

const audio = createAudio();
const fx = createFx(world, { onBang: () => audio.bang() });
const teammates = createTeammates(world);
const flow = createFlow(world, { audio, fx, teammates });
onTeardown(() => flow.dispose());

// The sim clock drives everything: scene (crowd, keeper, net, flags) first, then the teammates, the flow (timeline, the guest's walk, stations) and the effects.
// Big steps (e.g. smoke's simStep) are sub-stepped so the flow's timeline and the walk stay correct. sim.scale is the goal beat's slow motion
// (cine.js: 1 normally, down to 0.35 for under a second): each sub-step advances the sim clock by dt * scale, so simStep stays deterministic.
const baseStep = sim.step;
const one = (dt) => { dt *= sim.scale; baseStep(dt); teammates.step(sim.t); flow.step(dt); fx.step(dt); };
sim.step = (dt) => {
  while (dt > 0.1) { one(0.1); dt -= 0.1; }
  one(dt);
};

// World contract for scripts/capture.mjs, built from the flow's own camera table. __setView(i) APPLIES the stage, so the capture sheet shows the real experience.
window.__views = ['gates', 'dribble', 'corner', 'penalty', 'aerial'].map((name) => ({ name, stage: name, ...VIEWS[name] }));
window.__setView = (i) => flow.goto(window.__views[i].stage);

addEventListener('resize', () => world.resize(), { signal: ac.signal });
let last = performance.now();
renderer.setAnimationLoop(() => { const now = performance.now(); sim.step(Math.min(0.1, (now - last) / 1000)); last = now; world.render(); });

await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
window.__dbg = { simStep: (dt) => sim.step(dt), agents: () => teammates.agents() };
// Dev server only (capture, smoke and the scratch suites run there). These expose guest data or internals, so a production build has none of them.
if (import.meta.env.DEV) {
  window.__world = world;
  Object.assign(window.__dbg, {
    info: () => ({ ...world.measure(), frame: world.lastFrame, crowd: { instances: crowd.count, triangles: crowd.triangles }, seats: world.seats.length, fx: { ...fx.stats, active: { ...fx.state } } }),
    audio: { get ready() { return audio.ready; }, get muted() { return audio.muted; } },
    flow: {
      state: flow.state,                 // { stage, side, score, values, open, busy, arriving, next, done, suppressed, card, heading, chip, toast, walk, skippable, simT, camera, fov, lights, roam, ticket, penalty }
      goto: flow.goto,                   // goto('gates'|'roam'|'dribble'|'corner'|'penalty'|'aerial'): clean reset + apply the stage
      teleport: flow.teleport,           // teleport('start'|'1:home'|'1:away'|2|3|4|{x,z,yaw}): move the guest; proximity opens a station card on the next step
      complete: flow.complete,           // complete(k, value?, { skip = true, side }): finish a station through the real completion path
      open: flow.open,                   // open(k): show a station's card now
      walkToNext: flow.walkToNext,       // the "Walk to next station" button
      pickSide: flow.pickSide,           // pickSide('home'|'away'): the intro choice (leaves the intro, walks to that END's kiosk)
      handInTicket: flow.handInTicket,   // during station 1's challenge: hand the ticket in
      shoot: flow.shoot,                 // during station 4's challenge: shoot('TL'|'TR'|'C'|'BL'|'BR') -> { ok, outcome, ax, ay, side, wrongWay }
      shootAt: flow.shootAt,             // shootAt(x, y) in goal-mouth metres (x world, y up)
      dribble: flow.dribble,             // during station 2's challenge: dribble('far'|'near'|'left'|'right', { force: 'goal'|'save'|'miss' }) -> { ok, outcome, side, near, mercy, forced }
      cross: flow.cross,                 // during station 3's challenge: cross('good'|'short'|'long') -> { ok, outcome: 'goal'|'short'|'long', aim, mercy, forced }
      crossAt: flow.crossAt,             // crossAt(x, z): aim the cross at world metres, then cross
      skip: flow.skip,                   // skip(seconds): advance the sim clock without waiting
      skipNow: flow.skipNow,             // the guest's skip (tap / Space): finish every forced move now
      ticket: flow.ticket, pace: flow.pace,   // the 3D ticket group and the pacing constants (read-only, for capture/tests)
    },
  });
}
window.__ready = true;
document.getElementById('boot')?.remove();   // the static loading screen from index.html
