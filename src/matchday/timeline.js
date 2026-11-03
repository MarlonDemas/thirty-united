// matchday-rsvp: the sim-clock timeline. Every animated wait (tweens, delays, camera moves) runs on world.sim.t, so window.__dbg.simStep(dt) advances it deterministically.
// A tween created with { skip: true } is a forced move the guest can skip (tap, click, Space, Enter or Escape); skipAll() jumps every one of them to its end.
export function createTimeline(sim) {
  let list = [];
  const tl = {
    tween(dur, fn, done, { skip = false } = {}) { const t = { t0: sim.t, dur: Math.max(1e-4, dur), fn, done, skip }; list.push(t); return t; },
    after(s, fn, opts) { return tl.tween(s, null, fn, opts); },
    cancel(t) { if (t) list = list.filter((x) => x !== t); },
    has: (t) => !!t && list.includes(t),
    // Run a tween's last frame and its done step right now (once). Used by skip and by reduced-motion cuts.
    finish(t) { if (!t || !list.includes(t)) return; list = list.filter((x) => x !== t); t.fn?.(1); t.done?.(); },
    skippable: () => list.filter((t) => t.skip),
    // done steps may start new skippable moves (e.g. arrival -> card); keep finishing until none is left (bounded)
    skipAll() { let n = 0; for (; n < 16 && tl.skippable().length; n++) for (const t of tl.skippable()) tl.finish(t); return n > 0; },
    step() {
      for (const tw of list.slice()) {
        if (!list.includes(tw)) continue;
        const u = Math.min(1, (sim.t - tw.t0) / tw.dur); tw.fn?.(u);
        if (u >= 1) { list = list.filter((x) => x !== tw); tw.done?.(); }
      }
    },
    clear() { list = []; },
  };
  return tl;
}
