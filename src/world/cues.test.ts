import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Attending } from "@/lib/schemas/rsvp"
import type { Beat } from "@/world/beats"

const played = vi.hoisted(() => [] as string[])
const buzzed = vi.hoisted(() => [] as unknown[])
vi.mock("@/lib/sound", () => ({ playCue: (c: string) => played.push(c) }))
vi.mock("@/lib/haptics", async (orig) => ({
  ...(await orig<typeof import("@/lib/haptics")>()),
  haptic: (p: unknown) => buzzed.push(p),
}))

const { digitHit, hitsFor, useWorldHits } = await import("@/world/cues")

describe("hitsFor: the beat tables' Sound and Haptics columns", () => {
  it("the tear: bank one strikes with a clunk, the hum and 12 ms; the drum as the push begins", () => {
    expect(hitsFor("cover", "chapter1")).toEqual([
      { at: 0, sound: ["clunk", "hum"], buzz: 12 },
      { at: 400, sound: ["drum"] },
    ])
  })
  it.each([
    ["yes", ["swell"], 12],
    ["maybe", ["swellSoft"], 8],
    ["no", ["crackle"], 8],
  ] as const)("Chapter 1 Continue on %s: %j and %i ms", (a, sound, buzz) => {
    expect(hitsFor("chapter1", "chapter2", a)).toEqual([{ at: 0, sound, buzz }])
  })
  it.each(["yes", "maybe"] as const)("Send my code on %s: bank three strikes, clunk, hum and 12 ms", (a) => {
    expect(hitsFor("chapter2", "code", a)).toEqual([{ at: 0, sound: ["clunk", "hum"], buzz: 12 }])
  })
  it("Send my code on No: no bank strikes, silent", () => {
    expect(hitsFor("chapter2", "code", "no")).toEqual([])
  })
  it("the right code: bank four 12 ms, then hush at 250, drum and the number's 22 ms at 900, swell at 1400", () => {
    expect(hitsFor("code", "signed", "yes")).toEqual([
      { at: 0, buzz: 12 },
      { at: 250, sound: ["hush"] },
      { at: 900, sound: ["drum"], buzz: 22 },
      { at: 1400, sound: ["swell"] },
    ])
  })
  it.each<[Beat, Beat, Attending | undefined]>([
    ["code", "no-end", "no"], // the No finale: lights stay, nothing strikes
    ["code", "chapter2", "yes"], // back to my answers
    ["chapter2", "chapter1", "yes"], // change the answer
    ["signed", "chapter2", "yes"], // changed your mind
    ["chapter1", "chapter2", undefined],
  ])("%s to %s is silent", (from, to, a) => {
    expect(hitsFor(from, to, a)).toEqual([])
  })
  it("a digit typed: a soft tick and 4 ms; clearing or a wrong code's reset is silent", () => {
    expect(digitHit(2, 3)).toEqual({ at: 0, sound: ["tick"], buzz: 4 })
    expect(digitHit(0, 6)).toEqual({ at: 0, sound: ["tick"], buzz: 4 }) // a paste is one tick
    expect(digitHit(6, 0)).toBeNull()
    expect(digitHit(3, 3)).toBeNull()
  })
})

describe("useWorldHits", () => {
  beforeEach(() => {
    played.length = 0
    buzzed.length = 0
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  const mount = (beat: Beat, attending?: Attending, digits = 0) =>
    renderHook((p: { beat: Beat; attending?: Attending; digits: number }) => useWorldHits(p.beat, p.attending, p.digits), {
      initialProps: { beat, attending, digits },
    })

  it("plays nothing on mount (a restored code step does not strike again)", () => {
    mount("code", "yes")
    vi.runAllTimers()
    expect(played).toEqual([])
    expect(buzzed).toEqual([])
  })
  it("plays each hit at its time", () => {
    const h = mount("code", "yes")
    h.rerender({ beat: "signed", attending: "yes", digits: 0 })
    expect(buzzed).toEqual([12]) // the 0 ms hit fires with the beat change, no timer
    expect(played).toEqual([])
    vi.advanceTimersByTime(250)
    expect(played).toEqual(["hush"])
    vi.advanceTimersByTime(650)
    expect(played).toEqual(["hush", "drum"])
    expect(buzzed).toEqual([12, 22])
    vi.advanceTimersByTime(500)
    expect(played).toEqual(["hush", "drum", "swell"])
  })
  it("ticks once per digit typed, never on clearing", () => {
    const h = mount("code", "yes")
    h.rerender({ beat: "code", attending: "yes", digits: 1 })
    h.rerender({ beat: "code", attending: "yes", digits: 2 })
    h.rerender({ beat: "code", attending: "yes", digits: 0 })
    expect(played).toEqual(["tick", "tick"])
    expect(buzzed).toEqual([4, 4])
  })
  it("leaving the page cancels the hits still to come", () => {
    const h = mount("code", "yes")
    h.rerender({ beat: "signed", attending: "yes", digits: 0 })
    h.unmount()
    vi.runAllTimers()
    expect(played).toEqual([])
  })
})
