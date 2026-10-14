import { beforeEach, describe, expect, it, vi } from "vitest"
import { stubMedia } from "@/test-media"

// sound.ts keeps its AudioContext at module level, so each test loads a fresh copy.
function fakeCtx() {
  const created: unknown[] = []
  class FakeAudioContext {
    state = "running"
    sampleRate = 44100
    currentTime = 0
    destination = {}
    constructor() {
      created.push(this)
    }
    resume = vi.fn()
    createBuffer = vi.fn(() => ({ sampleRate: 44100, getChannelData: () => new Float32Array(10) }))
    createBufferSource = vi.fn(() => ({ connect: (n: unknown) => n, start: vi.fn(), stop: vi.fn() }))
    createBiquadFilter = vi.fn(() => ({ frequency: {}, Q: {}, connect: (n: unknown) => n }))
    createOscillator = vi.fn(() => ({ frequency: {}, connect: (n: unknown) => n, start: vi.fn(), stop: vi.fn() }))
    createGain = vi.fn(() => ({
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (n: unknown) => n,
    }))
  }
  ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext
  return created
}

beforeEach(() => {
  vi.resetModules()
  stubMedia()
  delete (window as unknown as { AudioContext?: unknown }).AudioContext
})

describe("audio lifecycle", () => {
  it("is off by default", async () => {
    const { getSoundOn } = await import("@/lib/sound")
    expect(getSoundOn()).toBe(false)
  })
  it("creates an AudioContext only through unlockAudio, never from setSoundOn or play*", async () => {
    const created = fakeCtx()
    const s = await import("@/lib/sound")
    s.setSoundOn(true)
    s.playStamp()
    s.playTearTick(1)
    s.playTearSeparate()
    expect(created).toHaveLength(0)
    expect(s.unlockAudio()).not.toBeNull()
    expect(created).toHaveLength(1)
    s.unlockAudio()
    expect(created).toHaveLength(1) // reused
  })
  it("plays once unlocked and sound is on, and stays silent when sound is off", async () => {
    const created = fakeCtx()
    const s = await import("@/lib/sound")
    const ctx = s.unlockAudio() as unknown as { createBufferSource: ReturnType<typeof vi.fn> }
    s.playStamp()
    expect(ctx.createBufferSource).not.toHaveBeenCalled() // sound still off
    s.setSoundOn(true)
    s.playStamp()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(created).toHaveLength(1)
  })
  it("does nothing under reduced motion: no context, no playback", async () => {
    const created = fakeCtx()
    const s = await import("@/lib/sound")
    const ctx = s.unlockAudio() as unknown as { createBufferSource: ReturnType<typeof vi.fn> }
    s.setSoundOn(true)
    stubMedia({ reduced: true })
    s.playTearSeparate()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
    vi.resetModules()
    const fresh = await import("@/lib/sound")
    expect(fresh.unlockAudio()).toBeNull()
    expect(created).toHaveLength(1)
  })
  it("stays silent under forced colors, even when sessionStorage says on", async () => {
    const created = fakeCtx()
    stubMedia({ forced: true })
    const s = await import("@/lib/sound")
    s.setSoundOn(true)
    expect(s.unlockAudio()).toBeNull()
    expect(created).toHaveLength(0)
    stubMedia()
    const ctx = s.unlockAudio() as unknown as { createBufferSource: ReturnType<typeof vi.fn> }
    stubMedia({ forced: true })
    s.playStamp()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
  })
  it("falls back to webkitAudioContext", async () => {
    const created = fakeCtx()
    const w = window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown }
    w.webkitAudioContext = w.AudioContext
    delete w.AudioContext
    const s = await import("@/lib/sound")
    expect(s.unlockAudio()).not.toBeNull()
    expect(created).toHaveLength(1)
    delete w.webkitAudioContext
  })
})
