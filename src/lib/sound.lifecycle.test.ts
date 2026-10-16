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
    suspend = vi.fn()
    createBuffer = vi.fn(() => ({ sampleRate: 44100, getChannelData: () => new Float32Array(10) }))
    createBufferSource = vi.fn(() => ({ connect: (n: unknown) => n, start: vi.fn(), stop: vi.fn() }))
    createBiquadFilter = vi.fn(() => ({ frequency: { setValueAtTime: vi.fn() }, Q: { setValueAtTime: vi.fn() }, connect: (n: unknown) => n }))
    createOscillator = vi.fn(() => ({
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (n: unknown) => n,
      start: vi.fn(),
      stop: vi.fn(),
    }))
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
    await s.loadCues()
    s.playStamp()
    expect(ctx.createBufferSource).not.toHaveBeenCalled() // sound still off
    s.setSoundOn(true)
    s.playStamp()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(created).toHaveLength(1)
  })
  it("is not muted by reduced motion: it follows only its own opt-in", async () => {
    const created = fakeCtx()
    stubMedia({ reduced: true })
    const s = await import("@/lib/sound")
    const ctx = s.unlockAudio() as unknown as { createBufferSource: ReturnType<typeof vi.fn> }
    expect(ctx).not.toBeNull()
    expect(created).toHaveLength(1)
    await s.loadCues()
    s.playTearSeparate()
    expect(ctx.createBufferSource).not.toHaveBeenCalled() // opt-in still off
    s.setSoundOn(true)
    s.playTearSeparate()
    s.playStamp()
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(2)
  })
  it("plays the beat cues under reduced motion once opted in and the cue chunk is in", async () => {
    fakeCtx()
    stubMedia({ reduced: true })
    const s = await import("@/lib/sound")
    s.setSoundOn(true)
    const ctx = s.unlockAudio() as unknown as { createOscillator: ReturnType<typeof vi.fn> }
    await s.loadCues()
    s.playCue("drum")
    expect(ctx.createOscillator).toHaveBeenCalled()
  })
  it("a cue is dropped while the cue chunk is still loading", async () => {
    fakeCtx()
    const s = await import("@/lib/sound")
    s.setSoundOn(true)
    const ctx = s.unlockAudio() as unknown as { createOscillator: ReturnType<typeof vi.fn> }
    s.playCue("tick") // the import unlockAudio started has not resolved yet
    expect(ctx.createOscillator).not.toHaveBeenCalled()
    await s.loadCues()
    s.playCue("tick")
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1)
  })
  it("a cue is silent when sound is off, chunk loaded or not", async () => {
    fakeCtx()
    const s = await import("@/lib/sound")
    const ctx = s.unlockAudio() as unknown as { createOscillator: ReturnType<typeof vi.fn> }
    await s.loadCues()
    s.playCue("tick")
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })
  it("suspends on a hidden tab and stays silent there; a tap resumes it", async () => {
    fakeCtx()
    const s = await import("@/lib/sound")
    s.setSoundOn(true)
    const ctx = s.unlockAudio() as unknown as { suspend: ReturnType<typeof vi.fn>; resume: ReturnType<typeof vi.fn>; state: string; createOscillator: ReturnType<typeof vi.fn> }
    await s.loadCues()
    const vis = vi.spyOn(document, "hidden", "get").mockReturnValue(true)
    document.dispatchEvent(new Event("visibilitychange"))
    expect(ctx.suspend).toHaveBeenCalledTimes(1)
    ctx.state = "suspended"
    s.playCue("tick")
    expect(ctx.createOscillator).not.toHaveBeenCalled()
    vis.mockReturnValue(false)
    const off = s.armAudio()
    document.dispatchEvent(new Event("pointerdown"))
    expect(ctx.resume).toHaveBeenCalled()
    off()
    vis.mockRestore()
  })
  it("resumes when the tab is visible again (sound on only), including iOS's \"interrupted\"", async () => {
    fakeCtx()
    const s = await import("@/lib/sound")
    const ctx = s.unlockAudio() as unknown as { resume: ReturnType<typeof vi.fn>; state: string }
    ctx.state = "interrupted"
    document.dispatchEvent(new Event("visibilitychange"))
    expect(ctx.resume).not.toHaveBeenCalled() // sound off
    s.setSoundOn(true)
    document.dispatchEvent(new Event("visibilitychange"))
    expect(ctx.resume).toHaveBeenCalledTimes(1)
  })
  it("a remembered opt-in unlocks on the next tap once armed, not before", async () => {
    const created = fakeCtx()
    const s = await import("@/lib/sound")
    s.setSoundOn(true) // as after a reload: on in sessionStorage, no context yet
    const off = s.armAudio()
    expect(created).toHaveLength(0)
    document.dispatchEvent(new Event("keydown"))
    expect(created).toHaveLength(1)
    off()
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
    await s.loadCues()
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
