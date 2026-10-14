import { forcedColors, prefersReducedMotion } from "@/lib/motionPrefs"

// Opt-in, synthesized only (no media files). Off by default; the choice lives in sessionStorage.
const KEY = "thirty-united:sound"
const MASTER = 0.25
const STAMP_DB = -18

export function getSoundOn(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === "on"
  } catch {
    return false
  }
}

export function setSoundOn(on: boolean): void {
  try {
    window.sessionStorage.setItem(KEY, on ? "on" : "off")
  } catch {
    // storage blocked: the choice just doesn't persist
  }
}

export const dbToGain = (db: number) => 10 ** (db / 20)

/** Drag speed (px per ms) to a tear-noise gain, 0.15..1 of the master level. */
export function tearGain(speed: number): number {
  return 0.15 + 0.85 * Math.min(1, Math.max(0, speed) / 2)
}

/** Drag speed to the band-pass centre, 1.2 to 4 kHz. */
export function tearFreq(speed: number): number {
  return 1200 + 2800 * Math.min(1, Math.max(0, speed) / 2)
}

type Ctor = typeof AudioContext
let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null

function ctor(): Ctor | undefined {
  if (typeof window === "undefined") return undefined
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext
}

/** Create or resume the AudioContext. Call only inside a user gesture. Returns null when unsupported. */
export function unlockAudio(): AudioContext | null {
  if (prefersReducedMotion() || forcedColors()) return null // forced colors hides the Sound tab; it stays silent too
  const C = ctor()
  if (!C) return null
  try {
    ctx ??= new C()
    if (ctx.state === "suspended") void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === c.sampleRate) return noise
  const len = Math.floor(c.sampleRate * 0.3)
  noise = c.createBuffer(1, len, c.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return noise
}

function ready(): AudioContext | null {
  if (!ctx || !getSoundOn() || prefersReducedMotion() || forcedColors()) return null
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

function burst(c: AudioContext, opts: { freq: number; q: number; gain: number; ms: number }) {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  const band = c.createBiquadFilter()
  band.type = "bandpass"
  band.frequency.value = opts.freq
  band.Q.value = opts.q
  const g = c.createGain()
  const t = c.currentTime
  const end = t + opts.ms / 1000
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(opts.gain * MASTER, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, end)
  src.connect(band).connect(g).connect(c.destination)
  src.start(t)
  src.stop(end + 0.02)
}

/** One tick of paper tearing; louder and brighter the faster the hand moves (60 ms). */
export function playTearTick(speed: number): void {
  const c = ready()
  if (c) burst(c, { freq: tearFreq(speed), q: 1.2, gain: tearGain(speed), ms: 60 })
}

/** The separation: a longer rip (140 ms). */
export function playTearSeparate(): void {
  const c = ready()
  if (c) burst(c, { freq: 2400, q: 0.9, gain: 1, ms: 140 })
}

/** The stamp: 140 Hz sine decaying over 90 ms plus a 6 ms noise click, at -18 dB. */
export function playStamp(): void {
  const c = ready()
  if (!c) return
  const t = c.currentTime
  const level = dbToGain(STAMP_DB)
  const osc = c.createOscillator()
  osc.frequency.value = 140
  const g = c.createGain()
  g.gain.setValueAtTime(level, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  osc.connect(g).connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.1)
  const click = c.createBufferSource()
  click.buffer = noiseBuffer(c)
  const cg = c.createGain()
  cg.gain.setValueAtTime(level, t)
  cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.006)
  click.connect(cg).connect(c.destination)
  click.start(t)
  click.stop(t + 0.01)
}
