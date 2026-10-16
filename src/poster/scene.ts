import type { Pose } from "@/world/beats"
import { MOON, applyMatrix, moonPath, quadMatrix } from "@/world/draw"
import { ANCHORS, LAYERS, POSTER, type Layer, type Point, type Quad } from "@/world/layers"

/**
 * The world drawn with the 2D canvas, in poster px (1080 x 1920), the same layers and code-drawn parts as the DOM
 * still layer (StillLayer), so the saved poster and the OG image match the live poster on every tier. No WebGL.
 */

/** Scene tokens (tokens.md). */
export const SCENE = {
  moonCore: "#E8F5FD",
  moonHalo: "#B7D3FA",
  floodlight: "#F1C7A0",
} as const

export type SceneOptions = {
  pose: Pose
  /** Every bank struck at full (the signing), or all dark (the cover). */
  lit: boolean
  /** UNITED painted in under THIRTY (the signing only). */
  united: boolean
  /** Drawn at z 7, over Makes and under the foreground: the shirt lettering on the held shirt. */
  atShirt?: (ctx: CanvasRenderingContext2D) => void
}

/** The plates a scene draws, back to front. Pose, bank and title layers are picked by the options. */
export function scenePlates(o: Pick<SceneOptions, "pose" | "lit" | "united">): Layer[] {
  return LAYERS.filter((l) => {
    if (l.bank) return o.lit
    if (l.name.startsWith("l5-") || l.name.startsWith("l6-") || l.name.startsWith("l7-")) return l.name === o.pose
    if (l.name === "l8-shirt") return false // the hanging shirt: only between Chapter 2 and the code
    if (l.name === "united") return o.united
    return true
  }).sort((a, b) => a.z - b.z)
}

type Stop = readonly [number, number] // [offset, alpha]
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, stops: readonly Stop[]) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  for (const [o, a] of stops) g.addColorStop(o, rgba(color, a))
  ctx.save()
  ctx.globalCompositeOperation = "screen" // light adds to the plate under it, as the CSS glows do
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
  ctx.restore()
}

/** index.css `.bank-glow` and its bank-3 variant (light through the cloth: no hot core). */
const BANK_STOPS: readonly Stop[] = [[0, 1], [0.12, 0.85], [0.3, 0.42], [0.58, 0.16], [1, 0]]
const BANK3_STOPS: readonly Stop[] = [[0, 0.42], [0.4, 0.24], [0.72, 0.08], [1, 0]]

function bankGlow(ctx: CanvasRenderingContext2D, i: number) {
  const { x, y, r } = ANCHORS.banks[i]
  glow(ctx, x, y, r, SCENE.floodlight, i === 2 ? BANK3_STOPS : BANK_STOPS)
}

/**
 * Moon.tsx: the halo screened onto the sky, the faint unlit disc, then the lit part with its limb darkening. The 2D
 * copy has no SVG filter, so it softens the same way with what the canvas has: a halo that brightens close to the
 * limb, an unlit disc whose rim fades out instead of ending in an edge, and a little bloom of halo light on the lit
 * part's edge (where Moon.tsx blurs the disc by 0.6 px).
 */
function moon(ctx: CanvasRenderingContext2D) {
  const { x, y, r } = ANCHORS.moon
  const R = r * MOON.haloScale
  const core = r / R
  glow(ctx, x, y, R, SCENE.moonHalo, [[0, 0.6], [core, 0.6], [core + 0.04, 0.36], [core + 0.14, 0.17], [core + 0.32, 0.07], [0.85, 0.02], [1, 0]])
  if (typeof Path2D !== "function") return
  ctx.save()
  ctx.translate(x, y)
  const unlit = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
  unlit.addColorStop(0, rgba("#2B3142", 0.5))
  unlit.addColorStop(0.9, rgba("#2B3142", 0.42))
  unlit.addColorStop(1, rgba("#2B3142", 0))
  ctx.fillStyle = unlit
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, 2 * Math.PI)
  ctx.fill()
  // The SVG gradient is on the disc's box (cx, cy 0.46, r 0.56 of 2r), stops at 0.55 and 1.
  const limb = ctx.createRadialGradient(-0.08 * r, -0.08 * r, 0, -0.08 * r, -0.08 * r, 1.12 * r)
  limb.addColorStop(0.55, SCENE.moonCore)
  limb.addColorStop(1, SCENE.moonHalo)
  ctx.fillStyle = limb
  ctx.shadowColor = rgba(SCENE.moonHalo, 0.85)
  ctx.shadowBlur = 0.12 * r
  ctx.fill(new Path2D(moonPath(r, MOON.illuminated, MOON.litSide)))
  ctx.restore()
}

/** index.css `.world-vignette`: ellipse 120% x 85% at 50% 38%, clear to 55%, then to 50% black at the rim. */
function vignette(ctx: CanvasRenderingContext2D) {
  const rx = POSTER.w * 1.2
  const ry = POSTER.h * 0.85
  ctx.save()
  ctx.translate(POSTER.w * 0.5, POSTER.h * 0.38)
  ctx.scale(1, ry / rx)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
  g.addColorStop(0.55, "rgba(0, 0, 0, 0)")
  g.addColorStop(1, "rgba(0, 0, 0, 0.5)")
  ctx.fillStyle = g
  ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx)
  ctx.restore()
}

/**
 * Draw the world, back to front, as the still layer stacks it: sky (z 0), moon (1), stadium (2), lit banks and
 * their glows (3), crowd (4), title (5), Makes (6), bank 3's glow and the shirt lettering (7), foreground (8),
 * then the vignette. A plate the `image` lookup returns nothing for is skipped (the OG image uses this to leave the
 * poster's title out). Plates that fail to load never get here: `loadPlates` rejects the render first.
 */
export function drawScene(ctx: CanvasRenderingContext2D, image: (name: string) => CanvasImageSource | undefined, o: SceneOptions) {
  const plates = scenePlates(o)
  const extras: Record<number, () => void> = {
    1: () => moon(ctx),
    3: () => o.lit && [0, 1, 3].forEach((i) => bankGlow(ctx, i)),
    7: () => {
      if (o.lit) bankGlow(ctx, 2)
      o.atShirt?.(ctx)
    },
  }
  for (let z = 0; z <= 8; z++) {
    for (const l of plates) {
      if (l.z !== z) continue
      const img = image(l.name)
      if (img) ctx.drawImage(img, l.bbox[0], l.bbox[1], l.bbox[2], l.bbox[3])
    }
    extras[z]?.()
  }
  vignette(ctx)
}

/** Affine [a, b, c, d, e, f] (the setTransform order) that maps triangle `s` onto triangle `d`. */
export function triangleAffine(s: readonly [Point, Point, Point], d: readonly [Point, Point, Point]): [number, number, number, number, number, number] {
  const [[x0, y0], [x1, y1], [x2, y2]] = s
  const [[u0, v0], [u1, v1], [u2, v2]] = d
  const den = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
  const a = ((u1 - u0) * (y2 - y0) - (u2 - u0) * (y1 - y0)) / den
  const c = ((u2 - u0) * (x1 - x0) - (u1 - u0) * (x2 - x0)) / den
  const b = ((v1 - v0) * (y2 - y0) - (v2 - v0) * (y1 - y0)) / den
  const dd = ((v2 - v0) * (x1 - x0) - (v1 - v0) * (x2 - x0)) / den
  return [a, b, c, dd, u0 - a * x0 - c * y0, v0 - b * x0 - dd * y0]
}

/** A grid of n x n cells over a w x h box, each split into two triangles: [box triangle, poster triangle]. */
export function warpMesh(w: number, h: number, q: Quad, n: number): [[Point, Point, Point], [Point, Point, Point]][] {
  const m = quadMatrix(w, h, q)
  const at = (i: number, j: number): [Point, Point] => {
    const p: Point = [(w * i) / n, (h * j) / n]
    return [p, applyMatrix(m, p)]
  }
  const out: [[Point, Point, Point], [Point, Point, Point]][] = []
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const [a, A] = at(i, j)
      const [b, B] = at(i + 1, j)
      const [c, C] = at(i + 1, j + 1)
      const [d, D] = at(i, j + 1)
      out.push([[a, b, c], [A, B, C]], [[a, c, d], [A, C, D]])
    }
  return out
}

/**
 * Draw `src` (a w x h box at `res` pixels per box pixel) onto the quad in perspective, as the DOM's matrix3d does:
 * a mesh of small affine triangles, each clipped a hair wider than itself so no seam shows.
 */
export function drawWarped(ctx: CanvasRenderingContext2D, src: CanvasImageSource, w: number, h: number, res: number, q: Quad, n = 10) {
  for (const [s, d] of warpMesh(w, h, q, n)) {
    const cx = (d[0][0] + d[1][0] + d[2][0]) / 3
    const cy = (d[0][1] + d[1][1] + d[2][1]) / 3
    const grow = (p: Point): Point => {
      const dx = p[0] - cx
      const dy = p[1] - cy
      const len = Math.hypot(dx, dy) || 1
      return [p[0] + (dx / len) * 0.8, p[1] + (dy / len) * 0.8]
    }
    const g = d.map(grow)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(g[0][0], g[0][1])
    ctx.lineTo(g[1][0], g[1][1])
    ctx.lineTo(g[2][0], g[2][1])
    ctx.closePath()
    ctx.clip()
    const scaled = s.map(([x, y]) => [x * res, y * res] as Point) as [Point, Point, Point]
    ctx.transform(...triangleAffine(scaled, d)) // on top of any outer transform
    ctx.drawImage(src, 0, 0)
    ctx.restore()
  }
}
