import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { boundsOf, clearPass, fadeToward, getPass, PASS_FADE_MS, posterRect, setPass, passTarget, PASS_MAX_DPR, usePass, type PassRequest } from "@/world/pass"

const request = (): PassRequest => ({
  hostLine: "line",
  host: document.createElement("div"),
  hit: document.createElement("div"),
  settleRef: { current: null },
  shown: false,
  onReady: () => {},
  onFail: () => {},
  onGone: () => {},
})

describe("the pass request", () => {
  afterEach(() => setPass(null))

  it("is published to the world and cleared by its owner only", () => {
    const { result } = renderHook(() => usePass())
    expect(result.current).toBeNull()
    const a = request()
    act(() => setPass(a))
    expect(result.current).toBe(a)
    const b = request()
    act(() => setPass(b))
    act(() => clearPass(a)) // a stale owner's cleanup leaves the newer request alone
    expect(getPass()).toBe(b)
    act(() => clearPass(b))
    expect(result.current).toBeNull()
  })

  it("replacing a request in one go never shows the world an empty slot", () => {
    const a = request()
    setPass(a)
    const b = { ...a, shown: true }
    const seen: (PassRequest | null)[] = []
    const { result } = renderHook(() => {
      const p = usePass()
      seen.push(p)
      return p
    })
    act(() => {
      clearPass(a)
      setPass(b)
    })
    expect(result.current).toBe(b)
    expect(seen).not.toContain(null)
  })
})

describe("posterRect", () => {
  it("maps the host's screen box into poster px through the shot's scale and offset", () => {
    // The poster is shown at half size, its top left at (-20, 10) on screen.
    const canvas = { left: -20, top: 10, width: 540, height: 960 }
    expect(posterRect(canvas, { left: 30, top: 10, width: 100, height: 200 })).toEqual({ x0: 100, y0: 0, x1: 300, y1: 400 })
  })

  it("is null until both boxes have a size", () => {
    const host = { left: 0, top: 0, width: 10, height: 10 }
    expect(posterRect({ left: 0, top: 0, width: 0, height: 0 }, host)).toBeNull()
    expect(posterRect({ left: 0, top: 0, width: 540, height: 960 }, { ...host, height: 0 })).toBeNull()
  })
})

describe("passTarget", () => {
  it("snaps the box to whole canvas pixels, one texel per canvas pixel, up to the as-built pixel ratio", () => {
    // 0.5 canvas px per poster px shown at 0.5 CSS px per poster px: 1 canvas px per CSS px.
    const s = passTarget({ x0: 10.3, y0: 20.6, x1: 110.3, y1: 220.6 }, 0.5, 0.5)
    expect(s).toEqual({ rect: { x0: 10, y0: 20, x1: 110, y1: 220 }, w: 50, h: 100 })
    expect((s.rect.x1 - s.rect.x0) * 0.5).toBe(s.w)
  })

  it("on a denser canvas, draws at the pass's own 1.5 px per CSS px, no more", () => {
    // 0.88 canvas px per poster px at 0.44 CSS px per poster px: 2 canvas px per CSS px.
    const r = { x0: 0, y0: 0, x1: 100 / 0.44, y1: 200 / 0.44 } // a 100 x 200 CSS px box
    expect(passTarget(r, 0.88, 0.44)).toEqual({ rect: r, w: 100 * PASS_MAX_DPR, h: 200 * PASS_MAX_DPR })
  })

  it("never asks for an empty target", () => {
    expect(passTarget({ x0: 5, y0: 5, x1: 5, y1: 5 }, 0.88, 0.88)).toMatchObject({ w: 1, h: 1 })
    expect(passTarget({ x0: 5, y0: 5, x1: 5, y1: 5 }, 0.88, 0.2)).toMatchObject({ w: 1, h: 1 })
  })
})

describe("fadeToward", () => {
  it("covers the whole fade in the stage fade's 160 ms, either way, and never overshoots", () => {
    expect(fadeToward(0, 1, PASS_FADE_MS / 2)).toBeCloseTo(0.5)
    expect(fadeToward(0.5, 1, PASS_FADE_MS)).toBe(1)
    expect(fadeToward(1, 0, PASS_FADE_MS / 4)).toBeCloseTo(0.75)
    expect(fadeToward(0.1, 0, PASS_FADE_MS)).toBe(0)
  })

  it("holds still with no time passed", () => {
    expect(fadeToward(0.3, 1, 0)).toBe(0.3)
    expect(fadeToward(0.3, 1, -5)).toBe(0.3)
  })
})

describe("boundsOf", () => {
  it("is the smallest box around the points (a rotated card's corners)", () => {
    expect(boundsOf([[10, 5], [30, 0], [25, 40], [0, 20]])).toEqual({ left: 0, top: 0, width: 30, height: 40 })
  })

  it("is null with no points", () => {
    expect(boundsOf([])).toBeNull()
  })
})
