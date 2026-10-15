import { describe, expect, it } from "vitest"
import { BEATS } from "@/world/beats"
import { ANCHORS, QUADS } from "@/world/layers"
import { DESKTOP, KEYBOARD, keyboardOpen, layoutFor, PANEL_FRACTION, placementFor, toScreen, type Layout } from "@/world/shots"

const PHONES = [
  [360, 640],
  [390, 844],
  [430, 932],
] as const
const phone = (w: number, h: number) => layoutFor({ w, h, vvTop: 0, vvH: h, keyboard: false })

describe.each(PHONES)("shots at %ix%i", (w, h) => {
  const l = phone(w, h)

  it("the panel's top edge is the same in every beat", () => {
    expect(l.panelTop).toBe(Math.round(h * (1 - PANEL_FRACTION)))
    // The panel top comes from the layout alone; no beat can move it.
    expect(new Set(BEATS.map(() => layoutFor({ w, h, vvTop: 0, vvH: h, keyboard: false }).panelTop)).size).toBe(1)
  })

  it.each(BEATS)("%s: Makes's face sits above the panel, and the poster covers the frame", (beat) => {
    const p = placementFor(beat, "yes", l)
    const faceBottom = toScreen(p, [ANCHORS.face.x, ANCHORS.face.y + ANCHORS.face.r])[1]
    expect(faceBottom).toBeLessThan(l.panelTop)
    expect(p.tx).toBeLessThanOrEqual(0)
    expect(p.ty).toBeLessThanOrEqual(0)
    expect(p.tx + 1080 * p.s).toBeGreaterThanOrEqual(w - 0.5)
    expect(p.ty + 1920 * p.s).toBeGreaterThanOrEqual(h - 0.5)
  })

  it("signed: the held shirt and the title clear the panel", () => {
    const p = placementFor("signed", "yes", l)
    const shirtBottom = Math.max(...QUADS["l7-makes-signing"].map((pt) => toScreen(p, pt)[1]))
    expect(shirtBottom).toBeLessThan(l.panelTop)
    expect(toScreen(p, [540, ANCHORS.title.top])[1]).toBeLessThan(l.panelTop)
  })

  it("code: all six lamps are on screen above the panel", () => {
    const p = placementFor("code", "yes", l)
    for (const pt of ANCHORS.lamps) {
      const [x, y] = toScreen(p, pt as [number, number])
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(w)
      expect(y).toBeLessThan(l.panelTop)
    }
  })
})

describe("keyboard", () => {
  it("is open only with a field focused and the visual height down by more than the threshold", () => {
    expect(keyboardOpen(844, 844 - KEYBOARD.minPx - 1, true)).toBe(true)
    expect(keyboardOpen(844, 844 - KEYBOARD.minPx - 1, false)).toBe(false)
    expect(keyboardOpen(844, 844 - KEYBOARD.minPx, true)).toBe(false)
  })

  it("the panel fills the visual viewport below a shirt strip of at least 120 px", () => {
    const vvH = 844 - 336
    const l = layoutFor({ w: 390, h: 844, vvTop: 0, vvH, keyboard: true })
    expect(l.keyboard).toBe(true)
    expect(l.strip).toBeGreaterThanOrEqual(KEYBOARD.stripMinPx)
    expect(l.panelTop).toBe(l.strip)
    expect(l.panelTop + l.panelH).toBe(vvH)
    // A tiny visible area still keeps the 120 px strip.
    expect(layoutFor({ w: 360, h: 640, vvTop: 0, vvH: 300, keyboard: true }).strip).toBe(KEYBOARD.stripMinPx)
  })

  it("follows a scrolled visual viewport, and the strip frames the lamps on the code beat", () => {
    const l = layoutFor({ w: 390, h: 844, vvTop: 40, vvH: 508, keyboard: true })
    expect(l.panelTop).toBe(40 + l.strip)
    const p = placementFor("code", "yes", l, 40)
    const lampY = toScreen(p, ANCHORS.lamps[0] as [number, number])[1]
    expect(lampY).toBeGreaterThan(40)
    expect(lampY).toBeLessThan(l.panelTop)
  })
})

describe("desktop", () => {
  it.each([
    [1440, 900],
    [1024, 768],
    [1920, 1080],
  ])("%ix%i: a 9:16 frame at most 100dvh - 64, left of a 420 px panel, never overlapping", (w, h) => {
    const l = layoutFor({ w, h, vvTop: 0, vvH: h, keyboard: false }) as Extract<Layout, { mode: "desktop" }>
    expect(l.mode).toBe("desktop")
    expect(l.frame.h).toBeLessThanOrEqual(h - DESKTOP.gutter)
    expect(l.frame.w / l.frame.h).toBeCloseTo(9 / 16, 5)
    expect(l.frame.x).toBeGreaterThanOrEqual(0)
    expect(l.frame.x + l.frame.w).toBeLessThanOrEqual(w - DESKTOP.panelWidth)
    // The whole poster shows on desktop.
    expect(placementFor("code", "yes", l).s).toBeCloseTo(l.frame.h / 1920, 5)
  })
})
