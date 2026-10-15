import type { Tier } from "@/world/tier"

/**
 * Touch parallax on the WebGL tiers (cinematic recommendation, risk table: "parallax only on touch ... a few pixels
 * of depth offset (T3)"; no gyro, no idle drift). A drag that starts on the poster (no hover) moves each layer by its
 * depth times this many poster px. The DOM overlays that sit on a plate (the lettering, the lamps, the title, the
 * moon disc) follow with the same depth so they never slide off it.
 */
export const PARALLAX = { maxPx: 10 } as const

/** Makes's plates: the hero, the only layers that move on T2. */
export const isHero = (name: string) => name === "l5-makes" || name === "l6-makes-wave" || name === "l7-makes-signing"

/**
 * How far a layer travels under parallax, 0 to 1 (its manifest depth, or 0 if it stays put on this tier).
 * T3: every layer. T2: the hero only. T1, T0 and forced colours: nothing (no WebGL world).
 */
export function parallaxDepth(name: string, depth: number, tier: Tier): number {
  if (tier === "T3") return depth
  if (tier === "T2") return isHero(name) ? depth : 0
  return 0
}
