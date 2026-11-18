// matchday-rsvp: the RSVP journey (open-roam). ORGANISERS: edit EVENT and the kit colours in config.js, the questions in fields.js; this file only orchestrates:
//   intro: the invitation ticket floats over the plaza; walk (or tap a choice) to the HOME END or AWAY END kiosk (stations.js, station 1: names + ticket hand-in), or "Just reply" (the fast lane)
//   -> the gate opens and a cinematic walk-out through the tunnel
//   -> HOME: stations 2-4 on the pitch in any order (email + team at the HOME dugout, how to reach you at the corner flag, plus one at the penalty spot) -> full time -> the code card
//   -> AWAY: the kiosk asks "Have you replied before?" (Yes: name + email; No: name + an optional reason, no email); on to the AWAY dugout touchline for the "losing out" ending:
//      the floodlights dim to 45%, the crowd and the squad go quiet and hang their heads, the guest bows theirs, the scoreboard reads HOME 1-0 AWAY (a gentle, wistful miss, never mocking)
//   -> the send step. Email branch: the code card (codecard.js) asks for the emailed 6-digit code and saves. Name-only branch: the decline card saves at once (submit.js submitDecline, no code)
//   -> the confirmation shows only from the server's saved/updated reply (a name-only decline: saved)
// Modules: timeline.js (sim clock), hud.js (overlay), roam.js (third-person rig + camera moves), avatar.js (the guest's footballer), stations.js (registry, boards, beacons, cards),
// challenges/*.js (ticket, dribble, corner, penalty), teammates.js (the squad: passes, waves, celebrations, the full-time huddle), shirt.js (the guest's shirt).
// Everything animated runs on the sim clock, so window.__dbg.simStep(dt) is deterministic.
// User text is only ever written with textContent / text nodes or canvas fillText. No storage; the only network calls are in submit.js.
import * as THREE from 'three';
import { mulberry32, reducedMotion, lerp, smoother, bezier, anglesFor, stickSide } from './util.js';
import { EVENT, TITLE_UC, DATE_LINE, THEME, applyMotion, clean } from './config.js';
import { h, fastLaneForm, confirmCard } from './ui.js';   // three-free builders shared with fallback.js
import { codeCard, declineCard } from './codecard.js';
import { mapServerErrors, withAttending, nameOnly } from './fields.js';
import { closedText, resetForDev } from './submit.js';
import { createTimeline } from './timeline.js';
import { createHud } from './hud.js';
import { createRoam } from './roam.js';
import { createAvatar } from './avatar.js';
import { createCine, SIU } from './cine.js';
import { createStations } from './stations.js';
import { createTicketChallenge, PACE as TICKET_PACE } from './challenges/ticket.js';
import { createPenalty, PENALTY_VIEW, PACE as PENALTY_PACE } from './challenges/penalty.js';
import { createDribble, DRIBBLE_VIEW, PACE as DRIBBLE_PACE } from './challenges/dribble.js';
import { createCorner, CORNER_VIEW, PACE as CORNER_PACE } from './challenges/corner.js';
import { createShirt } from './shirt.js';
import { haptic, HAPTICS } from '../lib/haptics.ts';   // vibrates only where supported, after a first tap, and never under reduced motion
import { shirtFor } from '../lib/keepsake.ts';

const SEED = 20261212;
// Forced waits (sim seconds) on top of the challenges' own PACE and stations.PACE.arrive (2.2 s per arrival). An unskipped HOME run spends about 29.7 s
// in skippable moves the guest cannot act through (kiosk arrival, ticket 2.5, gate + walk-out 6.9, three arrivals, the dribble's lay-off and the corner
// walk 1.2 each, penalty ~0.9, the Siuuu sprint + jump to the landing ~2.6 (cine.js SIU; the corner huddle forms during the crane), the full-time crane
// 2.8, and a ~0.8 s slow-motion beat per goal); budget 30 (measured 29.73 s; e2e/world-walk.spec.ts skips these). A skipped last station keeps the 2.2 s huddle.
// Skip (tap, click, Space, Enter, Escape) always wins over every one of these. Ball flights and the short waits after a goal or a miss are not skippable
// (they are the guest's own result), about 8 s in a full HOME run. The cinematic moves themselves live in cine.js (walk-out rig, slow-mo, tracking, letterbox).
const PACE = { huddle: 2.2, squadHold: 4.0, arm: 0.6, gate: 0.5, walkOut: 6.4, awayWalk: 8.0, fullTime: 2.8, fireworks: 0.9, confetti: 1.6, dim: 1.2, awayPull: 3.2, awayLook: 2.0, awayHold: 2.0, awayEnd: 1.6, awayDim: 0.45, hint: 6 };
const FLIP = THEME.motion.ms.flip / 1000;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const easeFlip = bezier(...THEME.motion.ease.flip.match(/[\d.]+/g).map(Number));
const clip = (s, n) => { s = clean(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const HOME_END = [-6, 47];               // where the walk-out leaves a HOME guest: on the pitch, clear of the south goal
const AWAY_SPOT = [-33.5, -8];           // the AWAY dugout touchline
const SCOREBOARD = [0, 20.8, -82];
const BOARD_CORNERS = [[-11.4, -3.9], [11.4, -3.9], [-11.4, 3.9], [11.4, 3.9]].map(([x, y]) => new THREE.Vector3(SCOREBOARD[0] + x, SCOREBOARD[1] + y, SCOREBOARD[2] + 0.32));   // the bezel
// The five staged views (window.__views, capture). __setView(i) applies the stage, not just the camera.
export const VIEWS = {
  gates: { pos: [0, 1.7, 136], target: [0, 3.6, 108], fov: 58 },
  dribble: DRIBBLE_VIEW,
  corner: CORNER_VIEW,
  penalty: PENALTY_VIEW,
  aerial: { pos: [190, 92, 128], target: [0, 8, 6], fov: 50 },
};

export function createFlow(world, { audio, fx, teammates }) {
  const { camera, controls: ctl, sim, crowd, scoreboard, plaza, taker } = world;
  // Every window/document listener carries { signal }, so dispose() (the fallback page) releases the keyboard and the pointer in one call.
  const ac = new AbortController(), { signal } = ac; let disposed = false;
  const syncMotion = () => { document.documentElement.dataset.motion = reducedMotion() ? 'reduce' : 'full'; applyMotion(reducedMotion()); };
  syncMotion(); try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncMotion, { signal }); } catch {}
  taker.object.visible = false;   // the guest plays as their own avatar (avatar.js); the scene's taker stays hidden

  const fresh = () => ({ stage: 'intro', side: null, values: {}, score: 0, rng: mulberry32(SEED), hinted: false, walked: 0, staged: false, siuuu: null });
  let S = fresh();
  const shirtName = (n = 16) => clip(S.values.preferredName || S.values.firstName || '', n);   // the name on the back: what they asked to be called, else the first name
  const tl = createTimeline(sim);
  const hud = createHud({ audio, tl });
  const cine = createCine(world, { tl, audio });
  const avatar = createAvatar(world, { tl });
  const roam = createRoam(world, {
    tl, signal, say: hud.say, avatar,
    canMove: () => S.stage === 'intro' || S.stage === 'roam',
    restFov: () => S.stage === 'intro' || (S.stage === 'roam' && !hud.cardOpen() && !stations.arriving()),
    pickables: () => stations.pickables(),
    dynamic: () => [...teammates.obstacles(), ...Object.values(challenges).flatMap((c) => c.obstacles?.() ?? [])],
    onMove: (d) => { if (S.stage === 'intro') leaveIntro(); S.walked += d; if (S.walked > 6) hud.hideHint(); },
    onTap: ({ station }) => {
      if (S.stage === 'intro') leaveIntro();
      const s = station && stations.byK(station);
      if (s && stations.available(s)) stations.walkTo(s);
    },
  });
  const challenges = {
    ticket: createTicketChallenge(world, { tl, hud, roam, audio, signal, seed: SEED }),
    penalty: createPenalty(world, { tl, hud, roam, audio, cine, signal, rng: () => S.rng() }),
    dribble: createDribble(world, { tl, hud, roam, audio, cine, teammates, signal, rng: () => S.rng() }),
    corner: createCorner(world, { tl, hud, roam, audio, cine, teammates, signal }),
  };
  const ticket = challenges.ticket;
  const stations = createStations(world, {
    hud, roam, challenges, signal,
    getSide: () => S.side, getValues: () => S.values,
    onSave: (s, v) => { Object.assign(S.values, v); },
    onComplete: stationDone,
    onChallenge: (s, on) => { if (on) S.stage = 'challenge'; else if (S.stage === 'challenge') S.stage = 'roam'; },
    canOpen: () => S.stage === 'roam',
  });
  // director's addition: the guest's HOME shirt on a peg in the HOME dugout (their name over #30), painted when the HOME kiosk is done
  const shirt = createShirt(world.dugouts.home); world.scene.add(shirt.group);
  roam.setObstacles([...stations.obstacles(), ...Object.values(plaza.sides).map((p) => p.obstacle)]);
  ctl.filter = (ev) => { for (const c of Object.values(challenges)) if (c.active() && c.filter(ev) === false) return false; return true; };
  ctl.onChange = () => { if (S.hinted) hud.hideHint(); };
  addEventListener('resize', () => { if (S.stage === 'intro' && S.walked === 0) stageGates(); ticket.replace(); }, { signal });   // the staging follows the aspect

  // -- skip: pointerdown / click / Space, Enter, Escape jumps every forced move (camera moves, the ticket flight, the end waits) to its end -----------------
  const skippable = () => tl.skippable().length > 0;
  function skipNow(byKey) {
    if (!skippable()) return false;
    hud.hideToast(); tl.skipAll(); syncSkip(); syncBars(true); if (byKey) hud.say('Skipped');
    return true;
  }
  const syncSkip = () => hud.setSkipVisible(tl.skippable().some((t) => t.dur >= 1));
  const exempt = (ev) => !!ev.target.closest?.('#mute, #fastlink, #stickside');
  addEventListener('pointerdown', (ev) => { if (!exempt(ev) && skipNow(false)) ev.preventDefault(); }, { capture: true, signal });   // preventDefault: no focus steal, and roam.js never also starts a walk
  addEventListener('click', (ev) => { if (ev.detail === 0 && !exempt(ev)) skipNow(true); }, { capture: true, signal });   // detail 0: keyboard / assistive-tech activation
  addEventListener('keydown', (ev) => { if (!ev.repeat && !ev.ctrlKey && !ev.metaKey && !ev.altKey && (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'Escape') && skippable()) { ev.preventDefault(); skipNow(true); } }, { capture: true, signal });

  // -- the gates: one open turnstile per END ----------------------------------------------------------------------------------------------
  const laneBase = new Map(Object.values(plaza.sides).map(({ lane }) => [lane, { e: lane.readerLight.material.emissive.getHex(), i: lane.readerLight.material.emissiveIntensity, arm: lane.arm.rotation.z }]));
  function openGate(side, instant = false) {
    const lane = plaza.sides[side].lane, m = lane.readerLight.material, base = laneBase.get(lane).arm;
    m.emissive.setHex(0x22ff66); m.emissiveIntensity = 5; if (!instant) audio.beep();
    const turn = tl.tween(PACE.arm, (u) => { lane.arm.rotation.z = base + (2 * Math.PI / 3) * smoother(u); }, null, { skip: true });
    if (instant || reducedMotion()) tl.finish(turn);
  }
  const resetGates = () => { for (const [lane, b] of laneBase) { lane.readerLight.material.emissive.setHex(b.e); lane.readerLight.material.emissiveIntensity = b.i; lane.arm.rotation.z = b.arm; } };
  // the walk-out (cine.js walkOutRig): through the open turnstile, a dip to black, a slow push up the darker players' tunnel while the floodlight glow and
  // the crowd build, then out over the south goal. HOME: the crowd roars as the guest emerges and a crane rise reveals the packed bowl (the scoreboard
  // reads "Now joining the squad") before settling to eye height facing the next station. AWAY: the same tunnel, then across to the AWAY dugout touchline.
  function walkOut(side) {
    S.stage = 'cine';
    const home = side === 'home', end = home ? HOME_END : AWAY_SPOT, nx = home && stations.next();
    const a = anglesFor([end[0], 1.7, end[1]], home ? (nx ? [nx.stand[0], 1.2, nx.stand[1]] : [0, 1.2, 0]) : [-37.4, 1.0, AWAY_SPOT[1]]);
    const dur = home ? PACE.walkOut : PACE.awayWalk;
    const rig = cine.walkOutRig({ side, laneX: plaza.sides[side].lane.x, end, endYaw: a.yaw, endPitch: a.pitch, dur, onExit: home ? () => { audio.roar(0.9); crowd.cheer(0); } : null });
    if (home) audio.sting();   // the PA's sting as the name goes up; the stands roar when the guest walks out of the tunnel
    roam.glide({ rig, dur, cine: true, say: home ? 'Walking out through the tunnel' : 'Walking out to the AWAY dugout',
      done: home ? () => { S.stage = 'roam'; showHint(); squadTimer = tl.after(PACE.squadHold, () => { squadTimer = null; guideBoard(0); }); } : awayEnd });
  }

  // -- scoreboard: the guide. HOME n-0 AWAY (a split-flap flip when a station is done) and the next station by name ----------------------------
  let flipTween = null, squadTimer = null;
  // director's addition: as the HOME gate opens, the board announces the guest (the walk-out faces it), then hands back to the guide a few seconds after
  function squadBoard() {
    tl.cancel(squadTimer); squadTimer = null; tl.cancel(flipTween); flipTween = null;
    scoreboard.draw([{ text: TITLE_UC, size: 64, color: THEME.color.scoreboardDim }, { text: 'THE NEW SIGNING', size: 104, color: THEME.color.scoreboardText, weight: 800 },
      { text: `#30 ${shirtName(20).toUpperCase()}`, size: 170, color: THEME.color.scoreboardAccentGoal, weight: 800 }]);
    hud.say(`The new signing, number 30, ${shirtName(20)}`);
  }
  function guideBoard(from) {
    tl.cancel(squadTimer); squadTimer = null;
    const nx = stations.next();
    const lines = [{ text: TITLE_UC, size: 70, color: THEME.color.scoreboardDim }, { parts: ['HOME ', { flip: [from ?? S.score, S.score] }, '–0 AWAY'], size: 200, color: THEME.color.scoreboardText, weight: 800 },
      { text: nx ? `Next: ${nx.short} · ${nx.where}` : 'All stations done', size: 92, color: THEME.color.scoreboardAccentGoal, weight: 800 }];
    tl.cancel(flipTween); flipTween = null;
    if (from == null || from === S.score || reducedMotion()) scoreboard.draw(lines); else flipTween = tl.tween(FLIP, (u) => scoreboard.draw(lines, { p: easeFlip(u) }));
  }

  // -- stations: what happens when one is finished (played or skipped: either way it is a point) ------------------------------------------------------
  function stationDone(s, r) {
    const prev = S.score; S.score++;
    if (!r.skipped && s.id === 1) haptic(HAPTICS.stamp);   // the ticket is handed in
    else if (!r.skipped && r.outcome === 'goal') haptic(HAPTICS.strike);   // a goal. No buzz for a skip, a save or a miss
    if (s.id === 1) {
      S.side = s.side; S.stage = 'cine'; hud.hideHint(); if (s.side === 'away') avatar.setKit('away');   // the guest changes into the away strip
      roam.setZones({ [s.side === 'home' ? 'laneHome' : 'laneAway']: true, inside: true, pitch: true });
      openGate(s.side); if (s.side === 'home') { squadBoard(); shirt.draw(shirtName()); avatar.setName(shirtName()); }
      tl.after(PACE.gate, () => walkOut(s.side), { skip: true });
      return;
    }
    guideBoard(prev);
    if (r.skipped) hud.toast('Answer kept · point banked', 1.8);
    if (stations.remaining() === 0) { if (!r.skipped && r.outcome === 'goal') siuuu(); else finale(); return; }   // the last station scored: the Siuuu
    S.stage = 'roam';
  }
  // director's addition: before the whistle, four teammates jog in and form a half circle facing the guest, who turns to face its centre and closes the open
  // side (the ring sits ahead of the guest, away from the scoreboard, so full time turns to it). The camera swings round behind the guest's avatar on the boom
  // (it stays put); the ring is 1.1 m in radius, so a 0.45 m teammate clears its neighbours and the 0.35 m guest.
  const onPitch = (x, z) => Math.abs(x) <= 38.5 && Math.abs(z) <= 57;
  const guestAt = () => V3(roam.pos.x, roam.EYE, roam.pos.z);   // the guest's eye line over their feet (roam.pos)
  function finale() {
    S.stage = 'cine'; hud.hideHint(); teammates.settle(); waveSync(null);
    const p = guestAt(), yaw = anglesFor(p.toArray(), SCOREBOARD).yaw + Math.PI;
    teammates.huddle(p.x, p.z, yaw, { run: 1.1, inside: onPitch }); avatar.face(Math.atan2(-Math.sin(yaw), -Math.cos(yaw)));   // the guest turns to the ring's centre
    tl.after(1.1, () => avatar.setPose('huddle'));
    roam.glide({ yaw, pitch: -0.18, fov: 70, dur: PACE.huddle, cine: true, say: 'Your teammates huddle round you before the whistle' });
    tl.after(PACE.huddle, fullTime, { skip: true });
  }
  // the last HOME station (whichever of 2-4 finishes last) ended in a goal: the guest sprints to the nearest corner flag and does the Siuuu (cine.js
  // siuuuRig drives the camera and the feet, avatar.siuuu the jump, the half turn and the pose), the crowd roars "Siuuu", and the full-time huddle forms
  // there: the four teammates run in and mob the guest while the full-time crane lifts off the corner toward the scoreboard. Every step is skippable (one
  // skip lands on the confirm card, as the huddle did); reduced motion cuts to the pose. The landing spot is SIUUU.in metres inside the flag, toward the
  // centre spot; the run avoids roam's obstacles (a detour through a side point when the straight line is blocked).
  const FLAGS = [[34, 52.5], [-34, 52.5], [34, -52.5], [-34, -52.5]], SIUUU = { in: 2.0, hold: 0.8, mobAt: 0.1, huddleAt: 1.1 };
  function planSiuuu(x, z) {
    const F = FLAGS.reduce((b, f) => (Math.hypot(f[0] - x, f[1] - z) < Math.hypot(b[0] - x, b[1] - z) ? f : b)), fl = Math.hypot(F[0], F[1]);
    const L = V3(F[0] - F[0] / fl * SIUUU.in, 0, F[1] - F[1] / fl * SIUUU.in), P0 = V3(x, 0, z);
    if (P0.distanceTo(L) < 1.2) P0.add(V3(-F[0] / fl, 0, -F[1] / fl).multiplyScalar(1.2 - P0.distanceTo(L)));   // right on the spot: a short run-up from the pitch side
    const clear = (c) => { const n = Math.max(2, Math.ceil(c.getLength() / 0.4)); for (let i = 1; i <= n; i++) { const q = c.getPointAt(i / n); if (q.distanceTo(P0) > 0.6 && !roam.free(q.x, q.z)) return false; } return true; };
    let curve = new THREE.LineCurve3(P0, L);
    if (!clear(curve)) {
      const d = L.clone().sub(P0).normalize(), mid = P0.clone().lerp(L, 0.5);
      for (const k of [2, -2, 3.5, -3.5, 5, -5, 7, -7]) { const c = new THREE.CatmullRomCurve3([P0, V3(mid.x - d.z * k, 0, mid.z + d.x * k), L], false, 'centripetal'); if (clear(c)) { curve = c; break; } }
    }
    return { F, L, curve };
  }
  function siuuu() {
    S.stage = 'cine'; hud.hideHint(); teammates.settle(); waveSync(null);
    const o = avatar.takeOffset(); roam.pos.x += o.x; roam.pos.z += o.z;   // the figure may stand off its feet point (a run-up, the wheel-away): run from where it is
    const { F, L, curve } = planSiuuu(roam.pos.x, roam.pos.z), T = cine.siuuuTiming(curve.getLength()), tg = curve.getTangentAt(1), al = Math.hypot(tg.x, tg.z) || 1;
    const app = [tg.x / al, tg.z / al];   // the run's last direction, into the corner
    let nIn = [-app[1], app[0]]; if (nIn[0] * -L.x + nIn[1] * -L.z < 0) nIn = [-nIn[0], -nIn[1]];   // the side toward the centre spot (the low camera sits there)
    const face = Math.atan2(-app[0], -app[1]), turn = nIn[0] * app[1] - nIn[1] * app[0] > 0 ? 1 : -1;   // lands facing back down the run, turning by the camera's side
    const mine = S; S.siuuu = { corner: F, land: [+L.x.toFixed(2), +L.z.toFixed(2)], cut: T.cut, take: +T.take.toFixed(2), landed: false, mob: false };
    avatar.siuuu({ take: T.take, air: SIU.air, hold: SIUUU.hold, face, turn, onLand: () => { if (S !== mine) return; S.siuuu.landed = true; audio.siuuu(); crowd.cheer(0); hud.say('Siuuu!'); } });
    const t0 = sim.t, mobT = T.land + SIUUU.mobAt;   // a skip fires the mob early: the teammates are then already round the guest (no jog-in after the skip)
    const mob = () => { if (S !== mine || S.siuuu.mob) return; S.siuuu.mob = true; teammates.huddle(L.x, L.z, Math.atan2(app[0], app[1]), { run: !reducedMotion() && sim.t < t0 + mobT - 1e-6 ? 1e-3 : 1.1, inside: onPitch }); };   // the ring forms on the pitch side, ahead of the guest who landed facing back down the run (the low camera stays clear)
    tl.after(mobT, mob, { skip: true });
    tl.after(T.land + SIUUU.huddleAt, () => { if (S === mine) avatar.setPose('huddle'); }, { skip: true });
    roam.glide({ rig: cine.siuuuRig({ curve, T, nIn, onCut: () => avatar.cut() }), dur: T.total, cine: true, free: true, say: 'Last goal. You sprint to the corner flag for the Siuuu',
      done: () => { if (S === mine && !reducedMotion()) fullTime([camera.position.x, camera.position.z]); } });   // the crane lifts off the corner while the pose holds and the teammates run in
    if (reducedMotion()) { mob(); tl.after(SIUUU.hold, fullTime, { skip: true }); }   // reduced motion: a cut to the pose, held a moment, then full time
  }
  // a point r metres from (x, z) at angle phi from the direction d (unit [dx, dz]), pulled in until it sits over the pitch (the camera never enters the stands)
  const around = (x, z, d, phi, r, y) => {
    const c = Math.cos(phi), sn = Math.sin(phi), ux = d[0] * c - d[1] * sn, uz = d[0] * sn + d[1] * c;
    while (r > 0.5 && !(Math.abs(x + ux * r) <= 37 && Math.abs(z + uz * r) <= 56)) r -= 0.25;
    return V3(x + ux * r, y, z + uz * r);
  };
  const awayFromBoard = (x, z) => { const dx = x - SCOREBOARD[0], dz = z - SCOREBOARD[2], l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
  // full time: on the pitch, a crane that pulls back over the huddle, orbits half round it and rises to ~8 m on the far side, looking down at the squad
  // and then up across the Mexican wave to the scoreboard (the final card sits over that shot). Off the pitch (the fast lane from the plaza): a turn to the board.
  function fullTime(from) {   // from: [x, z] where the camera stands now, so the crane orbits up through that side (the Siuuu's low corner shot)
    S.stage = 'fulltime'; hud.hideHint(); audio.whistle(); crowd.wave(32); tl.cancel(flipTween); flipTween = null;   // a running guide flip must not redraw over full time
    scoreboard.draw([{ text: TITLE_UC, size: 64, color: THEME.color.scoreboardDim }, { text: `FULL TIME · HOME ${S.score}–0`, size: 118, color: THEME.color.scoreboardText, weight: 800 }, { parts: ['HOME ', { flip: [S.score, S.score] }, '–0 AWAY'], size: 150, color: THEME.color.scoreboardAccent, weight: 800 }]);
    const p = guestAt(), say = 'Full time. You win, and the crowd celebrates.';
    if (onPitch(p.x, p.z)) {
      const d = awayFromBoard(p.x, p.z), f = from && [from[0] - p.x, from[1] - p.z], phi0 = f && Math.atan2(d[0] * f[1] - d[1] * f[0], d[0] * f[0] + d[1] * f[1]);
      const sg = f ? Math.sign(phi0) || 1 : Math.abs(p.x + d[1] * 6) < Math.abs(p.x - d[1] * 6) ? -1 : 1;   // orbit through the camera's side, else the side nearer the centre line
      const E = around(p.x, p.z, d, sg * 0.14, 8.5, 8.2), centre = V3(p.x, 1.1, p.z), board = V3(SCOREBOARD[0], 16, SCOREBOARD[2]);
      const pts = f ? [around(p.x, p.z, d, phi0, 3.4, 3.0), around(p.x, p.z, d, (phi0 + sg * 0.14) / 2, 6.2, 6.4), E] : [around(p.x, p.z, d, sg * Math.PI, 2.6, 3.2), around(p.x, p.z, d, sg * Math.PI * 0.55, 6.2, 6.4), E];
      const toBoard = anglesFor(E.toArray(), board.toArray()), toSquad = anglesFor(E.toArray(), centre.toArray());
      const lk = V3();
      roam.glide({ pts, look: (u) => lk.lerpVectors(centre, board, smoother(Math.max(0, (u - 0.35) / 0.6))),
        yaw: toBoard.yaw, pitch: (toBoard.pitch + toSquad.pitch) / 2 + 0.05, fov: 66, dur: PACE.fullTime, cine: true, free: true, say, done: () => roam.detach() });   // camera only; hold the high shot (the rig would pull it back onto the boom)
    } else { const a = anglesFor(p.toArray(), SCOREBOARD); roam.glide({ yaw: a.yaw, pitch: a.pitch, fov: 66, dur: PACE.fullTime, cine: true, say }); }
    tl.after(PACE.fireworks, () => fx.startFireworks()); tl.after(PACE.confetti, () => fx.startConfetti());
    tl.after(PACE.fullTime, showCode, { skip: true });
  }
  // AWAY, "losing out": the floodlights dim to 45%, the stands go still and quiet, the squad and the guest hang their heads, and the scoreboard reads a loss
  // (HOME 1-0 AWAY, "You'll be missed", the guest's shirt name). Warm and wistful, never mocking: nobody boos. Then the send. On the pitch the camera pulls slowly
  // back from the touchline and rises a little while the lights go down, turning from the dugout to the bowl and the board.
  function awayEnd() {
    S.stage = 'awayEnd'; hud.hideHint(); tl.cancel(flipTween); flipTween = null;
    const p = guestAt(), pull = onPitch(p.x, p.z), name = shirtName(26);
    const from = world.lightLevel ?? 1, dim = tl.tween(pull ? PACE.awayPull : PACE.dim, (u) => world.setLights(lerp(from, PACE.awayDim, smoother(u))), null, { skip: true });
    if (reducedMotion()) tl.finish(dim);
    crowd.hush(true); audio.hush(true); teammates.settle(); teammates.droop(true); avatar.setPose('dejected');   // the stands fall quiet; heads drop
    scoreboard.draw([{ text: 'FULL TIME', size: 64, color: THEME.color.scoreboardDim }, { text: 'HOME 1–0 AWAY', size: 170, color: THEME.color.scoreboardText, weight: 800 },
      { text: "YOU'LL BE MISSED", size: 96, color: THEME.color.accentAway, weight: 800 }, ...(name ? [{ text: name.toUpperCase(), size: 70, color: THEME.color.scoreboardDim, weight: 700 }] : [])]);
    const say = "Full time. The crowd falls quiet. The scoreboard reads: you'll be missed.", send = (wait = PACE.awayEnd) => tl.after(wait, showCode, { skip: true });
    if (pull) {
      const d = awayFromBoard(p.x, p.z), E = V3(p.x + d[0] * 10, 3.0, p.z + d[1] * 10), mid = V3(p.x + d[0] * 4.5, 2.1, p.z + d[1] * 4.5), board = V3(SCOREBOARD[0], 14, SCOREBOARD[2]);
      const a = anglesFor(E.toArray(), board.toArray());
      roam.glide({ pts: [mid, E], look: board, yaw: a.yaw, pitch: a.pitch, fov: 60, dur: PACE.awayPull, cine: true, free: true, say, done: () => { roam.detach(); send(); } });   // camera only
    } else { const a = anglesFor(p.toArray(), SCOREBOARD); roam.glide({ yaw: a.yaw, pitch: a.pitch, fov: 62, dur: PACE.awayLook, cine: true, say, done: () => send(PACE.awayHold) }); }
  }

  // -- intro: the invitation (the ticket floats high in the frame, the card sits under it) ------------------------------------------------------------
  function showIntro({ instant = false } = {}) {
    S.stage = 'intro'; stations.close(); roam.stop(); ticket.float();
    const shut = closedText();
    if (shut) {   // no invite key (or the server refused it), or production not configured: nothing is asked and nothing is sent
      hud.showCard([h('p', { class: 'kicker', text: DATE_LINE }), hud.heading('i-h', "You've been called up"), h('p', { class: 'closed', role: 'status', text: shut })], { wide: true, cls: 'under', labelledBy: 'i-h', kind: 'intro-closed', instant });
      return;
    }
    const mk = (side, title, text) => h('button', { class: 'choice ' + side, type: 'button', onclick: () => pickSide(side) }, h('b', { text: title }), h('span', { text }));
    hud.showCard([h('p', { class: 'kicker', text: DATE_LINE }), hud.heading('i-h', "You've been called up"), h('p', { text: EVENT.tagline }),
      h('p', { class: 'help', text: 'Walk to your end of the ground, or skip the walk.' }),
      h('div', { class: 'choices' }, mk('home', 'HOME END', "I'll be there"), mk('away', 'AWAY END', "I can't make it"),
        h('button', { class: 'choice fast', type: 'button', onclick: () => showFast() }, h('b', { text: 'JUST REPLY' }), h('span', { text: 'A short form, under a minute' })))], { wide: true, cls: 'under', labelledBy: 'i-h', kind: 'intro', instant });
  }
  function leaveIntro() { if (S.stage !== 'intro') return; ticket.hide(); hud.hideCard(); S.stage = 'roam'; roam.resetBoom(); showHint(); }
  // the invitation's staging: a low camera far back on the plaza's centre line looks at the two END signs (under the floating ticket); the guest stands off
  // to the HOME side, clear of the signs, the lanes and the ticket, its feet above the bottom card: u of the half-width left of centre, d metres out (the
  // left quarter on a landscape screen, the strip left of the HOME sign on a phone, where the look drops so the signs clear the ticket). leaveIntro eases
  // the camera back onto the roaming boom.
  const INTRO = { pos: [0, 0.6, 146.4], wide: { d: 5.5, u: -0.56, ty: 2.6 }, tall: { d: 6.5, u: -0.86, ty: 1.0 } };
  function stageGates(ease = false) {
    const a = innerWidth / innerHeight, o = a < 1 ? INTRO.tall : INTRO.wide, tanH = Math.tan(THREE.MathUtils.degToRad(VIEWS.gates.fov) / 2) * a;
    const feet = [+(o.d * o.u * tanH).toFixed(2), INTRO.pos[2] - o.d];
    place(VIEWS.gates); roam.frame({ feet, pos: INTRO.pos, target: [0, o.ty, 113.6] }, { ease });
  }
  function pickSide(side) {
    audio.unlock(); leaveIntro(); const s = stations.byK('1:' + side), sx = side === 'home' ? -1 : 1; if (!stations.available(s)) return;
    // the staged start stands on the HOME side: the walk to the other END first steps round the lane divider's head (its rail runs out to z = 130.2)
    if (roam.pos.x * sx < 0.5 && roam.pos.z > 131) roam.walkTo(sx * 1.6, 131.6, { onArrive: () => { if (S.stage === 'roam' && !S.side) stations.walkTo(s); }, within: 0.6 });
    else stations.walkTo(s);
  }
  function showHint() { if (S.hinted) return; S.hinted = true; hud.hint(hud.isTouch() ? `Drag the ${stickSide.get()} side to walk` : 'WASD or arrows to walk, Shift to run, drag to look', PACE.hint); }
  function walkToNext() {
    if (!S.side) { showIntro(); return; }
    const nx = stations.next(); if (!nx || S.stage !== 'roam') return;
    audio.unlock(); hud.hideHint(); hud.say(`Walking to station ${nx.id}, ${nx.where}`); stations.walkTo(nx);
  }

  // -- guide: the centred "Walk to next station" button and the corner "Just reply" link (secondary, only while roaming: the intro card carries it), synced each step (DOM writes only on change) ---
  let guideKey = '', fastShown = null;
  function syncGuide() {
    let key = 'none', title = '', sub = '', fn = null;
    if (S.stage === 'roam' && !hud.cardOpen() && !roam.gliding && !stations.busy() && !stations.arriving()) {
      if (!S.side) { key = 'choose'; title = 'Choose your end'; sub = 'HOME or AWAY kiosk'; fn = () => showIntro(); }
      else { const nx = stations.next(); if (nx) { key = 'next:' + nx.k; title = 'Walk to next station'; sub = `${nx.short} · ${nx.where}`; fn = walkToNext; } }
    }
    if (key !== guideKey) { guideKey = key; if (key === 'none') hud.hideWalk(); else hud.walk(title, sub, fn); }
    const fl = S.stage === 'roam' && !closedText() && !stations.busy() && !stations.arriving() && !roam.gliding;   // never mid-arrival: the card would replace the form
    if (fl !== fastShown) { fastShown = fl; hud.fastLink(fl, showFast); }
  }

  // -- fast lane: "Just reply" without playing. One card, one <form> (ui.js) carrying every question, then straight to the code card. ----------------------
  // fix = reopened from the code card with the server's field errors (or the guest's wish to check) over the answers so far.
  function showFast({ fix = false, errors = null } = {}) {
    if (!fix && ((S.stage !== 'intro' && S.stage !== 'roam') || stations.arriving() || roam.gliding)) return;
    if (fix && S.stage !== 'code') return;
    const back = S.stage; S.stage = 'fast'; if (back === 'intro') roam.resetBoom(); roam.stop(); stations.close(); ticket.hide(); hud.hideHint(); hud.hideToast(); audio.unlock();
    const init = withAttending(S.side, S.values);
    const fl = fastLaneForm({ onSend: fastSend, init, errors });
    hud.showCard([h('p', { class: 'kicker', text: EVENT.title }), hud.heading('x-h', fix ? 'Check your answers' : 'Just reply'), fl.form,
      h('div', { class: 'row' }, h('button', { class: 'linkbtn', type: 'button', onclick: () => { if (S.stage !== 'fast') return; hud.hideCard(); if (fix) showCode(); else if (back === 'intro') { stageGates(true); showIntro(); } else S.stage = 'roam'; }, text: fix ? 'Back to my code' : 'Back to the game' }))],
    { labelledBy: 'x-h', cls: 'fast', kind: 'fast' });
  }
  function fastSend({ side, values }) {
    if (S.stage !== 'fast') return;   // a stale form cannot send twice
    S.side = side; S.values = { ...values }; S.score = 4; hud.hideCard();
    showCode();
  }

  // -- data: submit.js is the one transport. The code card (codecard.js) requests the emailed code when it opens and saves on a good code; the confirmation renders ONLY from the
  // server's saved/updated reply (a returning guest gets "welcome back", their seat kept). A refused code or a failed call stays on the card. -------------------------------
  let code = null;   // the send step's card: codeCard (email branch) or declineCard (name-only)
  function showCode() {
    if (S.staged || S.stage === 'done') return;   // a staged view (capture, dev) has no real answers: it never asks for a code
    const shut = closedText(); if (shut) { showClosed(); return; }
    code?.dispose(); S.stage = 'code'; hud.hideWalk(); stations.close();
    const mine = S, side = S.side, answers = () => withAttending(side, S.values);
    const to = { onSaved: (r) => { if (S === mine) showConfirmation(r); }, onFix: (errs) => { if (S === mine) showFast({ fix: true, errors: serverErrors(errs) }); }, onClosed: () => { if (S === mine) showClosed(); } };
    const plain = nameOnly(answers());   // "Have you replied before?" = No: no email and no code, the reply goes straight to submitDecline
    code = plain ? declineCard({ getValues: answers, ...to }) : codeCard({ side, getValues: answers, setEmail: (e) => { S.values.email = e; }, ...to });
    hud.showCard(code.nodes, { labelledBy: plain ? 'dc-k' : 'cc-k', head: true, kind: plain ? 'decline' : 'code' });
    code.start();
  }
  const serverErrors = (errs) => mapServerErrors(errs, true);
  const snapshot = () => ({ side: S.side, ...S.values });
  function showClosed() {
    code?.dispose(); code = null; S.stage = 'closed';
    hud.showCard([h('p', { class: 'kicker', text: DATE_LINE }), hud.heading('i-h', "You've been called up"), h('p', { class: 'closed', role: 'status', text: closedText() ?? '' })], { labelledBy: 'i-h', head: true, kind: 'closed' });
  }
  function showConfirmation(r) {
    code?.dispose(); code = null; S.stage = 'done';
    // a yes or maybe gets its real number: the dugout shirt and the footballer's back take the preferred-or-first name over the seat (the placeholder 30 until now)
    const kit = r.attending === 'no' ? null : shirtFor({ ...r.answers, firstName: r.firstName, ticketNo: r.ticketNo });
    if (kit) { shirt.draw(kit.name, kit.number); avatar.setName(kit.name, kit.number); }
    hud.showCard(confirmCard(r), { labelledBy: 'd-h', head: true, kind: 'confirm' });
  }
  if (import.meta.env.DEV) Object.defineProperty(window, '__rsvp', { get: snapshot, configurable: true });

  // -- reset + staged views ------------------------------------------------------------------------------------------------------------------------------
  function reset() {
    code?.dispose(); code = null; tl.clear(); cine.reset(); for (const c of Object.values(challenges)) { c.stop(); c.reset?.(); } ticket.reset();
    stations.reset(); roam.reset(); resetGates(); world.setLights(1); crowd.hush(false); audio.hush(false);
    scoreboard.draw(); fx.stop(); crowd.wave(false); teammates.reset();
    hud.reset(); guideKey = ''; fastShown = null; S = fresh(); resetForDev(); shirt.draw(''); avatar.reset(); waving = null; chipTop = null; hud.setChipTop(null); squadTimer = null;
    place(VIEWS.gates);
  }
  // a view with feet (a third-person challenge framing) puts the avatar there with the camera's look; else the guest stands at pos looking at target
  const place = (v) => (v.feet ? roam.teleport(v.feet[0], v.feet[1], { ...anglesFor(v.pos, v.target), fov: v.fov }) : roam.teleport(v.pos[0], v.pos[2], { look: v.target, fov: v.fov }));
  // HOME, past the gate, with the given stations already finished
  function stageHome(ks) {
    S.side = 'home'; for (const k of ks) stations.mark(k); S.score = ks.length;
    openGate('home', true); roam.setZones({ laneHome: true, inside: true, pitch: true }); guideBoard();
  }
  // a staged challenge view: the guest at the station, its challenge started (forced moves jumped to their end), ready to aim
  function playStage(k) {
    const s = stations.byK(k); roam.teleport(s.stand[0], s.stand[1], { look: s.focus }); S.stage = 'roam'; S.hinted = true;
    stations.run(s, undefined); tl.skipAll(); hud.hideToast();
  }
  // Production keeps only the capture contract's safe views (the invitation, the aerial), and only before the guest has started: from the intro or the aerial,
  // never once a station is reached or a value entered (that is always past the intro). Dev (capture, smoke, scratch suites) stages every view.
  function goto(name) {
    if (!import.meta.env.DEV && !((name === 'gates' || name === 'aerial') && (S.stage === 'intro' || S.stage === 'preview'))) return null;
    reset(); S.staged = name !== 'gates' && name !== 'intro';
    if (name === 'gates' || name === 'intro') { stageGates(); showIntro({ instant: true }); }
    else if (name === 'roam') { stageHome(['1:home']); roam.teleport(HOME_END[0], HOME_END[1], { look: [-32.6, 1.2, 8] }); S.stage = 'roam'; S.hinted = true; }
    else if (name === 'dribble') { stageHome(['1:home']); playStage('2'); challenges.dribble.stageAt(...DRIBBLE_VIEW.at); }
    else if (name === 'corner') { stageHome(['1:home', '2']); playStage('3'); }
    else if (name === 'penalty') { stageHome(['1:home', '2', '3']); place(PENALTY_VIEW); S.stage = 'roam'; S.hinted = true; stations.run(stations.byK('4'), undefined); }
    else if (name === 'aerial') { roam.detach(); const v = VIEWS.aerial, a = anglesFor(v.pos, v.target); camera.position.set(...v.pos); camera.fov = v.fov; camera.updateProjectionMatrix(); ctl.yaw = a.yaw; ctl.pitch = a.pitch; ctl.apply(); S.stage = 'preview'; }
    else throw new Error('goto: gates|roam|dribble|corner|penalty|aerial');
    if (import.meta.env.DEV) window.__stage = name;
    return name;
  }

  // -- per sim step: the timeline first (camera moves), then the rig, the stations (proximity, beacons), the ticket's hover, the overlay ---------------------
  function step(dt) {
    if (disposed) return;
    tl.step(); roam.step(dt); for (const c of Object.values(challenges)) c.step?.(dt); stations.step(sim.t); avatar.step(dt);   // the avatar last: it stands where roam and the challenges put the feet
    if (S.stage === 'intro') ticket.replace();
    ticket.step(sim.t);
    syncSkip(); syncGuide(); syncWave(); syncChip(); syncBars(false, dt);
  }
  // the letterbox: in while a cinematic move or a goal's slow-motion beat is live (both skippable); dropped at once whenever a card or a challenge chip is up
  function syncBars(snap, dt = 0) {
    const want = roam.cine || cine.slow, hard = hud.cardOpen() || !!hud.chipText();
    if (snap) cine.snap(want && !hard); else cine.step(dt, { want, hard });
  }
  // director's addition: the teammate nearest the next station turns to the guest and waves once they are within 25 m (HOME, roaming, nothing open)
  let waving = null;
  function waveSync(id) {
    if (id !== waving) { if (waving) { teammates.wave(waving, false); teammates.face(waving); } waving = id; }
    if (waving) { teammates.wave(waving, true); teammates.face(waving, roam.pos.x, roam.pos.z); }
  }
  function syncWave() {
    const nx = S.side === 'home' && S.stage === 'roam' && !hud.cardOpen() && !stations.busy() && !stations.arriving() ? stations.next() : null;
    let id = null;
    if (nx) {
      let best = Infinity;
      for (const I of teammates.idle) { const d = Math.hypot(I.x - nx.stand[0], I.z - nx.stand[1]); if (d < best && !I.drive) { best = d; id = I.id; } }
      const I = id && teammates.get(id); if (!I || Math.hypot(I.x - roam.pos.x, I.z - roam.pos.z) > 25) id = null;
    }
    waveSync(id);
  }
  // the challenge chip sits top-centre; when the scoreboard is behind it (the penalty view), drop it to just under the board's bezel
  let chipTop = null; const pv = new THREE.Vector3();
  function syncChip() {
    let top = null;
    const box = hud.chipBox();
    if (box) {
      let l = Infinity, r = -Infinity, b = -Infinity, front = true;
      for (const c of BOARD_CORNERS) { pv.copy(c).project(camera); if (pv.z > 1) { front = false; break; } const x = (pv.x + 1) / 2 * innerWidth, y = (1 - pv.y) / 2 * innerHeight; l = Math.min(l, x); r = Math.max(r, x); b = Math.max(b, y); }
      const naturalTop = chipTop == null ? box.top : 16;
      if (front && r > box.left && l < box.right && b > naturalTop && b < innerHeight * 0.3) top = Math.round(b + 8);
    }
    if (top !== chipTop) { chipTop = top; hud.setChipTop(top); }
  }

  goto('gates');
  const stationKey = (k, side) => (String(k) === '1' ? '1:' + (side || S.side || 'home') : String(k));
  const api = {
    step, goto, reset, VIEWS,
    skipNow: () => skipNow(false),
    answers: () => ({ side: S.side, values: { ...S.values } }),   // the answers so far, for the fast-lane page if the scene is abandoned (teardown.js salvage)
    state: () => ({
      stage: S.stage, side: S.side, score: S.score, values: { ...S.values }, ...stations.state(),
      card: hud.cardOpen() ? hud.card.dataset.kind || 'card' : null, heading: hud.cardOpen() ? (hud.card.querySelector('h2, label, .label')?.textContent ?? '') : null,
      chip: hud.chipText(), toast: hud.toastText(), walk: hud.walkText(), skippable: tl.skippable().length,
      simT: sim.t, huddle: teammates.huddleState(), siuuu: S.siuuu && { ...S.siuuu }, avatar: avatar.state(), shirt: shirt.state().name, waving, camera: camera.position.toArray(), fov: camera.fov, lights: world.lightLevel, crowd: { hush: crowd.state.hush }, squad: { drooped: teammates.drooped() }, roam: roam.state(), ticket: ticket.state(), penalty: challenges.penalty.state(), dribble: challenges.dribble.state(), corner: challenges.corner.state(),
    }),
    // dev: put the guest at a station's stand point ('1:home' | '1:away' | 2 | 3 | 4), the start ('start') or anywhere ({ x, z, yaw }). Proximity then opens the card.
    teleport(where) {
      if (S.stage === 'intro') leaveIntro();
      if (where === 'start') { place(VIEWS.gates); return roam.state(); }
      if (typeof where === 'object') { roam.teleport(where.x, where.z, { yaw: where.yaw ?? ctl.yaw, pitch: where.pitch ?? 0 }); return roam.state(); }
      const s = stations.byK(stationKey(where)); if (!s) throw new Error('teleport: start | 1:home | 1:away | 2 | 3 | 4 | {x, z}');
      roam.teleport(s.stand[0], s.stand[1], { look: s.focus }); return roam.state();
    },
    // dev: finish a station as if played (skip: false) or skipped (default), saving value first. Runs the real completion (gate, walk-out, ending).
    complete(k, value, { skip = true, side } = {}) {
      const s = stations.byK(stationKey(k, side)); if (!s) throw new Error('complete: 1 | 2 | 3 | 4 (side for 1)');
      if (S.stage === 'intro') leaveIntro();
      if (value !== undefined) S.values[s.key] = value;
      stations.complete(s, { value, skipped: skip, outcome: skip ? null : 'dev' }); return api.state();
    },
    open: (k) => { if (S.stage === 'intro') leaveIntro(); return stations.open(stationKey(k)); },
    walkToNext, pickSide, leaveIntro,
    handInTicket: () => ticket.handIn(),
    shoot(a) { const m = { TL: [-3.2, 2.1], TR: [3.2, 2.1], C: [0, 1.0], BL: [-3.0, 0.5], BR: [3.0, 0.5] }[a]; if (!m) throw new Error('aim must be TL|TR|C|BL|BR'); return challenges.penalty.shoot(m[0], m[1]) ? { ok: true, ...challenges.penalty.state().last } : { ok: false, stage: S.stage }; },
    // dev: the dribble (station 2 running): finish the slalom and shoot. aim 'far' | 'near' | 'left' | 'right'; force 'goal' | 'save' | 'miss' (mercy still wins)
    dribble(aim = 'far', opts) { return challenges.dribble.play(aim, opts) ? { ok: true, ...challenges.dribble.state().last } : { ok: false, stage: S.stage, dribble: challenges.dribble.state().stage }; },
    // dev: the corner (station 3 running). cross('good' | 'short' | 'long'); crossAt(x, z) aims at world metres first. The retake after a failure is always headed in.
    cross(zone = 'good') { return challenges.corner.play(zone) ? { ok: true, ...challenges.corner.state().last } : { ok: false, stage: S.stage, corner: challenges.corner.state().stage }; },
    crossAt: (x, z) => (challenges.corner.crossAt(x, z) ? { ok: true, ...challenges.corner.state().last } : { ok: false, stage: S.stage, corner: challenges.corner.state().stage }),
    shootAt: (x, y) => (challenges.penalty.shoot(x, y) ? { ok: true, ...challenges.penalty.state().last } : { ok: false, stage: S.stage }),
    skip(seconds, dt = 1 / 30) { for (let t = 0; t < seconds; t += dt) sim.step(dt); return sim.t; },
    ticket: ticket.group, pace: { ...PACE, arrive: stations.PACE.arrive, ticket: TICKET_PACE, penalty: PENALTY_PACE, dribble: DRIBBLE_PACE, corner: CORNER_PACE },
    // Called by the fallback page when the scene is abandoned: release every listener and timer so the keyboard belongs to the form again.
    dispose() { disposed = true; code?.dispose(); ac.abort(); tl.clear(); for (const c of Object.values(challenges)) c.stop(); ctl.enabled = false; },
  };
  return api;
}
