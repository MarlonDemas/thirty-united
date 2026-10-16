import { describe, expect, it } from "vitest"
import { AI_CREDIT, FIXTURE_LINE, INK, SCRIM, STAMP, STAMP_PARTS, STAMP_POSTER, TYPE, footBlock, rotatedBounds, stampBox, trackedWidth } from "@/poster/layout"
import { POSTER } from "@/world/layers"

describe("footBlock: the fixture line and the credits on a panel scrim at the foot", () => {
  it("with a plus-one: fixture, '+ name', AI credit; 24 px pads, 16 px gaps, flush with the foot", () => {
    const b = footBlock("+ LERATO")
    expect(b.height).toBe(24 + 44 + 16 + 32 + 16 + 24 + 24)
    expect(b.top + b.height).toBe(POSTER.h)
    expect(b.lines.map((l) => l.text)).toEqual([FIXTURE_LINE, "+ LERATO", AI_CREDIT])
    expect(b.lines.map((l) => l.y)).toEqual([b.top + 24 + 22, b.top + 24 + 44 + 16 + 16, b.top + 24 + 44 + 16 + 32 + 16 + 12])
  })

  it("with no plus-one the AI credit sits alone in the credit slot", () => {
    const b = footBlock(null)
    expect(b.height).toBe(24 + 44 + 16 + 24 + 24)
    expect(b.lines.map((l) => l.text)).toEqual([FIXTURE_LINE, AI_CREDIT])
  })

  it("every line stays inside the scrim with its pad", () => {
    for (const b of [footBlock("+ 1"), footBlock(null)])
      for (const l of b.lines) {
        expect(l.y - l.size / 2).toBeGreaterThanOrEqual(b.top + SCRIM.padY)
        expect(l.y + l.size / 2).toBeLessThanOrEqual(POSTER.h - SCRIM.padY)
      }
  })

  it("uses the scene type tokens: fixture 44 px text, credit 32 px and AI credit 24 px moonlight", () => {
    expect(TYPE.fixture).toEqual({ size: 44, tracking: 0.06, color: INK.text })
    expect(TYPE.credit).toMatchObject({ size: 32, color: INK.moonlight })
    expect(TYPE.ai).toEqual({ size: 24, tracking: 0.06, color: INK.moonlight })
    expect(FIXTURE_LINE).toBe("MON 21 DEC 2026 · VENUE TBA")
    expect(AI_CREDIT).toBe("POSTER ART MADE WITH AI")
  })

  it("the scrim is panel at 85 percent or more (7.66:1 worst case, tokens.md)", () => {
    expect(SCRIM.alpha).toBeGreaterThanOrEqual(0.85)
    expect(INK.panel).toBe("#18131F")
  })
})

describe("trackedWidth", () => {
  it("adds tracking between glyphs, not after the last", () => {
    expect(trackedWidth(() => 10, "ABC", 40, 0.06)).toBeCloseTo(30 + 2 * 2.4)
    expect(trackedWidth(() => 10, "A", 40, 0.06)).toBe(10)
    expect(trackedWidth(() => 10, "", 40, 0.06)).toBe(0)
  })
  it("counts code points, not UTF-16 units", () => {
    expect(trackedWidth(() => 10, "Z\u{1F600}", 10, 0)).toBe(20)
  })
})

describe("stampBox: lower right, above the foot block, turned -4 degrees", () => {
  const foot = footBlock("+ LERATO")
  const b = stampBox(300, foot.top)
  const { W, H } = rotatedBounds(b.w, b.h, b.angle)

  it("type at 28 px or more, the live stamp's proportions scaled", () => {
    expect(STAMP.size).toBeGreaterThanOrEqual(28)
    const k = STAMP.size / 24
    expect(b.h).toBeCloseTo((28 + 2 * (2 + 4 + 1 + 4)) * k)
    expect(b.w).toBeCloseTo(300 + 2 * (2 + 4 + 1 + 12) * k)
    expect(STAMP_PARTS.line).toBeCloseTo(28 * k)
  })

  it("its rotated bounds sit `right` in from the edge and `aboveCredits` above the scrim", () => {
    expect(b.angle).toBeCloseTo((-4 * Math.PI) / 180)
    expect(b.cx + W / 2).toBeCloseTo(POSTER.w - STAMP_POSTER.right)
    expect(b.cy + H / 2).toBeCloseTo(foot.top - STAMP_POSTER.aboveCredits)
  })

  it("stays inside the poster and clear of the scrim for both stamps", () => {
    for (const w of [260, 420]) {
      const s = stampBox(w, foot.top)
      const r = rotatedBounds(s.w, s.h, s.angle)
      expect(s.cx - r.W / 2).toBeGreaterThan(0)
      expect(s.cy - r.H / 2).toBeGreaterThan(POSTER.h / 2)
      expect(s.cy + r.H / 2).toBeLessThan(foot.top)
    }
  })
})

describe("rotatedBounds", () => {
  it("is the box itself at 0 and swapped at 90 degrees", () => {
    expect(rotatedBounds(100, 40, 0)).toEqual({ W: 100, H: 40 })
    const q = rotatedBounds(100, 40, Math.PI / 2)
    expect(q.W).toBeCloseTo(40)
    expect(q.H).toBeCloseTo(100)
  })
})
