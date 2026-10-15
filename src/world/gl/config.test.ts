import { describe, expect, it } from "vitest"
import { canvasDpr, EMBERS, hexToRgb, plateQuad, SMOKE_QUADS, smokeQuadsFor, toWorld, worldConfig } from "@/world/gl/config"

describe("worldConfig: what each WebGL tier draws", () => {
  it("T3: 300 embers at start, up to 1,500; three smoke quads; beam cards; DPR up to 2 (1.5 on Android)", () => {
    expect(worldConfig("T3", false)).toEqual({ embers: { base: 300, cap: 1500 }, smoke: 3, beams: true, dprCap: 2 })
    expect(worldConfig("T3", true).dprCap).toBe(1.5)
  })

  it("T2: fewer embers (cap 500), one smoke quad, no beam cards, DPR up to 1.25", () => {
    expect(worldConfig("T2", false)).toEqual({ embers: { base: 120, cap: 500 }, smoke: 1, beams: false, dprCap: 1.25 })
    expect(worldConfig("T2", true)).toEqual(worldConfig("T2", false))
  })

  it("T2 never draws more than T3, and no tier passes the 1,500 cap", () => {
    expect(EMBERS.T2.base).toBeLessThan(EMBERS.T3.base)
    expect(EMBERS.T2.cap).toBeLessThan(EMBERS.T3.cap)
    for (const t of ["T3", "T2"] as const) {
      const { base, cap } = worldConfig(t, false).embers
      expect(base).toBeLessThanOrEqual(cap)
      expect(cap).toBeLessThanOrEqual(1500)
    }
  })

  it("smoke: T2 keeps the crowd band, T3 adds the back band and the low front band", () => {
    expect(smokeQuadsFor(worldConfig("T2", false))).toEqual([SMOKE_QUADS[0]])
    expect(smokeQuadsFor(worldConfig("T3", false))).toEqual(SMOKE_QUADS)
    expect(SMOKE_QUADS[0].z).toBeGreaterThan(4) // over the crowd
    expect(SMOKE_QUADS[1].z).toBeLessThan(4) // behind it
    expect(SMOKE_QUADS[2].z).toBeGreaterThan(8) // over the rubble
  })
})

describe("canvasDpr: canvas px per poster px", () => {
  it("renders the cover shot at the capped screen density", () => {
    // 390 x 844 phone: the cover scales the poster by 844 / 1920 = 0.44; at DPR 2 that is 0.88 canvas px per poster px.
    expect(canvasDpr({ w: 390, h: 844 }, 2, 2)).toBe(0.88)
    expect(canvasDpr({ w: 390, h: 844 }, 3, 1.25)).toBe(0.55)
  })

  it("never sharper than the 1080 plates, never under half", () => {
    expect(canvasDpr({ w: 1440, h: 2560 }, 2, 2)).toBe(1)
    expect(canvasDpr({ w: 320, h: 480 }, 1, 1.25)).toBe(0.5)
  })

  it("a missing device DPR counts as 1", () => {
    expect(canvasDpr({ w: 500, h: 1280 }, 0, 2)).toBe(0.67) // cover 1280 / 1920
  })
})

describe("poster space to world space", () => {
  it("centres the origin and flips y", () => {
    expect(toWorld(0, 0)).toEqual([-540, 960])
    expect(toWorld(540, 960)).toEqual([0, 0])
    expect(toWorld(1080, 1920)).toEqual([540, -960])
  })

  it("pads a plate past the poster edges it touches, with UVs that clamp to its border", () => {
    // The sky: the top, left and right edges.
    const sky = plateQuad([0, 0, 1080, 1023], 12)
    expect(sky.rect).toEqual({ x0: -12, y0: -12, x1: 1092, y1: 1023 })
    expect(sky.uv.x0).toBeCloseTo(-12 / 1080)
    expect(sky.uv.x1).toBeCloseTo(1 + 12 / 1080)
    expect(sky.uv.y0).toBeCloseTo(1 + 12 / 1023)
    expect(sky.uv.y1).toBe(-0)
  })

  it("leaves interior plates exactly on their box", () => {
    const thirty = plateQuad([114, 50, 630, 130], 12)
    expect(thirty.rect).toEqual({ x0: 114, y0: 50, x1: 744, y1: 180 })
    expect(thirty.uv).toEqual({ x0: -0, y0: 1, x1: 1, y1: -0 })
  })
})

describe("hexToRgb", () => {
  it("keeps the stored sRGB values", () => {
    expect(hexToRgb("#F1C7A0")).toEqual([241 / 255, 199 / 255, 160 / 255])
    expect(hexToRgb("e03d2b")).toEqual([224 / 255, 61 / 255, 43 / 255])
  })

  it("refuses anything that is not #rrggbb", () => {
    expect(() => hexToRgb("#fff")).toThrow()
  })
})
