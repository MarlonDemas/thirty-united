import type { PosterFields } from "@/poster/fields"
import { INK, SCENE_TRACKING, SCRIM, STAMP, STAMP_ICON_STROKE, STAMP_PARTS, STAMP_WORDS, footBlock, stampBox, trackedWidth, type Line } from "@/poster/layout"
import { drawScene, drawWarped, scenePlates, type SceneOptions } from "@/poster/scene"
import { POSTER, QUADS, layerUrl } from "@/world/layers"
import { LETTERING_COLOR, LETTERING_FONT, LETTERING_RES, NAME_Y, NUMBER_SIZE, NUMBER_Y, nameFont, quadBox } from "@/world/lettering"

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

/** Name and number on the held shirt: drawn flat in the quad's box, then warped onto the quad (as the live shirt). */
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
  nameFont(f, name, w, h)
  f.fillText(name, w / 2, h * NAME_Y)
  f.font = font(h * NUMBER_SIZE)
  f.fillText(number, w / 2, h * NUMBER_Y)
  drawWarped(ctx, flat, w, h, LETTERING_RES, quad)
}

/** lucide `pencil` (24 x 24, 2 px stroke), the Maybe stamp's icon. */
const PENCIL = ["M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z", "m15 5 4 4"]

/**
 * The stamp, as Stamp.tsx draws it: Yes solid `poster-red` with `panel` words ("SIGNED · 21 DEC 2026"), Maybe a
 * `panel` fill with a `text` outline, the pencil and "PENCILLED IN". Turned -4 degrees, lower right, over the foot.
 */
function stamp(ctx: CanvasRenderingContext2D, attending: PosterFields["attending"], footTop: number) {
  const p = STAMP_PARTS
  const maybe = attending === "maybe"
  const parts = STAMP_WORDS[attending]
  ctx.font = font(STAMP.size)
  const widths = parts.map((t) => widthOf(ctx, t, STAMP.size, SCENE_TRACKING) + SCENE_TRACKING * STAMP.size) // CSS tracks the last glyph too
  const contentW = widths.reduce((a, b) => a + b, 0) + p.gap * (parts.length - 1) + (maybe ? p.icon + p.gap : 0)
  const box = stampBox(contentW, footTop)
  const ink = maybe ? INK.text : INK.panel
  ctx.save()
  ctx.translate(box.cx, box.cy)
  ctx.rotate(box.angle)
  const x0 = -box.w / 2
  const y0 = -box.h / 2
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
  ctx.restore()
}

/** Draw the whole poster onto a 1080 x 1920 context. Images are looked up by layer name. */
export function drawPoster(ctx: CanvasRenderingContext2D, image: (name: string) => CanvasImageSource | undefined, f: PosterFields) {
  drawScene(ctx, image, { pose: "l7-makes-signing", lit: true, united: true, atShirt: (c) => shirt(c, f.name, f.number) })
  const foot = footBlock(f.plusOne)
  ctx.save()
  ctx.globalAlpha = SCRIM.alpha
  ctx.fillStyle = INK.panel
  ctx.fillRect(0, foot.top, POSTER.w, foot.height)
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
