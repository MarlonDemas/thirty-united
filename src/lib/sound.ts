import { forcedColors } from "@/lib/motionPrefs"

// Opt-in, synthesized only (no media files). Off by default; the choice lives in sessionStorage. Sound follows only
// its own opt-in: reduced motion does not silence it (tokens.md, Sound). Forced colours hides the chip, so it stays silent.
const KEY = "thirty-united:sound"
const MASTER = 0.25

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

type Ctor = typeof AudioContext
let ctx: AudioContext | null = null

function ctor(): Ctor | undefined {
  if (typeof window === "undefined") return undefined
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext
}

/** The beat cues (phase 7), plus "on", the opt-in's confirmation. All one-shots: nothing loops, so the Still chip has no sound to stop. */
export type Cue = "clunk" | "hum" | "swell" | "swellSoft" | "hush" | "drum" | "crackle" | "tick" | "on"
type Synth = typeof import("@/lib/synth")
let synth: Synth | null = null
let loading: Promise<Synth | null> | null = null

/** The synthesiser (cues, tear, stamp) is its own chunk, fetched on the opt-in tap (or once a remembered opt-in is armed). */
export function loadCues(): Promise<Synth | null> {
  return (loading ??= import("@/lib/synth").then(
    (m) => {
      synth = m
      return m
    },
    () => (loading = null), // deliberate: offline resolves to null (no sound, no error); the next tap asks again
  ))
}

/** Create or resume the AudioContext. Call only inside a user gesture. Returns null when unsupported. */
export function unlockAudio(): AudioContext | null {
  if (forcedColors()) return null // forced colors hides the Sound tab; it stays silent too
  const C = ctor()
  if (!C) return null
  try {
    if (!ctx) {
      ctx = new C()
      // Hidden tab: let the audio device sleep. Visible again with sound on, it resumes (so do the next cue and tap).
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) void ctx?.suspend()
        else if (ctx && ctx.state !== "running" && getSoundOn()) void ctx.resume()
      })
    }
    if (ctx.state !== "running") void ctx.resume() // iOS can also report "interrupted"
    void loadCues()
    return ctx
  } catch {
    return null
  }
}

/** While the Sound chip is mounted: with the opt-in on (remembered across a reload too), any tap or key unlocks or resumes audio. */
export function armAudio(): () => void {
  const on = () => getSoundOn() && unlockAudio()
  if (getSoundOn()) void loadCues() // a remembered opt-in: have the cues in before the first beat's tap
  const types = ["pointerdown", "keydown"] as const
  types.forEach((t) => document.addEventListener(t, on, true))
  return () => types.forEach((t) => document.removeEventListener(t, on, true))
}

function ready(): AudioContext | null {
  if (!ctx || !getSoundOn() || forcedColors() || document.hidden) return null
  if (ctx.state !== "running") void ctx.resume()
  return ctx
}

/** One tick of paper tearing (synth.ts). Like every sound here: silent until opt-in, unlock and the synth chunk. */
export function playTearTick(speed: number): void {
  const c = ready()
  if (c && synth) synth.playTearTick(c, speed, MASTER)
}

/** The separation: a longer rip. */
export function playTearSeparate(): void {
  const c = ready()
  if (c && synth) synth.playTearSeparate(c, MASTER)
}

/** The stamp, at -18 dB. */
export function playStamp(): void {
  const c = ready()
  if (c && synth) synth.playStamp(c)
}

/** One beat cue (synth.ts), once the opt-in is on, audio unlocked and the cue chunk in. Otherwise silent. */
export function playCue(cue: Cue): void {
  const c = ready()
  // Before the chunk is in, the cue is dropped, not queued. Deliberate: a late clunk is worse than none.
  if (c && synth) synth.play(c, cue, MASTER)
}

/**
 * The Sound chip's confirmation as sound turns on. The one cue that waits for the synth chunk (on this tap only): every
 * other cue is dropped until it is in. It still goes through ready(), so turning sound off before the chunk lands, or
 * a failed load, stays silent.
 */
export function confirmSoundOn(): void {
  void loadCues().then(() => playCue("on"))
}
