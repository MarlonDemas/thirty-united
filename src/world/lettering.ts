import type { Point, Quad } from "@/world/layers"

/** The shirt's face: Barlow Condensed 700 (self-hosted), with a narrow system fallback while it loads. */
export const LETTERING_FONT = "'Barlow Condensed', 'Arial Narrow', sans-serif"
export const LETTERING_COLOR = "#FFFFFF"
/** Canvas pixels per box pixel for the lettering, before it is warped onto the quad (live shirt and saved poster). */
export const LETTERING_RES = 2

/** Where the name and number sit on the shirt box, as fractions of its height (tokens.md, scene type). */
export const NAME_Y = 0.2
export const NUMBER_Y = 0.6
export const NUMBER_SIZE = 0.4

const dist = (p: Point, q: Point) => Math.hypot(p[0] - q[0], p[1] - q[1])

/** The flat box a shirt quad's lettering is drawn in before it is warped onto the quad: its longest edges. */
export function quadBox(q: Quad): { w: number; h: number } {
  return {
    w: Math.round(Math.max(dist(q[0], q[1]), dist(q[3], q[2]))),
    h: Math.round(Math.max(dist(q[0], q[3]), dist(q[1], q[2]))),
  }
}

/** Name fits 80 percent of the quad width and never above 22 percent of its height (tokens.md, scene type). */
export function nameFont(ctx: CanvasRenderingContext2D, name: string, w: number, h: number) {
  let size = h * 0.22
  ctx.font = `700 ${size}px ${LETTERING_FONT}`
  const width = ctx.measureText(name).width
  if (width > w * 0.8) size *= (w * 0.8) / width
  ctx.font = `700 ${size}px ${LETTERING_FONT}`
}
