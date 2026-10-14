import { prefersReducedMotion } from "@/lib/motionPrefs"

export type HapticPattern = number | number[]

/** Tear: a tick every TEAR_TICK_PX of tip travel, then the separation, then the stamp. */
export const HAPTICS = {
  tick: 4,
  separate: [10, 30, 18],
  stamp: 22,
  stampSoft: 12,
} as const satisfies Record<string, HapticPattern>

export const TEAR_TICK_PX = 40

/** Vibrate where the browser can (Android Chrome and most webviews). Silent no-op elsewhere and under reduced motion. */
export function haptic(pattern: HapticPattern): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false
  if (prefersReducedMotion()) return false
  // Chrome refuses (and logs an error) before the guest has ever tapped the page.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return false
  try {
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

/** How many ticks fire when the tip moves from `from` to `to` px (monotonic; returns the new baseline too). */
export function ticksBetween(from: number, to: number, step = TEAR_TICK_PX): { count: number; next: number } {
  if (to <= from) return { count: 0, next: from }
  const count = Math.floor((to - from) / step)
  return { count, next: from + count * step }
}
