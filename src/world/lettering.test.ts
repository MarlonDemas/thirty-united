import { describe, expect, it } from "vitest"
import { NAME_Y, nameLayout } from "@/world/lettering"

/** A 2D context stand-in: every glyph is half an em wide at the size the font string sets. */
function ctx() {
  let size = 0
  return {
    get font() {
      return `700 ${size}px x`
    },
    set font(f: string) {
      size = Number(/(\d+(?:\.\d+)?)px/.exec(f)?.[1])
    },
    measureText: (t: string) => ({ width: Array.from(t).length * size * 0.5 }),
    get size() {
      return size
    },
  }
}
const W = 320
const H = 360
const run = (name: string) => {
  const c = ctx()
  const out = nameLayout(c as unknown as CanvasRenderingContext2D, name, W, H)
  const widest = Math.max(...out.lines.map((l) => Array.from(l.text).length * out.size * 0.5))
  return { ...out, widest, font: c.size }
}

describe("nameLayout: long names wrap, they do not shrink to nothing", () => {
  it("a short name: one line at 22 percent of the box height, centred on NAME_Y", () => {
    const r = run("THANDI")
    expect(r.size).toBeCloseTo(H * 0.22)
    expect(r.lines).toEqual([{ text: "THANDI", start: 0, y: H * NAME_Y }])
  })

  it("a long two-part name breaks at the space onto two lines, both inside 80 percent of the width", () => {
    const r = run("MAXIMILIANO JOSÉ")
    expect(r.lines.map((l) => l.text)).toEqual(["MAXIMILIANO", "JOSÉ"])
    expect(r.lines[1].start).toBe("MAXIMILIANO ".length)
    expect(r.widest).toBeLessThanOrEqual(W * 0.8 + 1e-9)
    expect(r.font).toBeCloseTo(r.size) // the context is left at the returned size
  })

  it("wrapping keeps the name larger than shrinking it onto one line would", () => {
    const oneLine = H * 0.22 * ((W * 0.8) / (16 * H * 0.22 * 0.5)) // the old rule: 16 glyphs scaled to fit
    expect(run("MAXIMILIANO JOSÉ").size).toBeGreaterThan(oneLine * 1.3)
  })

  it("two lines sit one line height apart about NAME_Y, both clear of the number box (from 40 percent)", () => {
    const r = run("ANNA MARIE")
    const [a, b] = r.lines
    expect(b.y - a.y).toBeCloseTo(r.size)
    expect((a.y + b.y) / 2).toBeCloseTo(H * NAME_Y)
    expect(r.size).toBeLessThanOrEqual(H * 0.17 + 1e-9)
    expect(a.y - r.size / 2).toBeGreaterThanOrEqual(0)
    expect(b.y + r.size / 2).toBeLessThan(H * 0.4)
  })

  it("breaks at the space that balances the lines best", () => {
    expect(run("MARIA DE LOURDES").lines.map((l) => l.text)).toEqual(["MARIA DE", "LOURDES"])
  })

  it("a name that fits stays on one line even with a space", () => {
    expect(run("JO ANN").lines).toHaveLength(1)
  })

  it("one long word cannot break: it shrinks to 80 percent of the width, as before", () => {
    const r = run("WOLFESCHLEGELSTEINHAUSEN")
    expect(r.lines).toHaveLength(1)
    expect(r.widest).toBeCloseTo(W * 0.8)
  })

  it("a trailing space while typing is not a break", () => {
    expect(run("MAXIMILIANO ").lines).toHaveLength(1)
  })
})
