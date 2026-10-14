import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from "three"

/** A design token from `:root`, so the scene never duplicates a hex that CSS already owns. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  return { c, ctx: c.getContext("2d")! }
}

/** Baked contact shadow: a blurred black rectangle. Returns the texture and how much padding it carries. */
export function makeShadowTexture(aspect: number) {
  const body = 512
  const bodyH = Math.round(body / aspect)
  const blur = Math.round(body * 0.045) // 16px of blur on a 358px ticket, as in the DOM ticket
  const pad = blur * 2
  const { c, ctx } = canvas(body + pad * 2, bodyH + pad * 2)
  // Draw the rectangle far off-canvas and keep only its shadow (shadowBlur works in every browser).
  ctx.shadowColor = "rgba(0,0,0,0.55)"
  ctx.shadowBlur = blur
  ctx.shadowOffsetX = 10000
  ctx.fillStyle = "#000"
  ctx.fillRect(pad - 10000, pad, body, bodyH)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  return { tex, padX: (pad * 2) / body, padY: (pad * 2) / bodyH }
}

/** Sheen: white 28% at the upper left, fading to 0 by 40% of the gradient line, at 115deg (CSS angle). */
export function makeSheenTexture(aspect: number) {
  const w = 1024
  const h = Math.round(w / aspect)
  const { c, ctx } = canvas(w, h)
  const a = (115 * Math.PI) / 180
  const dx = Math.sin(a)
  const dy = -Math.cos(a)
  const len = Math.abs(w * dx) + Math.abs(h * dy)
  const cx = w / 2
  const cy = h / 2
  const g = ctx.createLinearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2)
  g.addColorStop(0, "rgba(255,255,255,0.28)")
  g.addColorStop(0.4, "rgba(255,255,255,0)")
  g.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = ClampToEdgeWrapping
  tex.wrapT = ClampToEdgeWrapping
  return tex
}

/** Ink cloth with paper stitching on both edges and "THIRTY UNITED" in paper at 55%, tiled along the strap. */
export function makeStrapTexture(cloth: string, paper: string) {
  const w = 64
  const h = 512
  const { c, ctx } = canvas(w, h)
  ctx.fillStyle = cloth
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = paper
  ctx.lineWidth = 3 // about 1.5px on screen
  ctx.setLineDash([12, 8])
  for (const x of [8, w - 8]) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  ctx.setLineDash([])
  // the key light catches the upper-left edge
  ctx.globalAlpha = 0.4
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, 3, h)
  ctx.globalAlpha = 0.55
  ctx.font = '700 24px "Barlow Condensed", "Arial Narrow", sans-serif'
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  for (const y of [h * 0.25, h * 0.75]) {
    ctx.save()
    ctx.translate(w / 2, y)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText("THIRTY UNITED", 0, 1)
    ctx.restore()
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = ClampToEdgeWrapping
  tex.wrapT = RepeatWrapping
  tex.anisotropy = 4
  return tex
}
