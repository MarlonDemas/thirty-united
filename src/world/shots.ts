import type { Attending } from "@/lib/schemas/rsvp"
import type { Beat } from "@/world/beats"
import { POSTER, type Point } from "@/world/layers"

/**
 * One camera shot per beat (CHOSEN.md): a scale and translate of the 1080 x 1920 poster, clipped to the phone.
 * `focus` is a poster point; `at` is where it lands, as fractions of the frame. The poster always covers the
 * frame (the translate is clamped), so a shot can only crop, never show an edge.
 */
export type Shot = { zoom: number; focus: Point; at: Point }

/** The step panel's share of the phone height. Its top edge never moves between beats (y 481 on an 844 phone). */
export const PANEL_FRACTION = 0.43

/** Keyboard (CHOSEN.md "Still open": guesses until the phase 0a phone test). */
export const KEYBOARD = {
  /** The layout height minus the visual height above this means the on-screen keyboard is open. */
  minPx: 150,
  /** The shirt strip above the panel while typing: at least this tall... */
  stripMinPx: 120,
  /** ...or this share of the visual viewport, whichever is bigger (about 150 px on an 844 phone). */
  stripFraction: 0.3,
} as const

/** Desktop (from 1024 px): the poster is a 9:16 frame at 100dvh minus 64 px, centre-left; the panel a 420 px column. */
export const DESKTOP = { minWidth: 1024, panelWidth: 420, gutter: 64 } as const

export const SHOTS: Record<Beat, Shot> = {
  // Full poster, height-fit, Makes's face 28 percent from the top.
  cover: { zoom: 1, focus: [540, 540], at: [0.5, 0.28] },
  // The 3 percent push-in after the tear.
  chapter1: { zoom: 1.03, focus: [540, 540], at: [0.5, 0.28] },
  // Two-shot: Makes and the hanging shirt to his right.
  chapter2: { zoom: 1.08, focus: [700, 700], at: [0.5, 0.33] },
  // Toward the right floodlight head and its six lamps; his face upper left.
  code: { zoom: 1.3, focus: [970, 725], at: [0.78, 0.36] },
  // The 4 percent push-in at the signing: the held shirt and the title clear the panel.
  signed: { zoom: 1.04, focus: [540, 620], at: [0.5, 0.33] },
  // Back to the cover framing; Makes waves.
  "no-end": { zoom: 1, focus: [540, 540], at: [0.5, 0.28] },
}

/** Keyboard open: the strip at the top of the visual viewport frames this poster box (centre, width). */
export type StripShot = { focus: Point; width: number }
export function stripShotFor(beat: Beat, attending?: Attending): StripShot {
  if (beat === "code") return { focus: [970, 725], width: 220 } // the lamps mirror the digits typed
  if (beat === "chapter2" && attending !== "no") return { focus: [860, 850], width: 240 } // the name band on the shirt
  return { focus: [540, 540], width: 420 } // no shirt (No path): his face
}

export type Frame = { w: number; h: number }
export type Placement = { s: number; tx: number; ty: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Scale so the poster covers the frame, then put `focus` at `at`, clamped so no edge shows. */
export function placeShot(shot: Shot, f: Frame): Placement {
  const s = Math.max(f.h / POSTER.h, f.w / POSTER.w) * shot.zoom
  return {
    s,
    tx: clamp(shot.at[0] * f.w - shot.focus[0] * s, f.w - POSTER.w * s, 0),
    ty: clamp(shot.at[1] * f.h - shot.focus[1] * s, f.h - POSTER.h * s, 0),
  }
}

/** The keyboard strip: `focus` centred in the strip at the top of the visual viewport. */
export function placeStrip(k: StripShot, f: Frame, stripTop: number, stripH: number): Placement {
  const s = Math.max(f.w / k.width, f.h / POSTER.h, f.w / POSTER.w)
  return {
    s,
    tx: clamp(f.w / 2 - k.focus[0] * s, f.w - POSTER.w * s, 0),
    ty: clamp(stripTop + stripH / 2 - k.focus[1] * s, f.h - POSTER.h * s, 0),
  }
}

export const toScreen = (p: Placement, pt: Point): Point => [p.tx + pt[0] * p.s, p.ty + pt[1] * p.s]

export type Viewport = { w: number; h: number; vvTop: number; vvH: number; keyboard: boolean }

/**
 * The on-screen keyboard is open when a text field has focus and the visible height has dropped by more than
 * `KEYBOARD.minPx` below the tallest layout height seen at this width. Covers both behaviours: iOS and Chrome
 * shrink only the visual viewport; some Android WebViews shrink the layout viewport too.
 */
export function keyboardOpen(tallest: number, vvH: number, editableFocused: boolean): boolean {
  return editableFocused && tallest - vvH > KEYBOARD.minPx
}

export type Layout =
  | {
      mode: "phone"
      frame: { x: 0; y: 0; w: number; h: number }
      panelTop: number
      panelH: number
      keyboard: boolean
      strip: number
    }
  | { mode: "desktop"; frame: { x: number; y: number; w: number; h: number }; panelTop: 0; panelH: number; keyboard: false; strip: 0 }

/** Where the poster frame and the panel sit for this viewport. */
export function layoutFor(v: Viewport): Layout {
  if (v.w >= DESKTOP.minWidth) {
    const h = Math.max(0, Math.min(v.h - DESKTOP.gutter, ((v.w - DESKTOP.panelWidth - DESKTOP.gutter) * 16) / 9))
    const w = (h * 9) / 16
    return {
      mode: "desktop",
      frame: { x: (v.w - DESKTOP.panelWidth - w) / 2, y: (v.h - h) / 2, w, h },
      panelTop: 0,
      panelH: v.h,
      keyboard: false,
      strip: 0,
    }
  }
  const keyboard = v.keyboard
  if (keyboard) {
    const strip = Math.max(KEYBOARD.stripMinPx, Math.round(v.vvH * KEYBOARD.stripFraction))
    return { mode: "phone", frame: { x: 0, y: 0, w: v.w, h: v.h }, panelTop: v.vvTop + strip, panelH: v.vvH - strip, keyboard, strip }
  }
  const panelTop = Math.round(v.h * (1 - PANEL_FRACTION))
  return { mode: "phone", frame: { x: 0, y: 0, w: v.w, h: v.h }, panelTop, panelH: v.h - panelTop, keyboard, strip: 0 }
}

/** The shot for this beat in this layout. Desktop always shows the whole composition. */
export function placementFor(beat: Beat, attending: Attending | undefined, l: Layout, vvTop = 0): Placement {
  const f = { w: l.frame.w, h: l.frame.h }
  if (l.mode === "desktop") return { s: f.h / POSTER.h, tx: 0, ty: 0 }
  if (l.keyboard) return placeStrip(stripShotFor(beat, attending), f, vvTop, l.strip)
  return placeShot(SHOTS[beat], f)
}

/** The stamp, placed twice (CHOSEN.md). Live finale: screen px from the visible shot's lower right, above the panel. */
export const STAMP_LIVE = { right: 16, abovePanel: 16 } as const
/** Exported poster (phase 6 compositor): poster px, the lower right corner of the 9:16 frame. */
export const STAMP_POSTER = { right: 64, bottom: 96, rotateDeg: -4 } as const
