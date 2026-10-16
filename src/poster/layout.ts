import { POSTER } from "@/world/layers"

/**
 * The saved poster's layout maths, in poster px (1080 x 1920). Pure: no canvas, so every box is tested. Sizes and
 * colours are the scene type in tokens.md; the compositor only draws what these functions place.
 */

/** Tokens: `text`, `moonlight`, `panel`, `poster-red`. */
export const INK = { text: "#FFFFFF", moonlight: "#B7D3FA", panel: "#18131F", posterRed: "#F81E24" } as const

/**
 * The event date, short form: the stamp, the fixture line and the OG image take it from here. Stamp.tsx keeps its
 * own copy ("21 Dec 2026", upper-cased by CSS) so the first-paint stamp never imports poster code.
 */
export const EVENT_DATE = "21 DEC 2026"
/** Brand: "MON 21 DEC 2026 · VENUE TBA" on the poster (decision 8). One line to change when the venue is set. */
export const FIXTURE_LINE = `MON ${EVENT_DATE} · VENUE TBA`
/** Owner, 2026-10-15: on the saved poster only, never in the page and never on the OG image. */
export const AI_CREDIT = "POSTER ART MADE WITH AI"

/** The scene's tracked caps, in em: the stamp (Stamp.tsx `tracking-[0.06em]`), the fixture and AI lines, the OG date. */
export const SCENE_TRACKING = 0.06

export type LineStyle = { size: number; tracking: number; color: string }
/** Barlow Condensed 700 caps. Tracking is in em. */
export const TYPE = {
  fixture: { size: 44, tracking: SCENE_TRACKING, color: INK.text },
  credit: { size: 32, tracking: 0, color: INK.moonlight },
  ai: { size: 24, tracking: SCENE_TRACKING, color: INK.moonlight },
} as const satisfies Record<string, LineStyle>

/** The panel scrim behind the foot block: full width, at least 85 percent (7.66:1 worst case, tokens.md). */
export const SCRIM = { alpha: 0.88, padY: 24, gap: 16 } as const

export type Line = LineStyle & { text: string; /** Centre of the line box. */ y: number }
export type FootBlock = { top: number; height: number; lines: Line[] }

/**
 * The foot of the poster, top to bottom: the fixture line, the "+ name" credit (plus-one only), then the AI
 * credit, each centred, 16 px apart, 24 px of scrim above and below. It sits flush with the poster's foot.
 */
export function footBlock(plusOne: string | null): FootBlock {
  const rows: [string, LineStyle][] = [[FIXTURE_LINE, TYPE.fixture]]
  if (plusOne) rows.push([plusOne, TYPE.credit])
  rows.push([AI_CREDIT, TYPE.ai])
  const height = 2 * SCRIM.padY + rows.reduce((h, [, s]) => h + s.size, 0) + SCRIM.gap * (rows.length - 1)
  const top = POSTER.h - height
  let y = top + SCRIM.padY
  const lines = rows.map(([text, s]) => {
    const line = { text, ...s, y: y + s.size / 2 }
    y += s.size + SCRIM.gap
    return line
  })
  return { top, height, lines }
}

/** Width of a tracked line: glyph advances plus `tracking` em after every glyph but the last. */
export function trackedWidth(measure: (glyph: string) => number, text: string, size: number, tracking: number): number {
  const glyphs = Array.from(text)
  return glyphs.reduce((w, g) => w + measure(g), 0) + tracking * size * Math.max(0, glyphs.length - 1)
}

/**
 * The stamp as the live one is built (Stamp.tsx, CSS px at 24 px type), scaled so its type is `STAMP.size`:
 * 2 px border, 4 px padding, 1 px inner rule, 12 x 4 px inner padding, a 28 px line, 8 px between the parts.
 */
export const STAMP = { size: 40, base: 24 } as const
const k = STAMP.size / STAMP.base
export const STAMP_PARTS = {
  border: 2 * k,
  pad: 4 * k,
  rule: 1 * k,
  padX: 12 * k,
  padY: 4 * k,
  line: 28 * k,
  gap: 8 * k,
  icon: 20 * k,
} as const
/** The pencil's stroke in its own 24-unit box, as Stamp.tsx draws it (`<Pencil strokeWidth={2} />`). */
export const STAMP_ICON_STROKE = 2
/** The stamp's words: Yes "SIGNED · 21 DEC 2026", Maybe "PENCILLED IN" (with the pencil). */
export const STAMP_WORDS = { yes: ["SIGNED", "·", EVENT_DATE], maybe: ["PENCILLED IN"] } as const

/**
 * The stamp, placed twice (CHOSEN.md): live by WorldStage (`STAMP_LIVE`, shots.ts), and here on the exported poster,
 * the lower right corner of the 9:16 frame: its rotated bounds `right` from the right edge and `aboveCredits` above
 * the foot block's scrim. Kept here, not in shots.ts, so the lazy poster chunk never imports the camera code.
 */
export const STAMP_POSTER = { right: 64, aboveCredits: 24, rotateDeg: -4 } as const

export type StampBox = { cx: number; cy: number; w: number; h: number; angle: number }

/**
 * The stamp's box for content `contentW` wide: its rotated bounds `STAMP_POSTER.right` in from the right edge and
 * `STAMP_POSTER.aboveCredits` above the foot block (the lower right corner of the 9:16 frame, CHOSEN.md).
 */
export function stampBox(contentW: number, footTop: number): StampBox {
  const p = STAMP_PARTS
  const w = contentW + 2 * (p.border + p.pad + p.rule + p.padX)
  const h = p.line + 2 * (p.border + p.pad + p.rule + p.padY)
  const angle = (STAMP_POSTER.rotateDeg * Math.PI) / 180
  const { W, H } = rotatedBounds(w, h, angle)
  return { cx: POSTER.w - STAMP_POSTER.right - W / 2, cy: footTop - STAMP_POSTER.aboveCredits - H / 2, w, h, angle }
}

/** The axis-aligned size of a w x h box turned by `angle`. */
export function rotatedBounds(w: number, h: number, angle: number): { W: number; H: number } {
  const c = Math.abs(Math.cos(angle))
  const s = Math.abs(Math.sin(angle))
  return { W: w * c + h * s, H: w * s + h * c }
}
