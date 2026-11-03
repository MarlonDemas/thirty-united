// matchday-rsvp: the cinematic layer. Everything here runs on the sim clock (timeline.js), so window.__dbg.simStep(dt) stays deterministic.
//   letterbox   thin CSS bars (7% of the height) while a cinematic camera move or a slow-motion beat is live (both skippable, so a skip always clears them);
//               never while a card or a challenge chip is up. Ball tracking alone does not raise them: it is part of the unskippable flight
//   dip         a short dip to black (the walk-out's cut from the turnstile into the players' tunnel)
//   slowmo      a goal beat: world.sim.scale eases 1 -> 0.35 -> 1 over SLOW.beat sim seconds (~0.75 s of wall time). Skippable: skipAll() finishes it at scale 1
//   track       the camera turns toward a moving ball (non-skippable: it lasts the ball's own flight), with an optional FOV push
//   walkOutRig  the tunnel walk-out (third person): the guest's avatar walks through the open turnstile with the camera on the boom behind, dip to black,
//               then the camera leads the avatar down the darker tunnel facing it while the floodlights and the crowd build, swings round behind it as it
//               steps out past the south goal (HOME: a crane lift that reveals the bowl and the scoreboard) and settles on the boom behind the avatar
//   siuuuRig    the corner celebration (last HOME station scored): a tracking shot of the sprint, a cut to a low camera in front of the corner for the
//               steps, the jump with its half turn and the landing (siuuuTiming: the run's distance over time, with an ellipsis under the cut)
// Reduced motion: no slow-mo, no tracking, no letterbox (camera moves are cuts there anyway).
import * as THREE from 'three';
import { clamp, lerp, lerpAngle, smoother, smooth01, anglesFor, reducedMotion } from './util.js';

export const SLOW = { scale: 0.35, beat: 0.32 };   // a goal beat: 0.32 sim s at down to 0.35x is ~0.8 s for the guest
const BARS = { rate: 1 / 0.4 };                     // letterbox in / out over 0.4 s
// The Siuuu's run as distance along the feet's path over sim time: a sprint (accelerating to vmax), slowing into 2-3 accelerating steps, the take-off,
// `air` s in the air (the feet travel airV m/s), then the landing spot; the rig ends craneAt s after touchdown (the full-time crane takes over while the
// pose holds). A long sprint shows only its first `chase` s: under the camera cut the feet jump ahead to where the slow-down starts (cut: true, an
// ellipsis that keeps the forced time inside the budget). A short run (already near the corner) is a run-up from standing.
export const SIU = { vmax: 8.5, accel: 0.75, chase: 1.1, vDec: 2.5, dec: 0.45, vTake: 6.0, steps: 0.55, airV: 1.4, air: 0.5, craneAt: 0.45 };
export function siuuuTiming(len) {
  const dDec = (SIU.vmax + SIU.vDec) / 2 * SIU.dec, dSteps = (SIU.vDec + SIU.vTake) / 2 * SIU.steps, dAir = SIU.airV * SIU.air, dApp = dDec + dSteps + dAir, dAcc = SIU.vmax / 2 * SIU.accel;
  const segs = [];   // [t0, dur, s0, v0, v1]: constant acceleration from v0 to v1
  let t = 0, s = 0, cut = false, camCut = 0;
  const seg = (dur, v0, v1) => { segs.push([t, dur, s, v0, v1]); t += dur; s += (v0 + v1) / 2 * dur; };
  if (len >= dAcc + dApp) {
    seg(SIU.accel, 0, SIU.vmax);
    const cruise = len - dAcc - dApp, shown = Math.min(cruise, SIU.vmax * (SIU.chase - SIU.accel));
    if (shown > 1e-6) seg(shown / SIU.vmax, SIU.vmax, SIU.vmax);
    if (cruise > shown + 1e-6) { cut = true; s = len - dApp; }
    camCut = t;
    seg(SIU.dec, SIU.vmax, SIU.vDec); seg(SIU.steps, SIU.vDec, SIU.vTake);
  } else seg(2 * Math.max(0.4, len - dAir) / SIU.vTake, 0, SIU.vTake);
  const take = t;
  seg(SIU.air, SIU.airV, SIU.airV);
  const at = (q) => { for (let i = segs.length - 1; i >= 0; i--) { const [t0, dur, s0, v0, v1] = segs[i]; if (q >= t0) { const k = Math.min(q - t0, dur); return s0 + v0 * k + 0.5 * (v1 - v0) / dur * k * k; } } return 0; };
  return { take, land: take + SIU.air, total: take + SIU.air + SIU.craneAt, camCut, cut, s: (q) => Math.min(len, at(q)) };
}

export function createCine(world, { tl, audio }) {
  const { sim, camera, controls: ctl, bloom } = world;
  const ui = document.getElementById('ui');
  const mk = (id) => { const d = document.createElement('div'); d.id = id; d.setAttribute('aria-hidden', 'true'); return d; };
  const lb = mk('lb'); lb.append(mk('lb-top'), mk('lb-bot'));
  const dip = mk('dip');
  ui.prepend(lb, dip);   // first in #ui: every overlay (card, chip, skip, mute) paints above the bars
  const bloom0 = bloom.intensity;

  let bars = 0, barsShown = -1, dipShown = -1, slowT = null, trackT = null, muffleSent = -1, slowSent = -1;
  const showBars = () => { const v = +smoother(bars).toFixed(3); if (v !== barsShown) { barsShown = v; lb.style.setProperty('--lb', v); lb.hidden = v === 0; } };
  function setDip(v) { v = +clamp(v, 0, 1).toFixed(3); if (v !== dipShown) { dipShown = v; dip.style.opacity = v; dip.hidden = v === 0; } }
  // throttled audio: WebAudio params are only touched when the value really moves
  function muffle(m) { if (Math.abs(m - muffleSent) < 0.03 && !(m === 1 && muffleSent !== 1)) return; muffleSent = m; audio.muffle?.(m); }
  function slowAudio(k) { if (Math.abs(k - slowSent) < 0.05 && !(k === 0 && slowSent !== 0)) return; slowSent = k; audio.slowmo?.(k); }
  function glow(g) { bloom.intensity = bloom0 * (1 + 0.7 * g); }

  const api = {
    SLOW,
    get slow() { return !!slowT && tl.has(slowT); },
    get tracking() { return !!trackT && tl.has(trackT); },
    // per sim step: want = a cinematic move or a slow-mo beat is live; hard = a card or a chip is up (the bars drop at once)
    step(dt, { want, hard }) {
      if (hard || reducedMotion()) bars = 0;
      else bars = clamp(bars + (want ? 1 : -1) * BARS.rate * dt / Math.max(0.05, sim.scale), 0, 1);   // the guest's time: the bars do not slow down with a goal beat
      showBars();
    },
    // skip and reset: the bars jump to where they are going
    snap(want) { bars = want && !reducedMotion() ? 1 : 0; showBars(); },
    dip: setDip,
    // the goal beat (skippable). Ease down over the first 20%, hold, ease back up over the last 35%.
    slowmo(dur = SLOW.beat) {
      if (reducedMotion()) return null;
      tl.cancel(slowT);
      const t = slowT = tl.tween(dur, (u) => {
        const k = smoother(clamp(u / 0.2, 0, 1)) * (1 - smoother(clamp((u - 0.65) / 0.35, 0, 1)));
        sim.scale = lerp(1, SLOW.scale, k); slowAudio(k);
      }, () => { if (slowT === t) slowT = null; sim.scale = 1; slowAudio(0); }, { skip: true });
      return t;
    },
    // turn the camera toward pos() (a moving ball) over dur: the weight eases in over `lead` of the move; fov (optional) pushes in over 60%.
    track(pos, { dur, weight = 0.75, lead = 0.4, fov } = {}) {
      if (reducedMotion()) return null;
      tl.cancel(trackT);
      const a = { yaw: ctl.yaw, pitch: ctl.pitch, fov: camera.fov };
      const t = trackT = tl.tween(dur, (u) => {
        const w = weight * smoother(clamp(u / lead, 0, 1)), b = anglesFor(camera.position.toArray(), pos().toArray());
        ctl.yaw = lerpAngle(a.yaw, b.yaw, w); ctl.pitch = lerp(a.pitch, b.pitch, w); ctl.apply();
        if (fov) { camera.fov = lerp(a.fov, fov, smoother(clamp(u / 0.6, 0, 1))); camera.updateProjectionMatrix(); }
      }, () => { if (trackT === t) trackT = null; });
      return t;
    },
    stopTrack() { tl.cancel(trackT); trackT = null; },
    // a scoring shot: track the ball for its flight plus a beat after, and drop into slow motion just before it hits the net (impact ~45% into the beat)
    goal(ball, flight, { fov, weight, impact = 0.45, after = 0.9 } = {}) {
      api.track(() => ball.position, { dur: flight + after, fov, weight });
      if (!reducedMotion()) tl.after(Math.max(0, flight - SLOW.beat * impact), () => api.slowmo());
    },
    // the walk-out rig for roam.glide({ rig }): (u, start, boomCam) -> { x, y, z, yaw, pitch, fov, px, pz }. side 'home' | 'away'; laneX = the open
    // turnstile; end = the avatar's [x, z] at the end; endYaw/endPitch = the final look (from the eye line). It ends exactly on boomCam(end, endYaw, endPitch),
    // so roam's rig takes over without a jump. The light, glow and muffle ramps follow the avatar's way to the tunnel mouth (z = 60).
    // AWAY: the same tunnel shot, then a second short dip cuts to the AWAY dugout touchline, where the avatar walks the last few metres into place.
    walkOutRig({ side, laneX, end, endYaw, endPitch, dur, onExit }) {
      const home = side === 'home';
      const tA = 1.3, tB = 1.45, tFade = 0.45;                       // gate walk (ends black), cut, fade up
      const MOUTH = 60, LEAD = 3.0, HEAD = 1.5;                      // the tunnel mouth (stadium.js); the lead camera's distance; the avatar's head height
      const reveal = new THREE.Vector3(0, 14, -82);                   // the scoreboard, high on the north stand
      const V = (x, z) => new THREE.Vector3(x, 0, z);
      // the avatar's way out: down the tunnel, round the back of the south goal's net (x >= -3.8 to z 54.8) on the run-off, then onto the pitch
      const tunnel = [V(0, 66), V(0, 60.5), V(-1.6, 57.6), V(-4.6, 55.9)];
      const foot = new THREE.CatmullRomCurve3(home ? [...tunnel, V(-6.1, 52), V(end[0], end[1])] : [...tunnel, V(-6.6, 51.5)], false, 'centripetal');
      // AWAY's last leg, after the second dip: along the touchline into the end spot, arriving on the end look
      const fwdEnd = [-Math.sin(endYaw), -Math.cos(endYaw)], LAST = 6.5;
      const last = home ? null : new THREE.CatmullRomCurve3([V(end[0] - fwdEnd[0] * LAST, end[1] - fwdEnd[1] * LAST), V(end[0], end[1])]);
      const T = dur - tB, cut2 = home ? Infinity : T - 2.9, cutDip = 0.35;   // AWAY: dip down from cut2 - cutDip, the cut at cut2, fade up over tFade
      // time warp: ease in over 0.9 s, cruise, ease out over the last `out` s (a smooth trapezoid, integrated once)
      const makeWarp = (T, inS, out) => {
        const N = 240, cum = new Float32Array(N + 1);
        for (let i = 1; i <= N; i++) { const t = (i - 0.5) / N * T; cum[i] = cum[i - 1] + smooth01(0, inS, t) * (out > 0 ? 1 - smooth01(T - out, T, t) : 1); }
        return (t) => { const f = clamp(t / T, 0, 1) * N, i = Math.floor(f), k = Math.min(N, i + 1); return lerp(cum[i], cum[k], f - i) / cum[N]; };
      };
      const warp = home ? makeWarp(T, 0.9, 1.7) : makeWarp(cut2, 0.9, 0), warpLast = home ? null : makeWarp(T - cut2, 0.15, 1.4);
      const tEnd0 = dur - 1.9;
      const GATE_RUN = 8.5 * tA / 1.5;
      let gate = null, gateK = null, d0 = null, exited = false;
      const tg = new THREE.Vector3(), p = new THREE.Vector3(), cp = new THREE.Vector3(), lp = new THREE.Vector3();
      return (u, a, boomCam) => {
        const t = u * dur;
        if (t < tB) {
          // the avatar walks through the open turnstile, accelerating into the dip; the camera rides the boom behind, easing off wherever it started
          gate ??= new THREE.CatmullRomCurve3([V(a.P.x, a.P.z), V(laneX, 105.4), V(laneX, 101.4)], false, 'centripetal');
          // eases in (zero speed at the start), still moving into the black; the peak speed is 1.5 * length / tA, so from far off (a skipped ticket leaves the
          // guest at the kiosk) the avatar covers only the first GATE_RUN metres (<= 8.5 m/s) and the cut under the black takes it the rest of the way
          gateK ??= Math.min(1, GATE_RUN / gate.getLength());
          const v = clamp(t / tA, 0, 1), e = (v * v * (2 - v) * 0.5 + v * v * 0.5) * gateK;
          gate.getPointAt(Math.min(1, e), p); gate.getTangentAt(Math.min(1, e), tg);
          const w = smoother(clamp(v / 0.55, 0, 1)), yaw = lerpAngle(a.yaw, Math.atan2(-tg.x, -tg.z), w), pitch = lerp(a.pitch, -0.1, w);
          if (!d0) { const c0 = boomCam(a.P.x, a.P.z, a.yaw, a.pitch); d0 = new THREE.Vector3(a.pos.x - c0.x, a.pos.y - c0.y, a.pos.z - c0.z); }
          const c = boomCam(p.x, p.z, yaw, pitch), k = 1 - smoother(v);
          setDip(smoother(clamp((t - 0.8) / (tA - 0.8), 0, 1)));
          muffle(1 - 0.85 * smoother(clamp((t - 0.6) / (tA - 0.6), 0, 1)));
          return { x: c.x + d0.x * k, y: c.y + d0.y * k, z: c.z + d0.z * k, yaw, pitch: c.pitch, fov: lerp(a.fov, 52, smoother(v)), px: p.x, pz: p.z };
        }
        const tt = t - tB;
        if (tt >= cut2) {
          // AWAY, after the second dip: the touchline, the avatar walking into the end spot with the camera on the boom behind (a little high at first)
          const s = warpLast(tt - cut2); last.getPointAt(s, p);
          const k = 1 - smoother(clamp((tt - cut2) / 1.6, 0, 1)), c = boomCam(p.x, p.z, endYaw, lerp(endPitch, -0.32, k));
          setDip(1 - smoother(clamp((tt - cut2) / tFade, 0, 1))); glow(0); muffle(1);
          if (!exited) { exited = true; onExit?.(); }
          return { x: c.x, y: c.y, z: c.z, yaw: endYaw, pitch: c.pitch, fov: lerp(60, 58, 1 - k), px: p.x, pz: p.z };
        }
        // down the tunnel and out: the avatar on its way; the camera leads it facing back, then swings round it (by its left) to behind as it passes the goal
        const s = Math.min(1, warp(tt));
        foot.getPointAt(s, p); foot.getTangentAt(s, tg);
        const fx = tg.x, fz = tg.z, fl = Math.hypot(fx, fz) || 1, Fx = fx / fl, Fz = fz / fl, Lx = Fz, Lz = -Fx;   // forward along the walk; the avatar's left
        const wS = smooth01(59.5, 51.5, p.z), th = Math.PI * wS, r = lerp(LEAD, 5.6, wS), hy = lerp(1.6, home ? 3.7 : 3.0, smooth01(58.5, 52, p.z));
        cp.set(p.x + r * (Math.cos(th) * Fx + Math.sin(th) * Lx), hy, p.z + r * (Math.cos(th) * Fz + Math.sin(th) * Lz));
        const k = smooth01(66, MOUTH - 1.5, p.z), wR = (home ? 1 : 0.35) * smooth01(55, 49.5, p.z), wW = smooth01(MOUTH - 1, 53, p.z), wE = home ? smooth01(tEnd0, dur, t) : 0;
        const toA = anglesFor(cp.toArray(), lp.set(p.x, HEAD, p.z).toArray()), rv = anglesFor(cp.toArray(), reveal.toArray());
        let yaw = lerpAngle(toA.yaw, rv.yaw, wR), pitch = lerp(toA.pitch, rv.pitch, wR), x = cp.x, y = cp.y, z = cp.z;
        if (wE > 0) { const c = boomCam(p.x, p.z, endYaw, endPitch); x = lerp(x, c.x, wE); y = lerp(y, c.y, wE); z = lerp(z, c.z, wE); yaw = lerpAngle(yaw, endYaw, wE); pitch = lerp(pitch, c.pitch, wE); }
        const g = k * (1 - wE);   // the floodlight glow builds toward the mouth, blazes on the reveal and settles as the crane comes down
        if (home) { world.setLights(1 + 0.3 * g); glow(g); } else glow(0.5 * g);
        let dip = 1 - smoother(clamp(tt / tFade, 0, 1));
        if (!home) dip = Math.max(dip, smoother(clamp((tt - (cut2 - cutDip)) / cutDip, 0, 1)));   // AWAY: down into the second cut
        setDip(dip);
        muffle(p.z > MOUTH - 1.5 ? 0.15 + 0.6 * k : 1);
        if (!exited && (p.z <= MOUTH - 0.5 || u >= 1)) { exited = true; onExit?.(); }
        return { x, y, z, yaw, pitch, fov: lerp(lerp(48, home ? 64 : 60, wW), 58, wE), px: p.x, pz: p.z };
      };
    },
    siuuuTiming,
    // the Siuuu rig for roam.glide({ rig, free: true }): (u, start, boomCam) -> { x, y, z, yaw, pitch, fov, px, pz }. curve = the feet's ground path (a
    // THREE curve, y 0) ending on the landing spot; T = siuuuTiming(length); nIn = the unit side toward the pitch centre. Two set-ups: a tracking shot
    // from behind and to the pitch side of the sprint (eased in from wherever the camera was), then a CUT to a low camera in front of the corner, on the
    // run's line about 9 m back from the landing spot and a little to the side: the guest runs away from it into the corner, jumps, turns and lands
    // facing it, with the flag, the boards and the crowd behind. A long sprint is cut short (T.cut: the feet jump ahead under the cut, an ellipsis).
    // A short one (already near the corner) has no tracking shot: the camera eases straight to the low set-up.
    siuuuRig({ curve, T, nIn, onCut }) {
      const len = curve.getLength(), L = curve.getPointAt(1), end = curve.getTangentAt(1), app = [end.x, end.z], al = Math.hypot(app[0], app[1]) || 1;
      app[0] /= al; app[1] /= al;
      const inside = (x, z) => Math.abs(x) <= 37 && Math.abs(z) <= 56;
      let back = 9.0, side = 1.7; while (back > 4 && !inside(L.x - app[0] * back + nIn[0] * side, L.z - app[1] * back + nIn[1] * side)) { back -= 0.25; side = Math.min(side, back * 0.2); }
      const C = new THREE.Vector3(L.x - app[0] * back + nIn[0] * side, 0.8, L.z - app[1] * back + nIn[1] * side), aim = new THREE.Vector3(L.x + app[0] * 0.5, 1.02, L.z + app[1] * 0.5);
      const aspect = () => innerWidth / innerHeight, fovFor = (base, minH) => Math.max(base, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(minH) / 2) / aspect())));
      const p = new THREE.Vector3(), tg = new THREE.Vector3(), look = new THREE.Vector3();
      let cutDone = false;
      return (u, a) => {
        const t = u * T.total, s = clamp(T.s(t) / len, 0, 1);
        curve.getPointAt(s, p);
        if (t < T.camCut) {
          // tracking: behind and to the pitch side of the runner, looking ahead of it; eased off the starting camera over the first 0.5 s
          curve.getTangentAt(s, tg); const fl = Math.hypot(tg.x, tg.z) || 1, fx = tg.x / fl, fz = tg.z / fl;
          let nx = -fz, nz = fx; if (nx * -p.x + nz * -p.z < 0) { nx = -nx; nz = -nz; }
          let sd = 4.4; while (sd > 0.5 && !inside(p.x - fx * 2.6 + nx * sd, p.z - fz * 2.6 + nz * sd)) sd -= 0.25;
          const cx = p.x - fx * 2.6 + nx * sd, cz = p.z - fz * 2.6 + nz * sd, cy = 1.55;
          const b = anglesFor([cx, cy, cz], look.set(p.x + fx * 2.2, 1.0, p.z + fz * 2.2).toArray()), k = smoother(clamp(t / 0.5, 0, 1));
          return { x: lerp(a.pos.x, cx, k), y: lerp(a.pos.y, cy, k), z: lerp(a.pos.z, cz, k), yaw: lerpAngle(a.yaw, b.yaw, k), pitch: lerp(a.pitch, b.pitch, k), fov: lerp(a.fov, fovFor(52, 40), k), px: p.x, pz: p.z };
        }
        if (!cutDone) { cutDone = true; if (T.cut) onCut?.(); }
        // the low set-up in front of the corner (no tracking shot: eased in from the starting camera over 0.6 s); the lens tightens as the guest runs off
        const b = anglesFor(C.toArray(), aim.toArray()), w = T.camCut > 0 ? 1 : smoother(clamp(t / 0.6, 0, 1));
        const z = smoother(clamp((t - T.camCut) / Math.max(0.3, T.take - T.camCut), 0, 1)), fov = fovFor(lerp(42, 31, z), 24);
        return { x: lerp(a.pos.x, C.x, w), y: lerp(a.pos.y, C.y, w), z: lerp(a.pos.z, C.z, w), yaw: lerpAngle(a.yaw, b.yaw, w), pitch: lerp(a.pitch, b.pitch, w), fov: lerp(a.fov, fov, w), px: p.x, pz: p.z };
      };
    },
    reset() {
      tl.cancel(slowT); slowT = null; tl.cancel(trackT); trackT = null; sim.scale = 1; slowAudio(0); muffle(1);
      glow(0); bars = 0; showBars(); setDip(0);
    },
  };
  api.reset();
  return api;
}
