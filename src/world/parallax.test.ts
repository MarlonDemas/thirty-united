import { describe, expect, it } from "vitest"
import { isHero, PARALLAX, parallaxDepth } from "@/world/parallax"

describe("parallax depth per tier", () => {
  it("T3 moves every layer by its depth", () => {
    expect(parallaxDepth("l1-sky", 0.05, "T3")).toBe(0.05)
    expect(parallaxDepth("l4-foreground", 1, "T3")).toBe(1)
  })

  it("T2 moves the hero (Makes's plates) only", () => {
    for (const name of ["l5-makes", "l6-makes-wave", "l7-makes-signing"]) {
      expect(isHero(name)).toBe(true)
      expect(parallaxDepth(name, 0.7, "T2")).toBe(0.7)
    }
    expect(parallaxDepth("l3-crowd", 0.45, "T2")).toBe(0)
    expect(parallaxDepth("l8-shirt", 0.6, "T2")).toBe(0)
  })

  it("nothing moves below the WebGL tiers", () => {
    for (const tier of ["T1", "T0", "forced-colors"] as const) expect(parallaxDepth("l5-makes", 0.7, tier)).toBe(0)
  })

  it("a few poster px at most (no forward travel, no drift)", () => {
    expect(PARALLAX.maxPx).toBeLessThanOrEqual(10)
  })
})
