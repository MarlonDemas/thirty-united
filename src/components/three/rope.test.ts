import { describe, expect, it } from "vitest"
import { Lanyard, settleScale } from "./rope"

describe("settleScale", () => {
  it("fits inside the rect and preserves the card's aspect", () => {
    const s = settleScale(358, 366, 400, 300)
    expect(400 * s).toBeLessThanOrEqual(358 + 1e-9)
    expect(300 * s).toBeLessThanOrEqual(366 + 1e-9)
    expect(Math.max(400 * s - 358, 300 * s - 366)).toBeCloseTo(0) // the limiting side touches the rect
  })
  it("uses the tighter axis", () => {
    expect(settleScale(100, 1000, 200, 100)).toBe(0.5)
    expect(settleScale(1000, 100, 200, 100)).toBe(1)
  })
})

describe("Lanyard activity", () => {
  it("is active after wake and settles to inactive", () => {
    const l = new Lanyard(0, 5, 3, 6, 2, { x: 5, yMin: -5 }, 0)
    l.grabAt(0, 0)
    for (let i = 0; i < 5; i++) l.step(10, 0.98, 1 / 60)
    expect(l.active).toBe(true)
    l.release()
    expect(l.active).toBe(true)
    for (let i = 0; i < 3000 && l.active; i++) l.step(10, 0.98, 1 / 60)
    expect(l.active).toBe(false)
  })
})
