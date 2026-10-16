import { describe, expect, it } from "vitest"
import { BEATS, banksFor, poseFor } from "@/world/beats"
import { cubicBezier, EASES, FINALE, flying, PROPS, sample, settle, STRIKE_MS, trackEnd, tracksFor, type Track } from "@/world/gl/tracks"

describe("cubicBezier", () => {
  it("pins the ends and matches the linear curve", () => {
    const lin = cubicBezier(0, 0, 1, 1)
    for (const t of [0, 0.25, 0.5, 0.9, 1]) expect(lin(t)).toBeCloseTo(t, 5)
    expect(EASES.fade(0)).toBe(0)
    expect(EASES.fade(1)).toBe(1)
  })

  it("--ease-fade front-loads (most of the strike lands early); the glow overshoots then settles", () => {
    expect(EASES.fade(0.25)).toBeGreaterThan(0.6)
    const peak = Math.max(...Array.from({ length: 99 }, (_, i) => EASES.overshoot((i + 1) / 100)))
    expect(peak).toBeGreaterThan(1)
    expect(peak).toBeLessThan(1.15)
  })
})

describe("sample and settle", () => {
  const track: Track = [
    { to: 0, at: 0, dur: 0, ease: "linear" },
    { to: 1, at: 100, dur: 200, ease: "linear" },
  ]

  it("holds before a segment, moves through it, and lands", () => {
    expect(sample(track, 0.4, 50)).toBe(0)
    expect(sample(track, 0.4, 200)).toBeCloseTo(0.5)
    expect(sample(track, 0.4, 300)).toBe(1)
    expect(trackEnd(track)).toBe(300)
    expect(settle(track, 0.4)).toBe(1)
  })

  it("an interrupted move starts from where the last one had got to", () => {
    expect(sample([{ to: 1, at: 0, dur: 100, ease: "linear" }], 0.4, 50)).toBeCloseTo(0.7)
    expect(sample([], 0.4, 50)).toBe(0.4)
  })
})

describe("tracksFor: beat changes on the WebGL tiers, matching the T1 transitions", () => {
  it("every prop has a track, and every beat settles on the banks and pose the still layer shows", () => {
    for (const beat of BEATS)
      for (const attending of [undefined, "yes", "maybe", "no"] as const) {
        const tr = tracksFor(beat, attending)
        expect(Object.keys(tr).sort()).toEqual([...PROPS].sort())
        banksFor(beat, attending).forEach((level, i) => expect(settle(tr[`bank${i + 1}` as "bank1"], 0)).toBe(level))
        const pose = poseFor(beat, attending)
        for (const p of ["l5-makes", "l6-makes-wave", "l7-makes-signing"] as const) expect(settle(tr[p], 0)).toBe(p === pose ? 1 : 0)
      }
  })

  it("Maybe holds bank two at half; its reveal mask still opens and its glow is lit", () => {
    const tr = tracksFor("chapter2", "maybe", "chapter1")
    expect(settle(tr.bank2, 0)).toBe(0.5)
    expect(settle(tr.reveal2, 0)).toBe(1)
    expect(settle(tr.glow2, 0.55)).toBe(1)
  })

  it("a strike is one way over 600 ms; a dark bank's glow rests at 0.55", () => {
    const tr = tracksFor("chapter1", "yes", "cover")
    expect(trackEnd(tr.bank1)).toBe(STRIKE_MS)
    expect(sample(tr.bank1, 0, 300)).toBeGreaterThan(0.5)
    expect(settle(tr.glow2, 0.55)).toBe(0.55)
  })

  it("the signing: pose at 550 ms over 350 ms, every bank fires at 1400 ms, the ember burst runs 1200 ms from there", () => {
    const tr = tracksFor("signed", "yes", "code")
    expect(sample(tr["l7-makes-signing"], 0, FINALE.poseAt - 1)).toBe(0)
    expect(sample(tr["l7-makes-signing"], 0, FINALE.poseAt + FINALE.poseMs)).toBe(1)
    expect(sample(tr.bank4, 0, FINALE.ignitionAt - 1)).toBe(0)
    expect(sample(tr.bank4, 0, FINALE.ignitionAt + STRIKE_MS)).toBe(1)
    expect(flying(sample(tr.burst, 1, FINALE.ignitionAt - 1))).toBe(false)
    expect(flying(sample(tr.burst, 1, FINALE.ignitionAt + 600))).toBe(true)
    expect(flying(settle(tr.burst, 0))).toBe(false)
    expect(trackEnd(tr.burst)).toBe(FINALE.ignitionAt + FINALE.burstMs)
  })

  it("the Yes swirl rises only on Continue from Chapter 1, never on a rebuild or for Maybe and No", () => {
    expect(trackEnd(tracksFor("chapter2", "yes", "chapter1").swirl)).toBeGreaterThan(0)
    expect(tracksFor("chapter2", "yes").swirl).toEqual([])
    expect(tracksFor("chapter2", "yes", "code").swirl).toEqual([])
    expect(tracksFor("chapter2", "maybe", "chapter1").swirl).toEqual([])
    expect(tracksFor("chapter2", "no", "chapter1").swirl).toEqual([])
  })

  it("the hanging shirt swings in over 600 ms for Yes and Maybe from Chapter 2, and is gone at the signing", () => {
    expect(settle(tracksFor("chapter2", "yes", "chapter1").shirt, 0)).toBe(1)
    expect(trackEnd(tracksFor("chapter2", "maybe", "chapter1").shirt)).toBe(600)
    expect(settle(tracksFor("chapter2", "no", "chapter1").shirt, 0)).toBe(0)
    expect(settle(tracksFor("signed", "yes", "code").shirt, 1)).toBe(0)
  })
})
