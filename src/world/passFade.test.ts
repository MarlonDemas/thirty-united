import { describe, expect, it } from "vitest"
import { fadeToward, PASS_FADE_MS } from "@/world/passFade"

describe("fadeToward", () => {
  it("reaches exactly the target after the 160 ms, either way", () => {
    expect(fadeToward(0, 1, PASS_FADE_MS)).toBe(1)
    expect(fadeToward(0.5, 1, PASS_FADE_MS)).toBe(1)
    expect(fadeToward(1, 0, PASS_FADE_MS)).toBe(0)
    expect(fadeToward(0.1, 0, PASS_FADE_MS * 2)).toBe(0)
  })

  it("follows cubic-bezier(0.2, 0, 0, 1), not a straight line", () => {
    const mid = fadeToward(0, 1, PASS_FADE_MS / 2)
    expect(mid).toBeCloseTo(0.84, 1)
    expect(Math.abs(mid - 0.5)).toBeGreaterThan(0.3)
    expect(fadeToward(1, 0, PASS_FADE_MS / 2)).toBeCloseTo(1 - mid, 6)
  })

  it("only ever moves toward the target, frame by frame", () => {
    for (const [from, to] of [[0, 1], [1, 0]] as [number, number][]) {
      let o = from
      let prev = o
      for (let i = 0; i < 10; i++) {
        o = fadeToward(o, to, 16)
        expect(to ? o >= prev : o <= prev).toBe(true)
        prev = o
      }
      expect(o).toBeCloseTo(fadeToward(from, to, 160), 1) // 10 x 16 ms
    }
  })

  it("steps frame by frame to the same place as one step of the same total time", () => {
    let o = 0
    for (let i = 0; i < 5; i++) o = fadeToward(o, 1, 16)
    expect(o).toBeCloseTo(fadeToward(0, 1, 80), 5)
  })

  it("carries on from the current opacity when reversed mid-way, with no jump", () => {
    const up = fadeToward(0, 1, 48)
    expect(fadeToward(up, 0, 1)).toBeLessThanOrEqual(up)
    expect(up - fadeToward(up, 0, 1)).toBeLessThan(0.05)
    expect(fadeToward(up, 1, 1)).toBeGreaterThanOrEqual(up)
  })

  it("holds still with no time passed", () => {
    expect(fadeToward(0.3, 1, 0)).toBe(0.3)
    expect(fadeToward(0.3, 1, -5)).toBe(0.3)
    expect(fadeToward(0.3, 0, -5)).toBe(0.3)
  })
})
