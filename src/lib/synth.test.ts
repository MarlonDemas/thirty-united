import { describe, expect, it, vi } from "vitest"
import type { Cue } from "@/lib/sound"
import { FLOOR_HZ, dbToGain, play, tearFreq, tearGain } from "@/lib/synth"

const CUES: Cue[] = ["clunk", "hum", "swell", "swellSoft", "hush", "drum", "crackle", "tick"]

/** A Web Audio stand-in that records every node and every frequency set on an oscillator. */
function recorder() {
  const hz: number[] = []
  const sources: { loop?: boolean; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = []
  const param = (track?: number[]) => ({
    setValueAtTime: vi.fn((v: number) => track?.push(v)),
    exponentialRampToValueAtTime: vi.fn((v: number) => track?.push(v)),
    linearRampToValueAtTime: vi.fn(),
  })
  const node = <T extends object>(extra: T) => ({ connect: (n: unknown) => n, ...extra })
  const c = {
    currentTime: 2,
    sampleRate: 8000,
    destination: {},
    createBuffer: vi.fn((_ch: number, len: number) => ({ sampleRate: 8000, getChannelData: () => new Float32Array(len) })),
    createBufferSource: vi.fn(() => {
      const s = node({ buffer: null, start: vi.fn(), stop: vi.fn() })
      sources.push(s)
      return s
    }),
    createOscillator: vi.fn(() => {
      const s = node({ type: "", frequency: param(hz), start: vi.fn(), stop: vi.fn() })
      sources.push(s)
      return s
    }),
    createBiquadFilter: vi.fn(() => node({ type: "", frequency: param(), Q: param() })),
    createGain: vi.fn(() => node({ gain: param() })),
  }
  return { c: c as unknown as AudioContext, hz, sources }
}

describe("synthesised cues", () => {
  it.each(CUES)("%s makes sound from code alone, and every voice stops itself (nothing loops)", (cue) => {
    const { c, sources } = recorder()
    play(c, cue, 0.25)
    expect(sources.length).toBeGreaterThan(0)
    for (const s of sources) {
      expect(s.loop).not.toBe(true)
      expect(s.start).toHaveBeenCalled()
      expect(s.stop).toHaveBeenCalled()
      const [at] = s.stop.mock.calls[0] as [number]
      expect(at).toBeGreaterThan(2)
      expect(at).toBeLessThanOrEqual(2 + 1.7) // the longest cue is the hum swell
    }
  })
  it.each(CUES)("%s never sounds below %s Hz (phone speakers cannot play it)", (cue) => {
    const { c, hz } = recorder()
    play(c, cue, 0.25)
    for (const f of hz) expect(f).toBeGreaterThanOrEqual(FLOOR_HZ)
  })
  it("the hum is the 120 Hz floodlight hum", () => {
    const { c, hz } = recorder()
    play(c, "hum", 0.25)
    expect(hz).toContain(120)
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
