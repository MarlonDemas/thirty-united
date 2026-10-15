import { POSTER } from "@/world/layers"

/**
 * What the WebGL world draws on each WebGL tier (cinematic recommendation, "Technique stack per tier"; tokens.md,
 * ambient). Pure data: the scene reads it, the tests pin it. A demotion from T3 to T2 re-reads it.
 */
export type GLTier = "T3" | "T2"

export type WorldConfig = {
  /** GPU ember points: `base` rise all the time; the rest of `cap` only fly in the one-shot bursts (Yes swirl, finale). */
  embers: { base: number; cap: number }
  /** Scrolling-noise smoke quads. */
  smoke: number
  /** Beam cards under each lit bank. */
  beams: boolean
  /** The highest screen pixel ratio the canvas renders at (rec: up to 2 on iOS, 1.5 on Android for T3; 1 to 1.25 for T2). */
  dprCap: number
}

export const EMBERS = {
  T3: { base: 300, cap: 1500 },
  T2: { base: 120, cap: 500 },
} as const

export function worldConfig(tier: GLTier, android: boolean): WorldConfig {
  if (tier === "T3") return { embers: EMBERS.T3, smoke: 3, beams: true, dprCap: android ? 1.5 : 2 }
  return { embers: EMBERS.T2, smoke: 1, beams: false, dprCap: 1.25 }
}

/** Never sharper than the plates themselves (1080 wide = 1 canvas px per poster px), never mushier than half. */
export const DPR_RANGE = { min: 0.5, max: 1 } as const

/**
 * The canvas is laid out in poster space (1080 x 1920 CSS px inside the `.poster` element, which the shot scales), so
 * its pixel ratio is canvas px per poster px, not the screen's DPR. At the cover shot one poster px covers
 * `coverScale` CSS px, so this ratio renders the cover at (up to) the capped screen density and no more.
 */
export function canvasDpr(frame: { w: number; h: number }, deviceDpr: number, cap: number): number {
  const cover = Math.max(frame.h / POSTER.h, frame.w / POSTER.w)
  const want = cover * Math.min(deviceDpr > 0 ? deviceDpr : 1, cap)
  return Math.round(Math.min(DPR_RANGE.max, Math.max(DPR_RANGE.min, want)) * 100) / 100
}

/** Poster px (y down, origin top left) to the R3F orthographic camera's world units (y up, origin at the centre). */
export const toWorld = (x: number, y: number): [number, number] => [x - POSTER.w / 2, POSTER.h / 2 - y]

export type Rect = { x0: number; y0: number; x1: number; y1: number }

/**
 * A plate's quad in poster px and the UVs at its corners. A plate that touches a poster edge is drawn `pad` px past
 * that edge (the UVs run past 0..1, and clamp-to-edge repeats the border pixels), so parallax never opens a gap at
 * the edge of the poster. Interior edges stay where the plate's own alpha ends.
 */
export function plateQuad(bbox: readonly [number, number, number, number], pad: number): { rect: Rect; uv: Rect } {
  const [x, y, w, h] = bbox
  const left = x <= 0 ? pad : 0
  const top = y <= 0 ? pad : 0
  const right = x + w >= POSTER.w ? pad : 0
  const bottom = y + h >= POSTER.h ? pad : 0
  return {
    rect: { x0: x - left, y0: y - top, x1: x + w + right, y1: y + h + bottom },
    // u runs left to right; v runs bottom to top (textures are flipped on upload).
    uv: { x0: -left / w, y0: 1 + top / h, x1: 1 + right / w, y1: -bottom / h },
  }
}

/** "#F1C7A0" to [r, g, b] in 0..1, as stored (sRGB). The canvas renders without colour conversion, like the DOM. */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (!m) throw new Error(`not a #rrggbb colour: ${hex}`)
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
}

/** Scene tokens (tokens.md, re-sampled from the plates 2026-10-15). index.css carries the same values for T1. */
export const SCENE = {
  floodlight: "#F1C7A0",
  smokeRed: "#B22C28",
  ember: "#E03D2B",
  moonHalo: "#B7D3FA",
} as const

/** Where the beam cards aim: the pitch, behind Makes, below the stands (poster px). */
export const BEAM_TARGET: readonly [number, number] = [540, 1000]

/**
 * One smoke quad: a band of poster space, its draw order between the layers' z values, how strong it reads, and its
 * parallax depth (it moves with the layers either side of it).
 */
export type SmokeQuad = { rect: Rect; z: number; depth: number; alpha: number; speed: number; seed: number }

/**
 * Smoke along the ground and in the crowd. The first is the one T2 keeps: the crowd band, the part of the smoke that
 * shows above the panel on a phone. T3 adds a band behind the crowd and one low over the rubble.
 */
export const SMOKE_QUADS: readonly SmokeQuad[] = [
  { rect: { x0: -10, y0: 860, x1: 1090, y1: 1240 }, z: 4.5, depth: 0.45, alpha: 0.32, speed: 9, seed: 1.7 },
  { rect: { x0: -10, y0: 900, x1: 1090, y1: 1120 }, z: 3.7, depth: 0.3, alpha: 0.22, speed: 6, seed: 5.3 },
  { rect: { x0: -10, y0: 1500, x1: 1090, y1: 1930 }, z: 8.5, depth: 1, alpha: 0.28, speed: 12, seed: 9.1 },
]

export const smokeQuadsFor = (cfg: WorldConfig) => SMOKE_QUADS.slice(0, cfg.smoke)
