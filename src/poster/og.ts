import fontUrl from "@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2?url&no-inline"
import { fillTracked, loadPlates } from "@/poster/compositor"
import { EVENT_DATE, INK, SCENE_TRACKING } from "@/poster/layout"
import { drawScene } from "@/poster/scene"
import { LAYERS, POSTER } from "@/world/layers"
import { LETTERING_FONT } from "@/world/lettering"

/**
 * OgCompositor (components.md, brand.md): the 1200 x 630 link-preview teaser, composited from the same layers and
 * the same 2D scene code as the saved poster. Never a guest's poster and no AI credit line: the cover before
 * kick-off (lights dark, Makes from the chest up, the moon), "THIRTY" in the sky, "21 DEC 2026" beneath it.
 * Build-time only: nothing in the app imports this file, so it never ships. `scripts/render-og.mjs` runs it in a
 * headless browser on the Mac.
 */

export const OG = { w: 1200, h: 630, quality: 0.86 } as const
export const OG_DATE = EVENT_DATE

/**
 * The poster band the preview shows: full poster width, so the scale is 1200 / 1080 and the band is 567 poster px
 * tall. Its top sits just above Makes's hairline (poster y 315), so it runs from his head to below the tower heads
 * (lamp cores down to poster y 810). The poster's own title (y 50 to 275) is above it, so THIRTY is set again.
 */
export function ogBand() {
  const s = OG.w / POSTER.w
  const h = OG.h / s
  const top = 282
  return { s, top, h, bottom: top + h }
}

/** THIRTY in the sky left of Makes's head, in OG px; the date under it. */
export const OG_TITLE = { x: 56, y: 56, w: 430, gap: 20, dateSize: 40, tracking: SCENE_TRACKING } as const

/** The title box in OG px (the lockup keeps its own aspect). */
export function ogTitleBox() {
  const t = LAYERS.find((l) => l.name === "thirty")!
  const h = (OG_TITLE.w * t.bbox[3]) / t.bbox[2]
  return { x: OG_TITLE.x, y: OG_TITLE.y, w: OG_TITLE.w, h, dateY: OG_TITLE.y + h + OG_TITLE.gap + OG_TITLE.dateSize / 2 }
}

const COVER = { pose: "l5-makes", lit: false, united: false } as const

/** Draw the preview onto a 1200 x 630 context. */
export function drawOg(ctx: CanvasRenderingContext2D, image: (name: string) => CanvasImageSource | undefined) {
  const { s, top } = ogBand()
  ctx.save()
  ctx.setTransform(s, 0, 0, s, 0, -top * s)
  // The poster's title sits above the band; it is set again below at preview size.
  drawScene(ctx, (n) => (n === "thirty" ? undefined : image(n)), COVER)
  ctx.restore()
  const box = ogTitleBox()
  const title = image("thirty")
  if (title) ctx.drawImage(title, box.x, box.y, box.w, box.h)
  ctx.font = `700 ${OG_TITLE.dateSize}px ${LETTERING_FONT}`
  ctx.fillStyle = INK.text
  ctx.textBaseline = "middle"
  fillTracked(ctx, OG_DATE, box.x, box.dateY, OG_TITLE.dateSize, OG_TITLE.tracking)
}

/** Render the preview in a browser: a JPEG `data:` URL. */
export async function renderOg(): Promise<string> {
  const face = new FontFace("Barlow Condensed", `url(${fontUrl})`, { weight: "700" })
  document.fonts.add(await face.load())
  const images = await loadPlates(COVER)
  const canvas = document.createElement("canvas")
  canvas.width = OG.w
  canvas.height = OG.h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no 2D canvas")
  drawOg(ctx, (n) => images.get(n))
  return canvas.toDataURL("image/jpeg", OG.quality)
}
