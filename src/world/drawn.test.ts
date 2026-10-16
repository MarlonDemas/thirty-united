import { describe, expect, it } from "vitest"
import { QUADS } from "@/world/layers"
import { applyMatrix, MOON, moonPath, quadMatrix } from "@/world/draw"

describe("the moon, drawn in code", () => {
  it("is about 93 percent lit, waxing gibbous", () => {
    expect(MOON.illuminated).toBeCloseTo(0.93, 2)
    const r = 56
    // The terminator is a half ellipse of half-width |2k - 1| r that bulges into the dark side.
    expect(moonPath(r, MOON.illuminated, "left")).toBe(`M0 ${-r}A${r} ${r} 0 0 0 0 ${r}A${Math.abs(2 * 0.93 - 1) * r} ${r} 0 0 0 0 ${-r}Z`)
    // Full moon: two half discs. New moon side flips with the lit side.
    expect(moonPath(r, 1, "right")).toBe(`M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${r} ${r} 0 0 1 0 ${-r}Z`)
  })
})

describe("quadMatrix (lettering in perspective on the shirt)", () => {
  it.each(Object.entries(QUADS))("maps the box corners onto the %s quad", (_, quad) => {
    const m = quadMatrix(400, 300, quad)
    const corners: [number, number][] = [
      [0, 0],
      [400, 0],
      [400, 300],
      [0, 300],
    ]
    corners.forEach((c, i) => {
      const [x, y] = applyMatrix(m, c)
      expect(x).toBeCloseTo(quad[i][0], 6)
      expect(y).toBeCloseTo(quad[i][1], 6)
    })
  })
})
