import { CanvasTexture, SRGBColorSpace } from "three"

const PAPER = "#F3EDE1"
const INK = "#1B1A17"
const INK2 = "#5E5A50"
export const TICKET_ASPECT = 2.2
const W = 1024
const H = Math.round(W / TICKET_ASPECT)
const STUB_X = Math.round(W * 0.78)

async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('700 100px "Barlow Condensed"', "THIRTY UNITED"),
      document.fonts.load('italic 400 26px "Source Serif 4"', "Thirty"),
      document.fonts.load('400 20px "Inter"', "Makes"),
      document.fonts.load('500 20px "JetBrains Mono"', "21 DEC 2026"),
    ])
    await document.fonts.ready
  } catch {
    /* fall through with fallback fonts */
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function base() {
  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, W - 3, H - 3)
  ctx.textBaseline = "alphabetic"
  return { c, ctx }
}

/** Draws the ticket faces to canvases after the self-hosted fonts are ready. Same words as the DOM ticket. */
export async function makeTicketTextures(hostLine: string, maxAniso: number) {
  await fontsReady()
  const front = base()
  const f = front.ctx
  const pad = 44
  const mainW = STUB_X - pad * 2

  f.fillStyle = INK
  f.font = '500 26px "JetBrains Mono", monospace'
  f.fillText("21 DEC 2026", pad, 64)

  let size = 150
  f.font = `700 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`
  const title = "THIRTY UNITED"
  while (f.measureText(title).width > mainW && size > 40) {
    size -= 4
    f.font = `700 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`
  }
  f.fillText(title, pad, 64 + 20 + size * 0.85)

  f.font = 'italic 400 30px "Source Serif 4", Georgia, serif'
  const lines = wrap(f, hostLine, mainW)
  const yLine = H - 128 - (lines.length - 1) * 38
  lines.forEach((l, i) => f.fillText(l, pad, yLine + i * 38))
  f.fillStyle = INK2
  f.font = '400 22px "Inter", system-ui, sans-serif'
  f.fillText("Makes", pad, H - 84)
  f.fillStyle = INK
  f.font = '400 22px "Inter", system-ui, sans-serif'
  f.setLineDash([4, 3])
  f.strokeStyle = INK2
  f.lineWidth = 1.5
  f.strokeRect(pad, H - 64, 28, 28)
  f.setLineDash([])
  f.fillStyle = INK2
  f.fillText("Venue TBA", pad + 40, H - 41)

  // perforation + stub
  f.strokeStyle = INK
  f.lineWidth = 3
  f.setLineDash([2, 12])
  f.lineCap = "round"
  f.beginPath()
  f.moveTo(STUB_X, 22)
  f.lineTo(STUB_X, H - 22)
  f.stroke()
  f.setLineDash([])
  const cx = STUB_X + (W - STUB_X) / 2
  f.textAlign = "center"
  f.fillStyle = INK2
  f.font = '500 22px "JetBrains Mono", monospace'
  f.fillText("SEAT", cx, H / 2 - 6)
  f.fillStyle = INK2
  f.font = '500 34px "JetBrains Mono", monospace'
  f.fillText("---", cx, H / 2 + 36)

  const back = base()
  const b = back.ctx
  b.textAlign = "center"
  b.fillStyle = INK
  b.font = '500 30px "JetBrains Mono", monospace'
  b.fillText("ADMIT ONE", W / 2, H / 2 - 4)
  b.fillStyle = INK2
  b.font = '500 22px "JetBrains Mono", monospace'
  b.fillText("21 DEC 2026", W / 2, H / 2 + 34)

  const mk = (c: HTMLCanvasElement) => {
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = maxAniso
    return t
  }
  return { front: mk(front.c), back: mk(back.c) }
}
