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

/** One line: up to 22 percent of the box height, at most 80 percent of its width (tokens.md, scene type). */
const NAME_SIZE = 0.22
const NAME_MAX_W = 0.8
/** Two lines (a name too wide for one, with a space to break at): up to 17 percent each, one line height apart. */
const NAME_SIZE_TWO = 0.17

/** A line of the name: its text, where it starts in the name (for the letter-paint), and its centre y in box px. */
export type NameLine = { text: string; start: number; y: number }

const nameFontAt = (ctx: CanvasRenderingContext2D, size: number) => (ctx.font = `700 ${size}px ${LETTERING_FONT}`)

/**
 * Where the name sits on the shirt box, shared by the live shirt and the saved poster. It fits 80 percent of the box
 * width on one line at up to 22 percent of its height. A longer name with a space breaks there onto two lines
 * (at the space that balances them best) at up to 17 percent, and only shrinks if a line is still too wide. A
 * name with no space shrinks to fit, as before. Leaves `ctx.font` set to the size it returns.
 */
export function nameLayout(ctx: CanvasRenderingContext2D, name: string, w: number, h: number): { size: number; lines: NameLine[] } {
  const max = w * NAME_MAX_W
  let size = h * NAME_SIZE
  nameFontAt(ctx, size)
  const width = ctx.measureText(name).width
  let best: { at: number; widest: number } | null = null
  if (width > max)
    for (let at = name.indexOf(" "); at !== -1; at = name.indexOf(" ", at + 1)) {
      if (at === 0 || at === name.length - 1) continue // a space at either end is no break
      const widest = Math.max(ctx.measureText(name.slice(0, at)).width, ctx.measureText(name.slice(at + 1)).width)
      if (!best || widest < best.widest) best = { at, widest }
    }
  if (!best) {
    if (width > max) size *= max / width
    nameFontAt(ctx, size)
    return { size, lines: [{ text: name, start: 0, y: h * NAME_Y }] }
  }
  // Widths measured at the one-line size scale with the size.
  size = Math.min(h * NAME_SIZE_TWO, size * (max / best.widest))
  nameFontAt(ctx, size)
  return {
    size,
    lines: [
      { text: name.slice(0, best.at), start: 0, y: h * NAME_Y - size / 2 },
      { text: name.slice(best.at + 1), start: best.at + 1, y: h * NAME_Y + size / 2 },
    ],
  }
}
