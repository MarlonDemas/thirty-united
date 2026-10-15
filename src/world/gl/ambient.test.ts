import { describe, expect, it } from "vitest"
import { AMBIENT_INTERVAL_MS, ambientOn, demotionFor, FrameSampler, frameAction, median } from "@/world/gl/ambient"
import { BEATS } from "@/world/beats"
import { TIER_RULES } from "@/world/tier"

describe("ambientOn: when the scene breathes", () => {
  const on = { tier: "T3" as const, still: false, reduced: false }

  it("runs on every beat but the code beat (the ground holds its breath)", () => {
    for (const beat of BEATS) expect(ambientOn({ ...on, beat })).toBe(beat !== "code")
  })

  it("runs on T2 too, and on nothing below", () => {
    expect(ambientOn({ ...on, beat: "cover", tier: "T2" })).toBe(true)
    for (const tier of ["T1", "T0", "forced-colors"] as const) expect(ambientOn({ ...on, beat: "cover", tier })).toBe(false)
  })

  it("Still and reduced motion stop every loop", () => {
    expect(ambientOn({ ...on, beat: "cover", still: true })).toBe(false)
    expect(ambientOn({ ...on, beat: "cover", reduced: true })).toBe(false)
  })
})

describe("frameAction: one rAF tick's decision", () => {
  it("a hidden tab stops the loop, whatever else is going on", () => {
    expect(frameAction({ hidden: true, busy: true, ambient: true, sinceRenderMs: 100 })).toBe("stop")
  })

  it("a beat change or a drag draws every frame", () => {
    expect(frameAction({ hidden: false, busy: true, ambient: false, sinceRenderMs: 0 })).toBe("render")
  })

  it("ambient draws at 30 Hz, letting a frame a few ms early through so vsync jitter never drops it to 20 Hz", () => {
    expect(AMBIENT_INTERVAL_MS).toBeCloseTo(33.33, 1)
    expect(frameAction({ hidden: false, busy: false, ambient: true, sinceRenderMs: 16.7 })).toBe("wait")
    expect(frameAction({ hidden: false, busy: false, ambient: true, sinceRenderMs: 31 })).toBe("render")
    expect(frameAction({ hidden: false, busy: false, ambient: true, sinceRenderMs: 40 })).toBe("render")
  })

  it("nothing moving and no ambient (the code beat at rest): the loop stops until woken", () => {
    expect(frameAction({ hidden: false, busy: false, ambient: false, sinceRenderMs: 500 })).toBe("stop")
  })
})

/** Feeds `ms`-long frames for `forMs`, from `start`; returns whether the sampler said demote, and the end time. */
function feed(s: FrameSampler, start: number, ms: number, forMs: number) {
  let t = start
  let said = false
  while (t < start + forMs) {
    t += ms
    said = s.add(t, ms) || said
  }
  return { said, t }
}

describe("FrameSampler: demote on slow frames, never on the 30 Hz schedule", () => {
  it("60 fps (and the 30 Hz ambient rate, which it never sees as frame gaps) never demotes", () => {
    const s = new FrameSampler()
    expect(feed(s, 0, 16.7, 10_000).said).toBe(false)
  })

  it("two slow 1 s windows in a row demote", () => {
    const s = new FrameSampler()
    const warm = feed(s, 0, 16.7, 2100)
    expect(warm.said).toBe(false)
    expect(feed(s, warm.t, 45, 2100).said).toBe(true)
    expect(s.medians.filter((m) => m > TIER_RULES.slowFrameMs)).toHaveLength(2)
  })

  it("ignores the warm-up (texture uploads, shader compiles)", () => {
    const s = new FrameSampler()
    expect(feed(s, 0, 60, 1900).said).toBe(false)
    expect(s.medians).toHaveLength(0)
  })

  it("a stall (tab switch, OS) is not a slow frame", () => {
    const s = new FrameSampler()
    const warm = feed(s, 0, 16.7, 2100)
    expect(s.add(warm.t + 900, 900)).toBe(false)
    expect(feed(s, warm.t + 900, 16.7, 3000).said).toBe(false)
  })

  it("pause drops the partial window", () => {
    const s = new FrameSampler()
    const warm = feed(s, 0, 16.7, 2100)
    const slow = feed(s, warm.t, 45, 1100)
    expect(s.medians.at(-1)).toBe(45)
    s.pause()
    expect(feed(s, slow.t, 16.7, 1100).said).toBe(false)
  })

  it("median", () => {
    expect(median([])).toBe(0)
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe("demotionFor: one rung down, never up", () => {
  it("T3 to T2, T2 to T1", () => {
    expect(demotionFor("T3")).toBe("T2")
    expect(demotionFor("T2")).toBe("T1")
  })
})
