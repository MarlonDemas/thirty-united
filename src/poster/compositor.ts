import type { PosterFields } from "@/poster/fields"
import { INK, SCENE_TRACKING, SCRIM, STAMP, STAMP_ICON_STROKE, STAMP_PARTS, STAMP_SHADOW, STAMP_WEAR, STAMP_WORDS, footBlock, stampBox, trackedWidth, type Line, type StampBox } from "@/poster/layout"
import { drawScene, drawWarped, scenePlates, type SceneOptions } from "@/poster/scene"
import { POSTER, QUADS, layerUrl, type Quad } from "@/world/layers"
import { LETTERING_COLOR, LETTERING_FONT, LETTERING_RES, NUMBER_SIZE, NUMBER_Y, nameLayout, quadBox } from "@/world/lettering"

/**
 * PosterCompositor (components.md): the guest's fields and the layers in, a 1080 x 1920 JPEG `File` out. Drawn on
 * the phone with the 2D canvas and never uploaded. It takes only `PosterFields`, so nothing else can reach the image.
 * Lazy: this module, its draw code and the Share logic load in their own chunk, after first paint.
 */

export const POSTER_QUALITY = 0.88
export const POSTER_FILE_NAME = "thirty-united-poster.jpg"

const font = (size: number) => `700 ${size}px ${LETTERING_FONT}`

/** The plates (WebP and the SVG lockups), same-origin, so the canvas stays clean and can be exported. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = "async"
  img.src = src
  return img.decode().then(() => img)
}

/**
 * Every plate the scene draws, by layer name. Any plate that fails to load rejects the whole render: a poster
 * without Makes (or the stadium) is worse than the "couldn't be made" message.
 */
export async function loadPlates(o: Pick<SceneOptions, "pose" | "lit" | "united">) {
  const out = new Map<string, HTMLImageElement>()
  await Promise.all(
    scenePlates(o).map(async (l) => {
      const url = layerUrl(l.name, 1080)
      if (url) out.set(l.name, await loadImage(url))
    }),
  )
  return out
}

/** Barlow Condensed 700 is self-hosted (index.css); canvas text needs it loaded, not just declared. */
export async function loadFont(text: string) {
  try {
    await document.fonts?.load(font(44), text)
  } catch {
    /* the narrow fallback draws instead */
  }
}

/** A line with CSS-style tracking, glyph by glyph (canvas `letterSpacing` is not on every engine yet). */
export function fillTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, tracking: number) {
  ctx.textAlign = "left"
  let at = x
  for (const g of Array.from(text)) {
    ctx.fillText(g, at, y)
    at += ctx.measureText(g).width + tracking * size
  }
}

const widthOf = (ctx: CanvasRenderingContext2D, text: string, size: number, tracking: number) =>
  trackedWidth((g) => ctx.measureText(g).width, text, size, tracking)

function centredLine(ctx: CanvasRenderingContext2D, l: Line) {
  ctx.font = font(l.size)
  ctx.fillStyle = l.color
  ctx.textBaseline = "middle"
  fillTracked(ctx, l.text, (POSTER.w - widthOf(ctx, l.text, l.size, l.tracking)) / 2, l.y, l.size, l.tracking)
}

/** The cloth's say in the lettering: folds darken the letters down to `floor` of full white; the letters sit at `alpha`. */
const FOLD = { floor: 0.55, alpha: 0.92 } as const

/**
 * Name and number on the held shirt: drawn flat in the quad's box, then warped onto the quad (as the live shirt).
 * On the poster they also take the folds: the warped letters are shaded by the shirt plate under them (its
 * brightest channel, against the lit cloth under the letters), so the creases and the shadow cross them. A canvas that
 * cannot be read back draws them flat instead.
 */
function shirt(ctx: CanvasRenderingContext2D, name: string, number: string) {
  const quad = QUADS["l7-makes-signing"]
  const { w, h } = quadBox(quad)
  const flat = document.createElement("canvas")
  flat.width = w * LETTERING_RES
  flat.height = h * LETTERING_RES
  const f = flat.getContext("2d")
  if (!f) throw new Error("no 2D canvas for the shirt lettering") // never a shirt without its name and number
  f.scale(LETTERING_RES, LETTERING_RES)
  f.fillStyle = LETTERING_COLOR
  f.textAlign = "center"
  f.textBaseline = "middle"
  for (const l of nameLayout(f, name, w, h).lines) f.fillText(l.text, w / 2, l.y)
  f.font = font(h * NUMBER_SIZE)
  f.fillText(number, w / 2, h * NUMBER_Y)
  if (!inTheFolds(ctx, flat, w, h, quad)) drawWarped(ctx, flat, w, h, LETTERING_RES, quad)
}

/** The warped lettering shaded by the plate under it (see `shirt`). False when the pixels cannot be read. */
function inTheFolds(ctx: CanvasRenderingContext2D, flat: HTMLCanvasElement, w: number, h: number, quad: Quad): boolean {
  const x0 = Math.floor(Math.min(...quad.map((p) => p[0])))
  const y0 = Math.floor(Math.min(...quad.map((p) => p[1])))
  const bw = Math.ceil(Math.max(...quad.map((p) => p[0]))) - x0 + 1
  const bh = Math.ceil(Math.max(...quad.map((p) => p[1]))) - y0 + 1
  const warped = document.createElement("canvas")
  warped.width = bw
  warped.height = bh
  const o = warped.getContext("2d")
  try {
    const plate = ctx.getImageData(x0, y0, bw, bh)
    if (!o || !plate?.data) return false
    drawWarped(o, flat, w, h, LETTERING_RES, quad.map(([x, y]) => [x - x0, y - y0]) as unknown as Quad)
    const letters = o.getImageData(0, 0, bw, bh)
    if (!letters?.data) return false
    const L = letters.data
    const P = plate.data
    const lit: number[] = []
    for (let i = 3; i < L.length; i += 4) if (L[i] > 128) lit.push(Math.max(P[i - 3], P[i - 2], P[i - 1]))
    lit.sort((a, b) => a - b)
    const ref = lit[Math.floor(lit.length * 0.9)] || 255 // the lit cloth: folds read darker than it
    for (let i = 3; i < L.length; i += 4) {
      if (!L[i]) continue
      const shade = Math.min(1, Math.max(FOLD.floor, Math.max(P[i - 3], P[i - 2], P[i - 1]) / ref))
      L[i - 3] *= shade
      L[i - 2] *= shade
      L[i - 1] *= shade
      L[i] *= FOLD.alpha
    }
    o.putImageData(letters, 0, 0)
    ctx.drawImage(warped, x0, y0)
    return true
  } catch {
    return false // a tainted or unreadable canvas: the flat lettering instead
  } finally {
    warped.width = warped.height = 0
  }
}

/** lucide `pencil` (24 x 24, 2 px stroke), the Maybe stamp's icon. */
const PENCIL = ["M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z", "m15 5 4 4"]

/** A fixed-seed PRNG (mulberry32), so every poster's stamp is worn the same way. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Rubber wear: crisp specks punched out of the stamp, `STAMP_WEAR.cover` of its area, from a fixed seed. `px`: device px per poster px. */
function wear(o: CanvasRenderingContext2D, W: number, H: number, px: number) {
  const rnd = seeded(STAMP_WEAR.seed)
  o.save()
  o.globalCompositeOperation = "destination-out"
  o.fillStyle = "#000"
  let left = W * H * STAMP_WEAR.cover
  while (left > 0) {
    // fine grain of 0.5 to 2 poster px specks, some in pairs and threes, so it reads as worn rubber, not dirt
    const n = rnd() < 0.2 ? 2 + Math.floor(rnd() * 2) : 1
    const x = rnd() * W
    const y = rnd() * H
    for (let i = 0; i < n && left > 0; i++) {
      const s = Math.max(1, Math.round(px * (0.5 + rnd() * 1.5)))
      o.fillRect(Math.round(x + (rnd() - 0.5) * 3 * px), Math.round(y + (rnd() - 0.5) * 3 * px), s, s)
      left -= s * s
    }
  }
  o.restore()
}

/** The live `.stamp-shadow`: a box shadow, painted outside the stamp only, so its worn specks show the plate. */
function stampShadow(ctx: CanvasRenderingContext2D, box: StampBox) {
  const pad = STAMP_SHADOW.blur * 3 + STAMP_SHADOW.y
  ctx.save()
  ctx.beginPath()
  ctx.rect(-box.w / 2 - pad, -box.h / 2 - pad, box.w + 2 * pad, box.h + 2 * pad)
  ctx.rect(-box.w / 2, -box.h / 2, box.w, box.h)
  ctx.clip("evenodd")
  ctx.shadowColor = STAMP_SHADOW.color
  ctx.shadowBlur = STAMP_SHADOW.blur
  ctx.shadowOffsetX = STAMP_SHADOW.x
  ctx.shadowOffsetY = STAMP_SHADOW.y
  ctx.fillStyle = "#000"
  ctx.fillRect(-box.w / 2, -box.h / 2, box.w, box.h)
  ctx.restore()
}

/** Stamp resolution: drawn at 2x off-screen, so the rotated copy stays crisp. */
const STAMP_RES = 2

/**
 * The stamp, as Stamp.tsx draws it: Yes solid `poster-red` with `panel` words ("SIGNED · 21 DEC 2026"), Maybe a
 * `panel` fill with a `text` outline, the pencil and "PENCILLED IN". Turned -4 degrees, lower right, over the foot,
 * worn and with its contact shadow, as the live one. Without an off-screen canvas it draws clean.
 */
function stamp(ctx: CanvasRenderingContext2D, attending: PosterFields["attending"], footTop: number) {
  const maybe = attending === "maybe"
  const parts = STAMP_WORDS[attending]
  ctx.font = font(STAMP.size)
  const widths = parts.map((t) => widthOf(ctx, t, STAMP.size, SCENE_TRACKING) + SCENE_TRACKING * STAMP.size) // CSS tracks the last glyph too
  const p = STAMP_PARTS
  const contentW = widths.reduce((a, b) => a + b, 0) + p.gap * (parts.length - 1) + (maybe ? p.icon + p.gap : 0)
  const box = stampBox(contentW, footTop)
  ctx.save()
  ctx.translate(box.cx, box.cy)
  ctx.rotate(box.angle)
  stampShadow(ctx, box)
  const off = document.createElement("canvas")
  off.width = Math.ceil(box.w * STAMP_RES)
  off.height = Math.ceil(box.h * STAMP_RES)
  const o = off.getContext("2d")
  if (o) {
    o.scale(STAMP_RES, STAMP_RES)
    o.translate(box.w / 2, box.h / 2)
    stampFace(o, box, maybe, parts, widths, contentW)
    o.setTransform(1, 0, 0, 1, 0, 0)
    wear(o, off.width, off.height, STAMP_RES)
    ctx.drawImage(off, -box.w / 2, -box.h / 2, box.w, box.h)
    off.width = off.height = 0
  } else stampFace(ctx, box, maybe, parts, widths, contentW)
  ctx.restore()
}

/** The stamp's face, centred on the context's origin. */
function stampFace(ctx: CanvasRenderingContext2D, box: StampBox, maybe: boolean, parts: readonly string[], widths: number[], contentW: number) {
  const p = STAMP_PARTS
  const ink = maybe ? INK.text : INK.panel
  const x0 = -box.w / 2
  const y0 = -box.h / 2
  ctx.font = font(STAMP.size)
  ctx.fillStyle = maybe ? INK.panel : INK.posterRed
  ctx.fillRect(x0, y0, box.w, box.h)
  ctx.lineWidth = p.border
  ctx.strokeStyle = maybe ? INK.text : INK.posterRed
  ctx.strokeRect(x0 + p.border / 2, y0 + p.border / 2, box.w - p.border, box.h - p.border)
  const inset = p.border + p.pad
  ctx.lineWidth = p.rule
  ctx.strokeStyle = ink
  ctx.strokeRect(x0 + inset + p.rule / 2, y0 + inset + p.rule / 2, box.w - 2 * inset - p.rule, box.h - 2 * inset - p.rule)
  let x = -contentW / 2
  if (maybe && typeof Path2D === "function") {
    ctx.save()
    ctx.translate(x, -p.icon / 2)
    ctx.scale(p.icon / 24, p.icon / 24)
    ctx.lineWidth = STAMP_ICON_STROKE
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    for (const d of PENCIL) ctx.stroke(new Path2D(d))
    ctx.restore()
    x += p.icon + p.gap
  }
  ctx.fillStyle = ink
  ctx.textBaseline = "middle"
  parts.forEach((t, i) => {
    fillTracked(ctx, t, x, 0, STAMP.size, SCENE_TRACKING)
    x += widths[i] + p.gap
  })
}

/** Draw the whole poster onto a 1080 x 1920 context. Images are looked up by layer name. */
export function drawPoster(ctx: CanvasRenderingContext2D, image: (name: string) => CanvasImageSource | undefined, f: PosterFields) {
  drawScene(ctx, image, { pose: "l7-makes-signing", lit: true, united: true, atShirt: (c) => shirt(c, f.name, f.number) })
  const foot = footBlock(f.plusOne)
  ctx.save()
  ctx.fillStyle = INK.panel
  // The feather, row by row (no gradient object: exact per poster pixel), then the slab at full alpha.
  for (let i = 0; i < SCRIM.feather; i++) {
    ctx.globalAlpha = (SCRIM.alpha * (i + 0.5)) / SCRIM.feather
    ctx.fillRect(0, foot.top + i, POSTER.w, 1)
  }
  ctx.globalAlpha = SCRIM.alpha
  ctx.fillRect(0, foot.top + SCRIM.feather, POSTER.w, foot.height - SCRIM.feather)
  ctx.restore()
  for (const l of foot.lines) centredLine(ctx, l)
  stamp(ctx, f.attending, foot.top)
}

const SIGNING = { pose: "l7-makes-signing", lit: true, united: true } as const

/** Every string the poster sets in Barlow Condensed, so the font load covers exactly the glyphs drawn. */
function posterText(f: PosterFields): string {
  return [f.name, f.number, ...footBlock(f.plusOne).lines.map((l) => l.text), ...STAMP_WORDS[f.attending]].join(" ")
}

/** The poster as a JPEG `File` plus a `data:` URL for the viewer `<img>` (the CSP allows data: images, not blob:). */
export async function renderPoster(f: PosterFields): Promise<{ file: File; url: string }> {
  const [plates] = await Promise.all([loadPlates(SIGNING), loadFont(posterText(f))])
  const canvas = document.createElement("canvas")
  let blob: Blob | null
  try {
    canvas.width = POSTER.w
    canvas.height = POSTER.h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("no 2D canvas")
    drawPoster(ctx, (n) => plates.get(n), f)
    blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", POSTER_QUALITY))
  } finally {
    canvas.width = canvas.height = 0 // let go of the 8 MB backing store now, failed or not (iOS counts it against the page)
  }
  if (!blob) throw new Error("JPEG encode failed")
  const url = await new Promise<string>((ok, fail) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.onerror = () => fail(r.error)
    r.readAsDataURL(blob)
  })
  return { file: new File([blob], POSTER_FILE_NAME, { type: "image/jpeg" }), url }
}
