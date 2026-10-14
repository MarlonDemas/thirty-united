import { afterEach, describe, expect, it, vi } from "vitest"
import { haptic, HAPTICS, ticksBetween } from "@/lib/haptics"

function setVibrate(fn: unknown) {
  Object.defineProperty(navigator, "vibrate", { value: fn, configurable: true, writable: true })
}
afterEach(() => {
  delete (navigator as unknown as { vibrate?: unknown }).vibrate
})

describe("haptic", () => {
  it("is a silent no-op when vibrate is unsupported", () => {
    expect(haptic(HAPTICS.tick)).toBe(false)
  })
  it("vibrates with the pattern where supported", () => {
    const v = vi.fn(() => true)
    setVibrate(v)
    expect(haptic([...HAPTICS.separate])).toBe(true)
    expect(v).toHaveBeenCalledWith([10, 30, 18])
  })
  it("does nothing under reduced motion", () => {
    const v = vi.fn(() => true)
    setVibrate(v)
    ;(globalThis as { __reduced?: boolean }).__reduced = true
    expect(haptic(22)).toBe(false)
    expect(v).not.toHaveBeenCalled()
  })
  it("waits for the first tap where the browser reports user activation", () => {
    const v = vi.fn(() => true)
    setVibrate(v)
    Object.defineProperty(navigator, "userActivation", { value: { hasBeenActive: false }, configurable: true })
    expect(haptic(4)).toBe(false)
    expect(v).not.toHaveBeenCalled()
    Object.defineProperty(navigator, "userActivation", { value: { hasBeenActive: true }, configurable: true })
    expect(haptic(4)).toBe(true)
    delete (navigator as unknown as { userActivation?: unknown }).userActivation
  })
  it("swallows a throwing vibrate", () => {
    setVibrate(() => {
      throw new Error("blocked")
    })
    expect(haptic(4)).toBe(false)
  })
})

describe("ticksBetween", () => {
  it("fires one tick per 40px of forward travel", () => {
    expect(ticksBetween(0, 39)).toEqual({ count: 0, next: 0 })
    expect(ticksBetween(0, 85)).toEqual({ count: 2, next: 80 })
  })
  it("does not fire going backwards", () => {
    expect(ticksBetween(80, 20)).toEqual({ count: 0, next: 80 })
  })
})

describe("haptic on iOS (no navigator.vibrate)", () => {
  it("returns false without throwing, for every pattern, even after a tap", () => {
    Object.defineProperty(navigator, "userActivation", { value: { hasBeenActive: true }, configurable: true })
    expect("vibrate" in navigator).toBe(false)
    expect(() => haptic(HAPTICS.stamp)).not.toThrow()
    expect(haptic([...HAPTICS.separate])).toBe(false)
    delete (navigator as unknown as { userActivation?: unknown }).userActivation
  })
})
