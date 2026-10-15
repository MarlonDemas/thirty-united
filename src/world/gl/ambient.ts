import type { Beat } from "@/world/beats"
import { framesSayDemote, TIER_RULES, type Tier, type TierRules } from "@/world/tier"

/**
 * The WebGL world's clock (Direction D, motion philosophy): the scene breathes at 30 Hz (smoke, embers), only on the
 * WebGL tiers, and stops when the tab is hidden and for the whole code beat ("the ground holds its breath"). Beat
 * changes (bank strikes, pose cross-fades, bursts) and a parallax drag still draw at the display's rate while they
 * run, then the loop stops until something changes.
 */
export const AMBIENT_HZ = 30
/** A frame due within this many ms of the 30 Hz mark draws now, so vsync jitter never halves the rate to 20 Hz. */
const SLOP_MS = 4
export const AMBIENT_INTERVAL_MS = 1000 / AMBIENT_HZ

/** Whether the ambient loops run on this beat. Reduced motion and the Still chip never reach a WebGL tier, but if a
 * caller asks anyway the answer is no: nothing loops then. */
export function ambientOn(s: { beat: Beat; tier: Tier; still: boolean; reduced: boolean }): boolean {
  if (s.reduced || s.still) return false
  if (s.tier !== "T3" && s.tier !== "T2") return false
  return s.beat !== "code"
}

export type FrameAction = "render" | "wait" | "stop"

/**
 * One rAF tick's decision. Hidden: stop (and draw nothing). A transition or a drag in flight: draw every frame.
 * Ambient: draw at 30 Hz. Otherwise stop until woken.
 */
export function frameAction(s: { hidden: boolean; busy: boolean; ambient: boolean; sinceRenderMs: number }): FrameAction {
  if (s.hidden) return "stop"
  if (s.busy) return "render"
  if (!s.ambient) return "stop"
  return s.sinceRenderMs >= AMBIENT_INTERVAL_MS - SLOP_MS ? "render" : "wait"
}

/**
 * Slow-frame sampling for demotion (atlas render budget: demote on slow frames, never promote). It samples how long
 * each drawn frame took to come back round (the rAF gap after a frame that rendered), never the 30 Hz schedule
 * itself, which is 33.3 ms by design and would trip the 33 ms rule. Samples are grouped into 1 s windows and each
 * window's median goes to `framesSayDemote`.
 */
export class FrameSampler {
  private window: number[] = []
  private windowStart = -1
  private startedAt = -1
  readonly medians: number[] = []
  private readonly rules: TierRules
  /** Texture uploads and shader compiles land in the first frames: ignore them. */
  private readonly warmupMs: number
  private readonly windowMs: number
  /** A gap this long is a stall (tab switch, OS), not a slow frame. */
  private readonly maxGapMs: number

  constructor(rules: TierRules = TIER_RULES, warmupMs = 2000, windowMs = 1000, maxGapMs = 500) {
    this.rules = rules
    this.warmupMs = warmupMs
    this.windowMs = windowMs
    this.maxGapMs = maxGapMs
  }

  /** Record the gap after a rendered frame. Returns true once the windows say demote. */
  add(now: number, gapMs: number): boolean {
    if (this.startedAt < 0) this.startedAt = now
    if (now - this.startedAt < this.warmupMs || gapMs <= 0 || gapMs > this.maxGapMs) return false
    if (this.windowStart < 0) this.windowStart = now
    this.window.push(gapMs)
    if (now - this.windowStart >= this.windowMs) {
      this.medians.push(median(this.window))
      this.window = []
      this.windowStart = now
      return framesSayDemote(this.medians, this.rules)
    }
    return false
  }

  /** The loop stopped (beat with no ambient, hidden tab): drop the partial window, keep the finished ones. */
  pause() {
    this.window = []
    this.windowStart = -1
  }
}

export function median(xs: readonly number[]): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** One rung down from a WebGL tier: T3 to T2, T2 to T1 (the DOM poster on the same files). */
export const demotionFor = (tier: "T3" | "T2"): "T2" | "T1" => (tier === "T3" ? "T2" : "T1")
