import { describe, expect, it, vi } from "vitest"
import { setReducedMotion } from "@/test-utils"
import {
  demote,
  framesSayDemote,
  getTierState,
  pickTier,
  resetTier,
  setStill,
  TIER_KEY,
  TIER_RULES,
  type TierSignals,
} from "@/world/tier"

const phone = (over: Partial<TierSignals> = {}): TierSignals => ({
  forcedColors: false,
  reducedMotion: false,
  saveData: false,
  webgl2: true,
  maxTextureSize: 8192,
  renderer: "Apple GPU",
  deviceMemory: null,
  cores: 6,
  android: false,
  ...over,
})

describe("pickTier (the heuristic)", () => {
  it.each<[string, Partial<TierSignals>, string]>([
    ["iPhone (Apple GPU, masked memory)", {}, "T3"],
    ["flagship Android (Adreno 740, 8 GB)", { renderer: "Adreno (TM) 740", deviceMemory: 8, android: true }, "T3"],
    ["T3 GPU without the memory", { renderer: "Adreno (TM) 740", deviceMemory: 4, android: true }, "T2"],
    ["mid-range Android (Mali-G57)", { renderer: "Mali-G57 MC2", deviceMemory: 4, android: true }, "T2"],
    ["masked renderer on Android", { renderer: null, deviceMemory: 4, android: true }, "T2"],
    ["unlisted desktop GPU with memory and cores", { renderer: "NVIDIA GeForce RTX 4070", deviceMemory: 8, cores: 16 }, "T3"],
    ["no WebGL2", { webgl2: false }, "T1"],
    ["small textures", { maxTextureSize: 1024 }, "T1"],
    ["2 GB of memory", { deviceMemory: 2, renderer: "Mali-G52", android: true }, "T1"],
    ["two cores", { cores: 2 }, "T1"],
    ["Save-Data", { saveData: true }, "T1"],
    ["reduced motion", { reducedMotion: true }, "T0"],
    ["forced colours wins over everything", { forcedColors: true, reducedMotion: true }, "forced-colors"],
  ])("%s -> %s", (_, over, tier) => {
    const pick = pickTier(phone(over))
    expect(pick.tier).toBe(tier)
    expect(pick.reason).not.toBe("")
  })

  it("Android starting one rung lower is one constant", () => {
    const flagship = phone({ renderer: "Adreno (TM) 740", deviceMemory: 8, android: true })
    expect(TIER_RULES.androidRungsDown).toBe(0)
    expect(pickTier(flagship, { ...TIER_RULES, androidRungsDown: 1 })).toMatchObject({ tier: "T2", reason: /Android starts 1 rung lower/ })
    // ...and never below T1.
    expect(pickTier(phone({ renderer: "Mali-G57", android: true }), { ...TIER_RULES, androidRungsDown: 3 }).tier).toBe("T1")
    // iOS is untouched.
    expect(pickTier(phone(), { ...TIER_RULES, androidRungsDown: 1 }).tier).toBe("T3")
  })
})

describe("framesSayDemote (slow-frame rule)", () => {
  it("demotes after two slow windows in a row, or three in total", () => {
    expect(framesSayDemote([16, 40, 16, 40])).toBe(false)
    expect(framesSayDemote([16, 40, 40])).toBe(true)
    expect(framesSayDemote([40, 16, 40, 16, 40])).toBe(true)
    expect(framesSayDemote([16, 33, 33])).toBe(false) // at the limit is not over it
  })
})

describe("the session tier store", () => {
  it("jsdom has no WebGL2: T1; reduced motion: T0", () => {
    expect(getTierState()).toMatchObject({ tier: "T1", reason: "no WebGL2" })
    resetTier()
    setReducedMotion(true)
    expect(getTierState().tier).toBe("T0")
  })

  it("demotes only: a higher tier is refused, and every step is recorded", () => {
    expect(demote("T3", "never")).toBe(false)
    expect(demote("T1", "same")).toBe(false)
    expect(demote("T0", "context lost")).toBe(true)
    expect(demote("T1", "back up?")).toBe(false)
    const s = getTierState()
    expect(s.tier).toBe("T0")
    expect(s.demotions).toEqual([expect.objectContaining({ from: "T1", to: "T0", reason: "context lost" })])
    expect(s.picked.tier).toBe("T1")
  })

  it("a demotion holds for the session across a reload; media-driven tiers are not stored", () => {
    demote("T0", "reduced motion turned on")
    expect(window.sessionStorage.getItem(TIER_KEY)).toBeNull()
    window.sessionStorage.setItem(TIER_KEY, JSON.stringify({ tier: "T1", reason: "WebGL context lost" }))
    // A reload on a WebGL2 device (masked renderer: the heuristic picks T2), with the demotion stored.
    vi.stubGlobal("WebGL2RenderingContext", class {})
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({
      MAX_TEXTURE_SIZE: 0x0d33,
      getParameter: () => 8192,
      getExtension: () => null,
    } as unknown as RenderingContext)
    resetTier()
    expect(getTierState()).toMatchObject({ tier: "T1", reason: "WebGL context lost (held for this session)", picked: { tier: "T2" } })
    vi.unstubAllGlobals()
  })

  it("WebGL context loss and the Still chip both land on T1, never above", () => {
    expect(demote("T1", "lanyard failed (WebGL context lost or error)")).toBe(false) // already T1 in jsdom
    setStill(true)
    expect(getTierState()).toMatchObject({ tier: "T1", still: true })
    setStill(false)
    expect(getTierState()).toMatchObject({ tier: "T1", still: false })
  })
})
