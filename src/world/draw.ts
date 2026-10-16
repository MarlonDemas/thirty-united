import type { Point, Quad } from "@/world/layers"

/**
 * The moon is drawn in code (disc and halo), in the clear patch of sky. Its phase is the night of 21 December 2026:
 * about 93 percent lit, waxing gibbous (tokens.md, still an estimate). Seen from South Africa a waxing moon is lit
 * on its left side.
 */
export const MOON = { illuminated: 0.93, litSide: "left" as "left" | "right", haloScale: 3.2 } as const

/** The lit part as a path centred on 0,0: a half disc on the lit side plus a half ellipse past the middle. */
export function moonPath(r: number, illuminated: number, litSide: "left" | "right"): string {
  const k = Math.abs(2 * illuminated - 1) * r // the terminator's half-width
  const sweep = litSide === "left" ? 0 : 1
  const bulge = illuminated >= 0.5 ? sweep : 1 - sweep // gibbous bulges into the dark side, crescent away from it
  return `M0 ${-r}A${r} ${r} 0 0 ${sweep} 0 ${r}A${k} ${r} 0 0 ${bulge} 0 ${-r}Z`
}

/**
 * CSS `matrix3d` that maps a w x h box (origin top left) onto a four-corner quad (TL, TR, BR, BL), so the lettering
 * sits on the shirt's painted back in perspective. Pure: tested by mapping the corners.
 */
export function quadMatrix(w: number, h: number, q: Quad): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const dy3 = y0 - y1 + y2 - y3
  let g = 0
  let hh = 0
  if (dx3 !== 0 || dy3 !== 0) {
    const den = dx1 * dy2 - dx2 * dy1
    g = (dx3 * dy2 - dx2 * dy3) / den
    hh = (dx1 * dy3 - dx3 * dy1) / den
  }
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + hh * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + hh * y3
  // Unit square to quad, after scaling the box to the unit square. Column-major 4x4.
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1]
}

/** Where the matrix sends a box point (for tests). */
export function applyMatrix(m: number[], p: Point): Point {
  const [x, y] = p
  const X = m[0] * x + m[4] * y + m[12]
  const Y = m[1] * x + m[5] * y + m[13]
  const W = m[3] * x + m[7] * y + m[15]
  return [X / W, Y / W]
}
