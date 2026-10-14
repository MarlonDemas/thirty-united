import { describe, expect, it } from "vitest"
import { dbToGain, getSoundOn, playStamp, playTearTick, setSoundOn, tearFreq, tearGain, unlockAudio } from "@/lib/sound"
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

describe("sound maths", () => {
  it("-18 dB is about 0.126", () => expect(dbToGain(-18)).toBeCloseTo(0.1259, 3))
  it("tear gain and band follow drag speed and stay in range", () => {
    expect(tearGain(0)).toBeCloseTo(0.15)
    expect(tearGain(99)).toBeCloseTo(1)
    expect(tearFreq(0)).toBe(1200)
    expect(tearFreq(99)).toBe(4000)
    expect(tearFreq(-5)).toBe(1200)
  })
})

describe("tiltFor", () => {
  it("presses the pointer side away, clamped to the max", () => {
    expect(tiltFor(1, 0, 9)).toEqual({ rotateX: -0, rotateY: 9 })
    expect(tiltFor(0, -1, 9)).toEqual({ rotateX: 9, rotateY: 0 })
    expect(tiltFor(5, 5, 7)).toEqual({ rotateX: -7, rotateY: 7 })
  })
})
