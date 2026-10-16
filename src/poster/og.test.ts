import { describe, expect, it } from "vitest"
import { OG, OG_DATE, ogBand, ogTitleBox } from "@/poster/og"
import { ANCHORS, LAYERS, POSTER } from "@/world/layers"

const makes = LAYERS.find((l) => l.name === "l5-makes")!

describe("ogBand: the 1200 x 630 teaser crop of the cover", () => {
  const b = ogBand()

  it("full poster width at 1200 / 1080, so the band is 567 poster px tall and inside the poster", () => {
    expect(b.s * POSTER.w).toBe(OG.w)
    expect(b.h * b.s).toBeCloseTo(OG.h)
    expect(b.top).toBeGreaterThanOrEqual(0)
    expect(b.bottom).toBeLessThanOrEqual(POSTER.h)
  })

  it("Makes from the head down: his hairline (plate top) and face are in the band", () => {
    expect(b.top).toBeLessThanOrEqual(makes.bbox[1])
    expect(ANCHORS.face.y - ANCHORS.face.r).toBeGreaterThan(b.top)
  })

  it("all four tower heads and the moon are in the band", () => {
    for (const k of ANCHORS.banks) {
      expect(k.y).toBeGreaterThan(b.top)
      expect(k.y).toBeLessThan(b.bottom)
    }
    expect(ANCHORS.moon.y - ANCHORS.moon.r).toBeGreaterThan(b.top)
  })
})

describe("ogTitleBox: THIRTY in the sky, the date beneath", () => {
  const t = ogTitleBox()
  const { s, top } = ogBand()

  it("keeps the lockup's aspect and stays inside the preview", () => {
    const thirty = LAYERS.find((l) => l.name === "thirty")!
    expect(t.w / t.h).toBeCloseTo(thirty.bbox[2] / thirty.bbox[3])
    expect(t.x).toBeGreaterThan(0)
    expect(t.x + t.w).toBeLessThan(OG.w)
    expect(t.dateY).toBeLessThan(OG.h / 2)
  })

  it("clears Makes's face and the nearest tower head", () => {
    const faceLeft = (ANCHORS.face.x - ANCHORS.face.r) * s
    expect(t.x + t.w).toBeLessThan(faceLeft)
    const bank2Top = (ANCHORS.banks[1].y - top) * s - 40
    expect(t.dateY + 20).toBeLessThan(bank2Top)
  })

  it("carries the date only: no AI credit, no guest", () => {
    expect(OG_DATE).toBe("21 DEC 2026")
  })
})
