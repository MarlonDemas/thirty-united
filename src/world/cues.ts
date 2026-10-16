import { useEffect, useRef } from "react"
import { haptic, HAPTICS, type HapticPattern } from "@/lib/haptics"
import type { Attending } from "@/lib/schemas/rsvp"
import { playCue, type Cue } from "@/lib/sound"
import type { Beat } from "@/world/beats"

/** One moment of a beat change, `at` ms after it: sound cues (opt-in) and a haptic (Android, after the first tap). */
export type Hit = { at: number; sound?: readonly Cue[]; buzz?: HapticPattern }

const STRIKE: readonly Cue[] = ["clunk", "hum"]

/**
 * What the world sounds and feels like when it moves from one beat to the next (recommendation beat tables;
 * tokens.md Haptics and Sound). Only forward moves strike; going back, a restore or a No's code beat is silent.
 * The stamp (1800 ms into the finale) keeps its own sound and haptic in Stamp.tsx.
 */
export function hitsFor(from: Beat, to: Beat, attending?: Attending): Hit[] {
  const lit = attending === "yes" || attending === "maybe"
  if (from === "cover" && to === "chapter1")
    return [
      { at: 0, sound: STRIKE, buzz: HAPTICS.strike }, // bank one strikes on the tear
      { at: 400, sound: ["drum"] }, // the push-in begins
    ]
  if (from === "chapter1" && to === "chapter2") {
    if (attending === "yes") return [{ at: 0, sound: ["swell"], buzz: HAPTICS.strike }]
    if (attending === "maybe") return [{ at: 0, sound: ["swellSoft"], buzz: HAPTICS.strikeSoft }]
    if (attending === "no") return [{ at: 0, sound: ["crackle"], buzz: HAPTICS.strikeSoft }]
  }
  if (from === "chapter2" && to === "code" && lit) return [{ at: 0, sound: STRIKE, buzz: HAPTICS.strike }] // bank three
  if (from === "code" && to === "signed")
    return [
      { at: 0, buzz: HAPTICS.strike }, // bank four
      { at: 250, sound: ["hush"] },
      { at: 900, sound: ["drum"], buzz: HAPTICS.number },
      { at: 1400, sound: ["swell"] }, // full ignition
    ]
  return []
}

/** A code digit typed (the count went up; a paste of six is one tick): one lamp, a soft tick and 4 ms. */
export const digitHit = (from: number, to: number): Hit | null => (to > from ? { at: 0, sound: ["tick"], buzz: HAPTICS.digit } : null)

function fire(h: Hit) {
  h.sound?.forEach(playCue)
  if (h.buzz !== undefined) haptic(h.buzz)
}

/** Plays the hits as the page moves between beats and as code digits are typed. Nothing on mount (a restore). */
export function useWorldHits(beat: Beat, attending: Attending | undefined, digits: number) {
  const last = useRef({ beat, digits })
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    const from = last.current.beat
    last.current.beat = beat
    if (from === beat) return
    // A new beat deliberately cancels the previous beat's pending hits: the world has moved on.
    timers.current.forEach(clearTimeout)
    timers.current = []
    for (const h of hitsFor(from, beat, attending)) {
      if (h.at === 0) fire(h) // in step with the beat change, not a timer tick later
      else timers.current.push(window.setTimeout(fire, h.at, h))
    }
  }, [beat, attending])
  useEffect(() => {
    const h = digitHit(last.current.digits, digits)
    last.current.digits = digits
    if (h) fire(h)
  }, [digits])
}
