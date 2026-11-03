// Procedural WebAudio for the match: crowd ambience (filtered noise bed), goal roar, referee whistle, polite applause, firework thump, the crowd's "Siuuu".
// No audio files. Noise buffers are filled from a seeded RNG (no Math.random). The context is created on the first user gesture (unlock()).
import { mulberry32 } from './util.js';

export function createAudio() {
  let ctx = null, master = null, ambGain = null, bedLp = null, slowLp = null, muted = false, started = false;
  const rng = mulberry32(777001);
  const subs = [];                                  // mute listeners

  const noiseBuffer = (secs, fn) => {
    const n = Math.floor(ctx.sampleRate * secs), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    fn(d, n); return b;
  };
  const whiteBuf = () => noiseBuffer(3, (d, n) => { for (let i = 0; i < n; i++) d[i] = rng() * 2 - 1; });
  // crackle: sparse random impulses, the grain of clapping hands
  const crackleBuf = () => noiseBuffer(3, (d, n) => { for (let i = 0; i < n; i++) d[i] = rng() < 0.012 ? (rng() * 2 - 1) * (0.4 + rng()) : 0; });
  let white = null, crackle = null;

  const src = (buf, loop = true) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = loop; return s; };
  const env = (g, t0, pts) => { g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(pts[0][1], t0); for (const [dt, v] of pts.slice(1)) g.gain.linearRampToValueAtTime(v, t0 + dt); };

  function startAmbience() {
    if (started) return; started = true;
    // bed: band-limited noise (murmur) + low rumble, slow swell from an LFO
    const s = src(white), bp = ctx.createBiquadFilter(), lp = bedLp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.35; lp.type = 'lowpass'; lp.frequency.value = 1600;
    ambGain = ctx.createGain(); ambGain.gain.value = 0.2;
    s.connect(bp).connect(lp).connect(ambGain).connect(master); s.start();
    const s2 = src(white), lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 170;
    const g2 = ctx.createGain(); g2.gain.value = 0.35; s2.playbackRate.value = 0.7; s2.connect(lp2).connect(g2).connect(master); s2.start();
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.05;
    lfo.connect(lg).connect(ambGain.gain); lfo.start();
  }

  const api = {
    get ready() { return !!ctx; },
    get muted() { return muted; },
    onMute(fn) { subs.push(fn); },
    // call from a user gesture; safe to call repeatedly
    unlock() {
      try {
        if (!ctx) {
          const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
          ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
          slowLp = ctx.createBiquadFilter(); slowLp.type = 'lowpass'; slowLp.frequency.value = 18000; master.connect(slowLp).connect(ctx.destination);   // slow-mo dips it
          white = whiteBuf(); crackle = crackleBuf(); startAmbience();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return true;
      } catch { return false; }
    },
    setMuted(m) {
      muted = !!m;
      try { if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05); } catch {}
      subs.forEach((f) => f(muted));
    },
    toggleMute() { api.setMuted(!muted); return muted; },
    // the walk-out: m = 0 deep in the players' tunnel (the crowd muffled through concrete), 1 in the open air
    muffle(m) {
      if (!ctx || !bedLp) return; try {
        const t = ctx.currentTime; bedLp.frequency.setTargetAtTime(320 * Math.pow(1600 / 320, m), t, 0.12); ambGain.gain.setTargetAtTime(0.2 * (0.5 + 0.5 * m), t, 0.15);
      } catch {}
    },
    // a slow-motion goal beat: k = 0 normal, 1 full slow-mo (everything goes low and dull for a moment)
    slowmo(k) {
      if (!ctx || !slowLp) return; try { slowLp.frequency.setTargetAtTime(18000 * Math.pow(650 / 18000, k), ctx.currentTime, 0.05); } catch {}
    },
    // goal roar: noise swell, formant sweeping up, long tail; the ambience lifts with it
    roar(strength = 1) {
      if (!ctx) return; try {
        const t = ctx.currentTime, s = src(white), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        bp.type = 'bandpass'; bp.Q.value = 0.7; bp.frequency.setValueAtTime(450, t); bp.frequency.linearRampToValueAtTime(1100, t + 0.7); bp.frequency.linearRampToValueAtTime(650, t + 3);
        env(g, t, [[0, 0], [0.35, 0.55 * strength], [1.4, 0.45 * strength], [3.2, 0]]);
        s.connect(bp).connect(g).connect(master); s.start(t); s.stop(t + 3.4);
        if (ambGain) { ambGain.gain.cancelScheduledValues(t); ambGain.gain.setValueAtTime(ambGain.gain.value, t); ambGain.gain.linearRampToValueAtTime(0.36, t + 0.4); ambGain.gain.linearRampToValueAtTime(0.2, t + 3.5); }
      } catch {}
    },
    // the crowd's "Siuuu": thousands of voices as filtered noise through two vowel formants. A hiss ("s"), a swelling "Siii" (narrow bands near
    // 300 Hz and 2.6 kHz, the "i" vowel), then F2 glides down to ~800 Hz into a long "uuu" (F1 ~330 Hz) that swells and fades, over the goal roar's body
    siuuu(strength = 1) {
      if (!ctx) return; try {
        const t = ctx.currentTime, out = ctx.createGain(); out.gain.value = strength; out.connect(master);
        const voice = (type, q, f, pts, fpts) => {
          const s = src(white), bp = ctx.createBiquadFilter(), g = ctx.createGain();
          bp.type = type; bp.Q.value = q; bp.frequency.setValueAtTime(f, t); for (const [dt, v] of fpts || []) bp.frequency.linearRampToValueAtTime(v, t + dt);
          env(g, t, pts); s.connect(bp).connect(g).connect(out); s.start(t); s.stop(t + pts.at(-1)[0] + 0.1);
        };
        voice('highpass', 0.7, 4200, [[0, 0], [0.05, 0.22], [0.16, 0.05], [0.3, 0]]);                                                  // "s"
        voice('bandpass', 4.5, 2600, [[0, 0], [0.12, 0.2], [0.55, 0.42], [0.75, 0.3], [1.0, 0.06], [1.3, 0]], [[0.5, 2700], [0.95, 820], [1.3, 780]]);   // "iii" -> F2 falls
        voice('bandpass', 5, 300, [[0, 0], [0.15, 0.35], [0.55, 0.55], [0.9, 0.7], [1.6, 0.85], [2.6, 0.6], [3.6, 0]], [[0.6, 300], [0.95, 340]]);     // F1 under both vowels
        voice('bandpass', 4, 820, [[0, 0], [0.7, 0], [1.0, 0.5], [1.7, 0.62], [2.7, 0.4], [3.6, 0]]);                                   // "uuu" F2
        api.roar(0.6);
      } catch {}
    },
    // referee whistle: pea trill on a ~2.9 kHz tone. pattern = [[start, length], ...] seconds
    whistle(pattern = [[0, 0.28], [0.4, 0.28], [0.8, 0.9]]) {
      if (!ctx) return; try {
        const t = ctx.currentTime;
        for (const [a, len] of pattern) {
          const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), trem = ctx.createOscillator(), tg = ctx.createGain();
          o.type = 'sine'; o2.type = 'sine'; o.frequency.setValueAtTime(2850, t + a); o.frequency.linearRampToValueAtTime(2950, t + a + len); o2.frequency.value = 3650;
          trem.frequency.value = 34; tg.gain.value = 0.35; trem.connect(tg).connect(g.gain);
          env(g, t + a, [[0, 0], [0.02, 0.34], [Math.max(0.03, len - 0.04), 0.3], [len, 0]]);
          o.connect(g); o2.connect(g); g.connect(master);
          for (const n of [o, o2, trem]) { n.start(t + a); n.stop(t + a + len + 0.05); }
        }
      } catch {}
    },
    // polite applause: crackle through band-pass, low level, fades in and out
    applause(seconds = 4) {
      if (!ctx) return; try {
        const t = ctx.currentTime, s = src(crackle), hp = ctx.createBiquadFilter(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        hp.type = 'highpass'; hp.frequency.value = 1400; bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.5;
        env(g, t, [[0, 0], [0.5, 0.9], [seconds - 1, 0.7], [seconds, 0]]);
        s.connect(hp).connect(bp).connect(g).connect(master); s.start(t); s.stop(t + seconds + 0.1);
      } catch {}
    },
    // turnstile reader beep (accepted)
    beep() {
      if (!ctx) return; try {
        const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 1320;
        env(g, t, [[0, 0], [0.01, 0.12], [0.14, 0.1], [0.16, 0]]); o.connect(g).connect(master); o.start(t); o.stop(t + 0.2);
      } catch {}
    },
    // announcer sting: the stadium PA's rising three-note chime (sine + octave partial) through a long slap-back echo, the cue before "Now joining the squad"
    sting() {
      if (!ctx) return; try {
        const t = ctx.currentTime, out = ctx.createGain(), dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), lp = ctx.createBiquadFilter();
        out.gain.value = 0.5; dl.delayTime.value = 0.23; fb.gain.value = 0.38; wet.gain.value = 0.55; lp.type = 'lowpass'; lp.frequency.value = 2600;
        out.connect(master); out.connect(dl); dl.connect(lp).connect(fb).connect(dl); lp.connect(wet).connect(master);
        [[0, 587.33], [0.2, 739.99], [0.4, 880], [0.4, 1174.66]].forEach(([a, f]) => {
          for (const [mul, lvl] of [[1, 0.26], [2, 0.06]]) {
            const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * mul;
            env(g, t + a, [[0, 0], [0.012, lvl], [0.5, lvl * 0.35], [1.3, 0]]); o.connect(g).connect(out); o.start(t + a); o.stop(t + a + 1.35);
          }
        });
        setTimeout(() => { try { out.disconnect(); fb.disconnect(); } catch {} }, 4000);   // let the echo ring out, then free the feedback loop
      } catch {}
    },
    // a training cone clipped: a short hollow plastic tock
    tock() {
      if (!ctx) return; try {
        const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
        o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(240, t + 0.09);
        env(g, t, [[0, 0], [0.005, 0.22], [0.12, 0]]); o.connect(g).connect(master); o.start(t); o.stop(t + 0.15);
      } catch {}
    },
    // firework thump
    bang() {
      if (!ctx) return; try {
        const t = ctx.currentTime, s = src(white), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(420, t); lp.frequency.exponentialRampToValueAtTime(90, t + 0.5);
        env(g, t, [[0, 0.5], [0.5, 0]]); s.connect(lp).connect(g).connect(master); s.start(t); s.stop(t + 0.6);
      } catch {}
    },
  };
  return api;
}
