// matchday-rsvp: the station registry (open-roam). Four stations, a short group of questions each (fields.js GROUPS):
//   1 names   the kiosk in the chosen END (HOME or AWAY lane)    first name, surname, name on the shirt, "Not sure yet" (AWAY: replied before? then names + email, or names + an optional reason)   challenge: hand in the ticket (challenges/ticket.js)
//   2 email   the HOME dugout                                     email + who you support (the shirt hangs here)                                    challenge: dribble and shoot (challenges/dribble.js)
//   3 reach   the north-east corner flag                          email or WhatsApp, and the number                                                 challenge: the corner and a teammate's header (challenges/corner.js)
//   4 plus    the north penalty spot                              plus one, and their name                                                          challenge: the penalty (challenges/penalty.js)
// HOME stations 2-4 can be done in any order. Each station has an in-world question board (canvas fillText) and a lit beacon while it is next.
// Walking within 3 m opens its card (a short skippable camera move first); walking 4 m away closes it, Escape or "Not now" closes it until the guest has left.
// Never blocking: confirming saves the answer at once; "Skip ..." completes the station without the challenge; challenges allow at most one failure.
import * as THREE from 'three';
import { THEME, KIT_HEX, fontCss } from './config.js';
import { GROUPS, noticeSide } from './fields.js';
import { h, fieldsForm, closedNote, privacyNotice } from './ui.js';
import { closedText } from './submit.js';
import { canvasTex, anglesFor, reducedMotion } from './util.js';

// stand = where the guest stands [x, z]; feature = what the station is about (world point); board = the question board [x, z]. The arrival look sits between the two.
export const STATIONS = [
  { id: 1, short: 'Your name', side: 'home', k: '1:home', where: 'HOME END kiosk', challenge: 'ticket', skipLabel: 'Skip the ticket' },
  { id: 1, short: 'Your name', side: 'away', k: '1:away', where: 'AWAY END kiosk', challenge: 'ticket', skipLabel: 'Skip the ticket' },
  { id: 2, short: 'Email and team', side: 'home', k: '2', where: 'HOME dugout', stand: [-32.6, 8], feature: [-37.4, 1.1, 8], board: [-35.0, 5.4], challenge: 'dribble', skipLabel: 'Skip the dribble', question: 'Email & team?' },
  { id: 3, short: 'How to reach you', side: 'home', k: '3', where: 'Corner flag', stand: [30.4, -48.6], feature: [34, 1.0, -52.5], board: [33.6, -49.0], challenge: 'corner', skipLabel: 'Skip the header', question: 'Best contact?' },
  { id: 4, short: 'Plus one', side: 'home', k: '4', where: 'Penalty spot', stand: [0, -38.6], feature: [0, 0, -52.5], board: [-6.6, -37.0], challenge: 'penalty', skipLabel: 'Skip the kick', question: 'Plus one?' },
];
const BLURB = {
  '1:home': 'Your name goes on the back. A few lines so I can seat you properly. Then hand in your ticket.',
  '1:away': "Can't make it? Tell me if you've replied before and leave your name, then hand in your ticket.",
  2: 'Your email, and who you support (Neutral is fine). Then take the pass, dribble through the cones and shoot.',
  3: 'How should I send you the details? Then whip in a corner for the striker to head in.',
  4: 'Bringing someone? Then score from the spot.',
};
const NEAR = 3, FAR = 4;

export function createStations(world, { hud, roam, challenges, getSide, getValues, onSave, onComplete, onChallenge, canOpen, signal }) {
  const { scene, bloom, plaza } = world;
  const list = STATIONS.map((s) => ({ ...s, keys: GROUPS[s.k] }));
  for (const s of list) if (s.id === 1) {   // station 1 lives at the kiosk of its END (plaza.js)
    const P = plaza.sides[s.side]; s.stand = P.stand; s.feature = P.kioskPos.toArray(); s.lane = P.lane; s.handIn = P.handIn; s.kiosk = P.kiosk; s.kiosk.userData.station = s.k;
  }
  const byK = (k) => list.find((s) => s.k === String(k)) || null;
  const done = new Map();   // k -> { value, skipped, outcome }
  let open = null, busy = null, arriving = null, mode = 'play';
  const away = new Set();   // suppressed until the guest is FAR from them (Escape / Not now)

  // ---- question boards: a canvas panel on two steel posts, turned to face the stand point -------------------------------------
  const steel = new THREE.MeshStandardMaterial({ color: 0x6d747c, metalness: 0.85, roughness: 0.35 });
  const back = new THREE.MeshStandardMaterial({ color: 0x1a1e26, metalness: 0.4, roughness: 0.6 });
  const boards = new THREE.Group(); boards.name = 'stationBoards'; scene.add(boards);
  const BW = 1.6, BH = 1.0;
  function drawBoard(s) {
    const tex = s.tex, c = tex.userData.ctx, w = tex.userData.canvas.width, hh = tex.userData.canvas.height, ok = done.has(s.k);
    c.fillStyle = THEME.color.ink900; c.fillRect(0, 0, w, hh);
    c.fillStyle = THEME.color.accent; c.fillRect(0, 0, w, 96);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#fff'; c.font = fontCss(800, 44); c.fillText(`STATION ${s.id} · ${s.where.toUpperCase()}`, w / 2, 50);
    c.fillStyle = THEME.color.fog100; c.font = fontCss(800, 92); c.fillText(s.question, w / 2, 222);
    c.fillStyle = ok ? THEME.color.accent : THEME.color.fog300; c.font = fontCss(700, 46); c.fillText(ok ? 'DONE ✓' : 'WALK UP TO ANSWER', w / 2, 370);
    tex.needsUpdate = true;
  }
  const obstacles = [];
  for (const s of list) {
    if (s.id === 1) continue;
    const g = new THREE.Group(); g.position.set(s.board[0], 0, s.board[1]); g.rotation.y = Math.atan2(s.stand[0] - s.board[0], s.stand[1] - s.board[1]); g.userData.station = s.k; g.name = 'board' + s.id;
    s.tex = canvasTex(768, 480, () => {}); drawBoard(s);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ color: 0x111111, map: s.tex, emissiveMap: s.tex, emissive: 0xffffff, emissiveIntensity: 0.75, roughness: 0.4 }));
    face.position.set(0, 1.95, 0.04); g.add(face); bloom.selection.add(face);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.1, BH + 0.1, 0.06), back); slab.position.y = 1.95; slab.castShadow = true; g.add(slab);
    for (const dx of [-0.7, 0.7]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.5, 10), steel); post.position.set(dx, 1.25, -0.05); post.castShadow = true; g.add(post); }
    boards.add(g); s.boardMesh = g;
    obstacles.push([s.board[0] - 0.8, s.board[0] + 0.8, s.board[1] - 0.8, s.board[1] + 0.8]);
  }
  for (const s of list) {
    // the arrival look: the midpoint of the board and the feature (station 1: the kiosk screen; station 4: the goal)
    s.focus = s.id === 1 || s.id === 4 ? s.feature : [(s.board[0] + s.feature[0]) / 2, 1.5, (s.board[1] + s.feature[2]) / 2];
  }

  // ---- beacons: a soft column of light + a ground ring on the next unfinished station(s) -------------------------------------------
  const fade = canvasTex(4, 128, (c, w, hh) => { const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#000'); g.addColorStop(0.55, '#444'); g.addColorStop(1, '#fff'); c.fillStyle = g; c.fillRect(0, 0, w, hh); }, { srgb: false });
  fade.wrapS = fade.wrapT = THREE.ClampToEdgeWrapping;
  // on the pitch: slim (0.3 m) and 8 m tall, so it reads as a guide from across the bowl; it also fades as the guest closes in (step), never hiding the station
  for (const s of list) {
    const colour = s.id === 1 && s.side === 'away' ? KIT_HEX.away : KIT_HEX.home, H = s.id === 1 ? 4.6 : 8, R = s.id === 1 ? 0.55 : 0.3;
    const mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(s.id === 1 && s.side === 'away' ? THEME.color.accentAway : THEME.color.accent), emissiveIntensity: 2.2, alphaMap: fade, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    const col = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 28, 1, true), mat); col.position.y = H / 2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.86, 48), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: colour, emissiveIntensity: 2.4, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
    const g = new THREE.Group(); g.add(col, ring); g.position.set(s.stand[0], 0, s.stand[1]); g.visible = false; g.name = 'beacon' + s.k; scene.add(g);
    col.renderOrder = ring.renderOrder = 5; bloom.selection.add(col); bloom.selection.add(ring);
    s.beacon = { g, col, ring };
  }

  // ---- which station is next --------------------------------------------------------------------------------------------------------
  // side null: both kiosks. HOME after station 1: the lowest unfinished station (any order is fine; this is just the guide's pick). AWAY: none.
  const available = (s) => {
    const side = getSide();
    if (done.has(s.k)) return false;
    if (s.id === 1) return !side;
    return side === 'home' && done.has('1:home');
  };
  function next() {
    const side = getSide();
    if (!side) return null;
    return list.find((s) => s.id > 1 && available(s)) || null;
  }
  const remaining = () => list.filter((s) => s.id > 1 && !done.has(s.k)).length;
  const dist = (s) => Math.hypot(roam.pos.x - s.stand[0], roam.pos.z - s.stand[1]);

  // ---- the card ----------------------------------------------------------------------------------------------------------------------------------
  function cardFor(s) {
    const id = 'st-' + s.k.replace(':', '-');
    const kicker = s.id === 1 ? (s.side === 'home' ? 'HOME END · Station 1 of 4' : 'AWAY END · Your reply') : `Station ${s.id} of 4 · ${s.where}`;
    const closed = !!closedText();
    const init = getValues(), notice = s.id === 1 && !closed ? privacyNotice({ side: noticeSide(init, s.side) }) : null;   // the AWAY notice follows "Have you replied before?"
    const ff = closed ? null : fieldsForm({ keys: s.keys, id, init, side: s.side, onValid: (value) => submit(s, value), onChange: (v) => notice?.setSide(noticeSide(v, s.side)) });
    const form = ff ? ff.form : h('form', { novalidate: true, onsubmit: (ev) => ev.preventDefault() }, closedNote());
    const row = h('div', { class: 'row' });
    if (s.challenge && challenges[s.challenge]) row.append(h('button', { class: 'btn', type: 'submit', disabled: closed, onclick: () => { mode = 'play'; }, text: 'Take the challenge' }));
    row.append(h('button', { class: s.challenge && challenges[s.challenge] ? 'btn ghost' : 'btn', type: 'submit', disabled: closed, onclick: () => { mode = 'skip'; }, text: s.skipLabel }));
    form.append(row);
    return [h('p', { class: 'kicker', id: id + '-k', text: kicker }), h('p', { text: BLURB[s.k] }),
      ...(notice ? [notice] : []), form,
      h('div', { class: 'row' }, h('button', { class: 'linkbtn', type: 'button', onclick: () => api.close({ suppress: true }), text: 'Not now' }))];
  }
  function openCard(s, opts = {}) {
    open = s; arriving = null; hud.hideHint();
    hud.showCard(cardFor(s), { labelledBy: 'st-' + s.k.replace(':', '-') + '-k', kind: 'station:' + s.k, ...opts });
  }
  function submit(s, value) {
    if (open !== s) return;
    const play = mode === 'play' && s.challenge && challenges[s.challenge];
    mode = 'play'; onSave(s, value); open = null; hud.hideCard();
    if (!play) { complete(s, { value, skipped: true }); return; }
    run(s, value);
  }
  // play the station's challenge: its camera move, then its own input; the chip carries the instruction and a visible Skip
  function run(s, value) {
    const c = challenges[s.challenge]; busy = s; onChallenge?.(s, true); hideBeacons();
    c.prepare(s, () => {
      if (busy !== s) return;
      c.start({ station: s, value, onResult: (r) => { if (busy === s) complete(s, { value, ...r }); }, onSkip: () => { if (busy !== s) return; c.stop(); hud.hideChip(); complete(s, { value, skipped: true }); } });
    });
  }
  function complete(s, r) {
    if (done.has(s.k)) return;
    if (busy === s) { busy = null; challenges[s.challenge]?.stop(); onChallenge?.(s, false); }
    hud.hideChip(); if (open === s) { open = null; hud.hideCard(); }
    done.set(s.k, r); if (s.tex) drawBoard(s);
    onComplete(s, r);
  }
  function hideBeacons() { for (const s of list) s.beacon.g.visible = false; }

  // ---- arrival: a short camera move to the stand point, looking between the board and the feature, then the card ----------------------------------
  const PACE = { arrive: 2.2, arriveFov: 55 };
  function arrive(s, { instant = false } = {}) {
    if (!available(s) || busy || open === s) return false;
    if (open) api.close();
    roam.stop(); arriving = s; away.delete(s.k);
    const a = anglesFor([s.stand[0], roam.EYE, s.stand[1]], s.focus), near = dist(s) < 0.3;
    if (instant || near) { roam.teleport(s.stand[0], s.stand[1], { yaw: a.yaw, pitch: a.pitch }); openCard(s, { instant }); return true; }
    // a short dolly that arcs round the station (the bulge always swings away from what it looks at, so the path never doubles back), a little crane lift
    // at the middle, the station held in frame the whole way, and a subtle push-in to the arrival lens; it ends exactly in the guest's eye line at the stand
    const cx = roam.pos.x, cz = roam.pos.z, dx = s.stand[0] - cx, dz = s.stand[1] - cz, L = Math.hypot(dx, dz), mx = (cx + s.stand[0]) / 2, mz = (cz + s.stand[1]) / 2;
    let nx = -dz / L, nz = dx / L; if (nx * (mx - s.focus[0]) + nz * (mz - s.focus[2]) < 0) { nx = -nx; nz = -nz; }
    const off = Math.min(1.8, Math.max(0.6, 0.4 * L)), focus = new THREE.Vector3(...s.focus);
    roam.glide({ pts: [new THREE.Vector3(mx + nx * off, roam.EYE + 0.35, mz + nz * off), new THREE.Vector3(s.stand[0], roam.EYE, s.stand[1])], look: focus, yaw: a.yaw, pitch: a.pitch, fov: PACE.arriveFov,
      dur: PACE.arrive, cine: true, say: `Arriving at station ${s.id}, ${s.where}`, done: () => { if (arriving !== s) return; arriving = null; if (canOpen()) openCard(s); } });   // the guest may have left the roam (fast lane)
    return true;
  }

  addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && open && !ev.defaultPrevented) { ev.preventDefault(); api.close({ suppress: true }); } }, { signal });

  const api = {
    list, byK, done, next, remaining, available, PACE,
    pickables: () => [...list.filter((s) => s.id === 1).map((s) => s.kiosk), ...list.filter((s) => s.boardMesh).map((s) => s.boardMesh)],
    obstacles: () => obstacles,
    current: () => open, busy: () => busy, arriving: () => arriving,
    arrive, open: (k) => { const s = byK(k); if (s) openCard(s, { instant: true }); return !!s; },
    close({ suppress = false } = {}) { arriving = null; if (!open) return; if (suppress) away.add(open.k); open = null; hud.hideCard(); },
    complete, run,
    // staging (capture views, dev): mark a station finished without its completion side effects
    mark(k, r = { skipped: true }) { const s = byK(k); if (!s) return; done.set(s.k, r); if (s.tex) drawBoard(s); },
    // a tap on a board or a kiosk walks there (the proximity check then opens it)
    walkTo(s, onArrive) { roam.walkTo(s.stand[0], s.stand[1], { onArrive: () => { if (available(s)) arrive(s); onArrive?.(); }, within: 0.5 }); },
    step(t) {
      // beacons: the guide's next station (or both kiosks before a side is chosen), hidden while busy or once the guest is right there
      const nx = next(), side = getSide();
      for (const s of list) {
        const on = !busy && !open && !arriving && (s === nx || (!side && s.id === 1 && !done.has(s.k))) && dist(s) > 3.4;
        s.beacon.g.visible = on;
        if (on) {   // pulse (not under reduced motion) times a distance fade: full beyond 30 m, 0.15 at 6 m; the kiosk beacons on the plaza stay full
          const f = s.id === 1 ? 1 : 0.15 + 0.85 * Math.min(1, Math.max(0, (dist(s) - 6) / 24)), p = reducedMotion() ? 0.6 : 0.5 + 0.5 * Math.sin(t * 2.4);
          s.beacon.col.material.opacity = (0.4 + 0.25 * p) * f; s.beacon.ring.material.opacity = 0.8 * Math.max(0.4, f); s.beacon.ring.scale.setScalar(reducedMotion() ? 1 : 1 + 0.12 * p);
        }
      }
      // proximity: open within NEAR, close beyond FAR, forget a suppression beyond FAR
      for (const k of [...away]) if (dist(byK(k)) > FAR) away.delete(k);
      if (open && dist(open) > FAR) api.close();
      if (!canOpen() || busy || arriving || roam.gliding) return;
      for (const s of list) if (!open && available(s) && !away.has(s.k) && dist(s) <= NEAR) { arrive(s); break; }
    },
    state: () => ({ open: open?.k ?? null, busy: busy?.k ?? null, arriving: arriving?.k ?? null, next: next()?.k ?? null, done: Object.fromEntries([...done].map(([k, r]) => [k, { skipped: !!r.skipped, outcome: r.outcome ?? null }])), suppressed: [...away] }),
    reset() { done.clear(); open = null; busy = null; arriving = null; away.clear(); mode = 'play'; for (const s of list) if (s.tex) drawBoard(s); hideBeacons(); },
  };
  return api;
}
