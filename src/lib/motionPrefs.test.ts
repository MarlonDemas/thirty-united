import { describe, expect, it } from "vitest"
import { forcedColors, prefersReducedMotion } from "@/lib/motionPrefs"
import { stubMedia } from "@/test-media"

describe("motionPrefs", () => {
  it("reports neither preference by default", () => {
    stubMedia()
    expect(prefersReducedMotion()).toBe(false)
    expect(forcedColors()).toBe(false)
  })
  it("reads reduced motion independently of forced colors", () => {
    stubMedia({ reduced: true })
    expect(prefersReducedMotion()).toBe(true)
    expect(forcedColors()).toBe(false)
  })
  it("reads forced colors independently of reduced motion", () => {
    stubMedia({ forced: true })
    expect(forcedColors()).toBe(true)
    expect(prefersReducedMotion()).toBe(false)
  })
  it("is false for both when matchMedia is missing", () => {
    ;(window as unknown as { matchMedia?: unknown }).matchMedia = undefined
    expect(prefersReducedMotion()).toBe(false)
    expect(forcedColors()).toBe(false)
  })
})
