import { describe, expect, it } from "vitest"
import { getSoundOn, playStamp, playTearTick, setSoundOn, unlockAudio } from "@/lib/sound"
import { tiltFor } from "@/hooks/useTilt"

describe("sound preference", () => {
  it("is off by default and remembered in sessionStorage", () => {
    expect(getSoundOn()).toBe(false)
    setSoundOn(true)
    expect(getSoundOn()).toBe(true)
    setSoundOn(false)
    expect(getSoundOn()).toBe(false)
  })
  it("playing without an unlocked context is a silent no-op", () => {
    setSoundOn(true)
    expect(() => {
      playStamp()
      playTearTick(1)
    }).not.toThrow()
    expect(unlockAudio()).toBeNull() // jsdom has no AudioContext
  })
})

describe("tiltFor", () => {
  it("presses the pointer side away, clamped to the max", () => {
    expect(tiltFor(1, 0, 9)).toEqual({ rotateX: -0, rotateY: 9 })
    expect(tiltFor(0, -1, 9)).toEqual({ rotateX: 9, rotateY: 0 })
    expect(tiltFor(5, 5, 7)).toEqual({ rotateX: -7, rotateY: 7 })
  })
})
