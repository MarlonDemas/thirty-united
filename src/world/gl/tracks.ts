import type { Attending } from "@/lib/schemas/rsvp"
import { banksFor, poseFor, shirtHangs, type Beat } from "@/world/beats"

/**
 * The WebGL world's beat changes, as tracks of timed segments. They mirror the T1 transitions in index.css (same
 * durations, delays and curves) so the canvas and the DOM still never disagree about where a beat ends up:
 * - bank strike: 600 ms, `--ease-fade`, one way; on the signing every bank fires at 1400 ms (ignition);
 * - the bank glow grows from 0.55 to full with a small overshoot, on the strike's timing;
 * - pose cross-fade: 250 ms linear; on the signing 350 ms after 550 ms;
 * - the hanging shirt swings in: 600 ms ease-out, no overshoot;
 * - one-shot ember bursts: the Yes swirl on leaving Chapter 1 (1200 ms) and the finale burst at 1400 ms (1200 ms).
 * The camera is not here: the shot is the `.poster` element's CSS transform, which carries the canvas with it.
 */

export type Ease = "linear" | "fade" | "out" | "overshoot"

/** CSS cubic-bezier as a function of progress (x) to value (y). Newton steps with a bisection fallback. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u
  const sy = (u: number) => ((ay * u + by) * u + cy) * u
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let u = t
    for (let i = 0; i < 6; i++) {
      const err = sx(u) - t
      if (Math.abs(err) < 1e-6) return sy(u)
      const d = dx(u)
      if (Math.abs(d) < 1e-6) break
      u -= err / d
    }
    let lo = 0
    let hi = 1
    u = t
    for (let i = 0; i < 30; i++) {
      const x = sx(u)
      if (Math.abs(x - t) < 1e-6) break
      if (x < t) lo = u
      else hi = u
      u = (lo + hi) / 2
    }
    return sy(u)
  }
}

/** The curves index.css uses: `--ease-fade`, CSS `ease-out`, and the bank glow's overshoot. */
export const EASES: Record<Ease, (t: number) => number> = {
  linear: (t) => Math.min(1, Math.max(0, t)),
  fade: cubicBezier(0.2, 0, 0, 1),
  out: cubicBezier(0, 0, 0.58, 1),
  overshoot: cubicBezier(0.34, 1.56, 0.64, 1),
}

/** One move: go to `to`, starting `at` ms after the beat change, over `dur` ms. */
export type Segment = { to: number; at: number; dur: number; ease: Ease }
export type Track = readonly Segment[]

/** The value `ms` after the beat change, starting from `from` (the value the change interrupted). */
export function sample(track: Track, from: number, ms: number): number {
  let v = from
  for (const s of track) {
    if (ms < s.at) return v
    const t = s.dur > 0 ? Math.min(1, (ms - s.at) / s.dur) : 1
    if (t < 1) return v + (s.to - v) * EASES[s.ease](t)
    v = s.to
  }
  return v
}

/** When the track has played out (ms after the change). */
export const trackEnd = (track: Track) => track.reduce((end, s) => Math.max(end, s.at + s.dur), 0)

/** Where the track lands: the state to draw at once when the canvas mounts mid-journey. */
export const settle = (track: Track, from: number) => sample(track, from, Number.POSITIVE_INFINITY)

/** The finale on the WebGL tiers (tokens.md beat timings; index.css carries the same numbers for T1). */
export const FINALE = { poseAt: 550, poseMs: 350, ignitionAt: 1400, strikeMs: 600, burstMs: 1200 } as const
export const STRIKE_MS = 600
export const POSE_MS = 250
export const SHIRT_MS = 600
export const SWIRL_MS = 1200

export type Prop =
  | "bank1" | "bank2" | "bank3" | "bank4" // level: 0, 0.5 (Maybe's bank two) or 1
  | "reveal1" | "reveal2" | "reveal3" | "reveal4" // the lit plate's mask, from the lamp head outward
  | "glow1" | "glow2" | "glow3" | "glow4" // the glow sprite's scale, 0.55 dark to 1 lit
  | "l5-makes" | "l6-makes-wave" | "l7-makes-signing" // pose opacity
  | "shirt" // the hanging shirt: 0 out (right of its slot, clear) to 1 hung
  | "swirl" | "burst" // one-shot ember bursts: 0 and 1 are both "not flying"

export const PROPS: readonly Prop[] = [
  "bank1", "bank2", "bank3", "bank4",
  "reveal1", "reveal2", "reveal3", "reveal4",
  "glow1", "glow2", "glow3", "glow4",
  "l5-makes", "l6-makes-wave", "l7-makes-signing",
  "shirt", "swirl", "burst",
]

const to = (v: number, at: number, dur: number, ease: Ease): Segment => ({ to: v, at, dur, ease })

/**
 * The tracks for arriving at `beat` (from `from`, when there was a previous beat). Pure: the same arrival always
 * plays the same way.
 */
export function tracksFor(beat: Beat, attending: Attending | undefined, from?: Beat): Record<Prop, Track> {
  const signed = beat === "signed"
  const banks = banksFor(beat, attending)
  const strikeAt = signed ? FINALE.ignitionAt : 0
  const pose = poseFor(beat, attending)
  const poseAt = signed ? FINALE.poseAt : 0
  const poseMs = signed ? FINALE.poseMs : POSE_MS
  const out = {} as Record<Prop, Track>
  banks.forEach((level, i) => {
    const n = i + 1
    out[`bank${n}` as Prop] = [to(level, strikeAt, STRIKE_MS, "fade")]
    out[`reveal${n}` as Prop] = [to(level > 0 ? 1 : 0, strikeAt, STRIKE_MS, "fade")]
    out[`glow${n}` as Prop] = [to(level > 0 ? 1 : 0.55, strikeAt, STRIKE_MS, "overshoot")]
  })
  for (const p of ["l5-makes", "l6-makes-wave", "l7-makes-signing"] as const) out[p] = [to(p === pose ? 1 : 0, poseAt, poseMs, "linear")]
  out.shirt = [to(shirtHangs(beat, attending) ? 1 : 0, 0, SHIRT_MS, "out")]
  // "Yes strikes bank two and an ember swirl rises past Makes" (on Continue, so only when arriving from Chapter 1).
  out.swirl = beat === "chapter2" && attending === "yes" && from === "chapter1" ? [to(0, 0, 0, "linear"), to(1, 0, SWIRL_MS, "linear")] : []
  out.burst = signed ? [to(0, 0, 0, "linear"), to(1, FINALE.ignitionAt, FINALE.burstMs, "linear")] : []
  return out
}

/** A one-shot burst is in the air strictly between 0 and 1. */
export const flying = (v: number) => v > 0 && v < 1
