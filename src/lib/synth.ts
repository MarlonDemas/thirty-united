import type { Cue } from "@/lib/sound"

/**
 * The beat cues, the tear and the stamp, synthesised with Web Audio: no files, no network. Its own chunk, loaded only
 * once the guest opts in to sound (sound.ts `loadCues`), so none of it is in the first paint. Every cue is a one-shot that stops itself;
 * nothing loops. Nothing sounds below FLOOR_HZ, which phone speakers cannot play (recommendation, bank one).
 */
export const FLOOR_HZ = 100

/** Seconds from the cue's start to each gain target (exponential ramps from near silence). */
type Env = readonly (readonly [at: number, gain: number])[]

let noise: AudioBuffer | null = null

/** 1.5 s of white noise, long enough for the crowd swell without looping. The one noise buffer: every voice shares it. */
function noiseOf(c: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === c.sampleRate) return noise
  const len = Math.floor(c.sampleRate * 1.5)
  noise = c.createBuffer(1, len, c.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return noise
}

/** A level in dB to a linear gain. */
export const dbToGain = (db: number) => 10 ** (db / 20)

const STAMP_DB = -18

/** Drag speed (px per ms) to a tear-noise gain, 0.15..1 of the master level. */
export function tearGain(speed: number): number {
  return 0.15 + 0.85 * Math.min(1, Math.max(0, speed) / 2)
}

/** Drag speed to the band-pass centre, 1.2 to 4 kHz. */
export function tearFreq(speed: number): number {
  return 1200 + 2800 * Math.min(1, Math.max(0, speed) / 2)
}

function burst(c: AudioContext, master: number, opts: { freq: number; q: number; gain: number; ms: number }) {
  const src = c.createBufferSource()
  src.buffer = noiseOf(c)
  const band = c.createBiquadFilter()
  band.type = "bandpass"
  band.frequency.value = opts.freq
  band.Q.value = opts.q
  const g = c.createGain()
  const t = c.currentTime
  const end = t + opts.ms / 1000
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(opts.gain * master, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, end)
  src.connect(band).connect(g).connect(c.destination)
  src.start(t)
  src.stop(end + 0.02)
}

/** One tick of paper tearing; louder and brighter the faster the hand moves (60 ms). */
export function playTearTick(c: AudioContext, speed: number, master: number): void {
  burst(c, master, { freq: tearFreq(speed), q: 1.2, gain: tearGain(speed), ms: 60 })
}

/** The separation: a longer rip (140 ms). */
export function playTearSeparate(c: AudioContext, master: number): void {
  burst(c, master, { freq: 2400, q: 0.9, gain: 1, ms: 140 })
}

/** The stamp: 140 Hz sine decaying over 90 ms plus a 6 ms noise click, at -18 dB (absolute, not scaled by master). */
export function playStamp(c: AudioContext): void {
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
  click.buffer = noiseOf(c)
  const cg = c.createGain()
  cg.gain.setValueAtTime(level, t)
  cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.006)
  click.connect(cg).connect(c.destination)
  click.start(t)
  click.stop(t + 0.01)
}

function envelope(c: AudioContext, t: number, env: Env, level: number): GainNode {
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  for (const [at, v] of env) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, v * level), t + at)
  g.connect(c.destination)
  return g
}

const end = (env: Env) => env[env.length - 1][0] + 0.02

/** Filtered noise: crowd, hush, the clunk's contact and the clicks. */
function hiss(c: AudioContext, t: number, level: number, o: { type: BiquadFilterType; hz: number; q: number; env: Env }) {
  const src = c.createBufferSource()
  src.buffer = noiseOf(c)
  const f = c.createBiquadFilter()
  f.type = o.type
  f.frequency.setValueAtTime(o.hz, t)
  f.Q.setValueAtTime(o.q, t)
  src.connect(f).connect(envelope(c, t, o.env, level))
  src.start(t)
  src.stop(t + end(o.env))
}

/** A sine, optionally gliding from `hz` to `to`; both kept at or above FLOOR_HZ. */
function tone(c: AudioContext, t: number, level: number, o: { hz: number; to?: number; env: Env }) {
  const osc = c.createOscillator()
  osc.type = "sine"
  osc.frequency.setValueAtTime(Math.max(FLOOR_HZ, o.hz), t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(FLOOR_HZ, o.to), t + end(o.env) * 0.6)
  osc.connect(envelope(c, t, o.env, level))
  osc.start(t)
  osc.stop(t + end(o.env))
}

const SWELL: Env = [
  [0.5, 0.7],
  [1.2, 0.0001],
]

/** Play one cue now. `master` is sound.ts's overall level. */
export function play(c: AudioContext, cue: Cue, master: number): void {
  const t = c.currentTime
  switch (cue) {
    case "clunk": // a floodlight contactor closing: a dull knock and a short metallic contact
      tone(c, t, master, { hz: 180, to: 120, env: [[0.005, 0.6], [0.12, 0.0001]] })
      hiss(c, t, master, { type: "bandpass", hz: 900, q: 3, env: [[0.004, 0.9], [0.06, 0.0001]] })
      return
    case "hum": // the 120 Hz mains hum of the lamps warming, swelling then settling away
      tone(c, t, master, { hz: 120, env: [[0.35, 0.25], [0.9, 0.18], [1.6, 0.0001]] })
      tone(c, t, master, { hz: 240, env: [[0.35, 0.1], [0.9, 0.07], [1.6, 0.0001]] })
      return
    case "swell": // the crowd: shaped noise over 1.2 s
      hiss(c, t, master, { type: "bandpass", hz: 800, q: 0.5, env: SWELL })
      return
    case "swellSoft": // Maybe: the same crowd, darker and quieter
      hiss(c, t, master * 0.45, { type: "bandpass", hz: 600, q: 0.5, env: SWELL })
      return
    case "hush": // the held breath before the number
      hiss(c, t, master, { type: "highpass", hz: 2500, q: 0.7, env: [[0.12, 0.3], [0.6, 0.0001]] })
      return
    case "drum": // a low hit, pitched down to the floor and no lower
      tone(c, t, master, { hz: 150, to: FLOOR_HZ, env: [[0.003, 1], [0.35, 0.0001]] })
      hiss(c, t, master, { type: "bandpass", hz: 2000, q: 1, env: [[0.002, 0.4], [0.03, 0.0001]] })
      return
    case "crackle": // No: one quiet ember, a few tiny clicks
      for (let i = 0; i < 7; i++)
        hiss(c, t + Math.random() * 0.45, master, { type: "bandpass", hz: 3000, q: 1, env: [[0.002, 0.25], [0.02, 0.0001]] })
      return
    case "tick": // one code lamp
      tone(c, t, master, { hz: 1800, env: [[0.003, 0.25], [0.03, 0.0001]] })
      return
  }
}
