import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { ANCHORS, LAYER_FILES, LAYERS, layerUrl, POSTER, QUADS } from "@/world/layers"

const DIR = path.resolve(import.meta.dirname, "layers")
// Built from parts so this file itself never contains the path it guards against.
const REFS = [".specno-design", "references"].join("/")

describe("the layer manifest", () => {
  it("every layer has exactly one file named as the future WebP, and every file is in the manifest", () => {
    const names = LAYERS.map((l) => l.name)
    expect(new Set(names).size).toBe(names.length)
    for (const n of names) expect(layerUrl(n), n).toBeTruthy()
    const files = LAYER_FILES.map((f) => f.replace(/\.(svg|webp)$/, ""))
    expect([...files].sort()).toEqual([...names].sort())
  })

  it("names the plates of CHOSEN.md, with the four floodlight banks as banks 1 to 4", () => {
    const names = LAYERS.map((l) => l.name)
    for (const n of ["l1-sky", "l2-stadium-off", "l3-crowd", "l4-foreground", "l5-makes", "l6-makes-wave", "l7-makes-signing", "l8-shirt"])
      expect(names).toContain(n)
    expect(LAYERS.filter((l) => l.bank).map((l) => [l.name, l.bank])).toEqual([
      ["l2b-stadium-on-b1", 1],
      ["l2b-stadium-on-b2", 2],
      ["l2b-stadium-on-b3", 3],
      ["l2b-stadium-on-b4", 4],
    ])
  })

  it("each greybox file is cropped to its bbox, and every bbox sits inside the poster", () => {
    for (const l of LAYERS) {
      const [x, y, w, h] = l.bbox
      expect(x >= 0 && y >= 0 && x + w <= POSTER.w && y + h <= POSTER.h, l.name).toBe(true)
      const svg = readFileSync(path.join(DIR, `${l.name}.svg`), "utf8")
      expect(svg, l.name).toContain(`viewBox="0 0 ${w} ${h}"`)
      expect(svg, l.name).toMatch(/GREYBOX/)
    }
  })

  it("z-order runs sky, stadium, banks, crowd, title, Makes, shirt, foreground", () => {
    const z = (n: string) => LAYERS.find((l) => l.name === n)!.z
    const order = ["l1-sky", "l2-stadium-off", "l2b-stadium-on-b1", "l3-crowd", "thirty", "l5-makes", "l8-shirt", "l4-foreground"]
    expect(order.map(z)).toEqual([...order.map(z)].sort((a, b) => a - b))
  })

  it("T1 and T0 draw the whole poster", () => {
    for (const l of LAYERS) expect(l.tiers, l.name).toEqual(expect.arrayContaining(["T1", "T0"]))
  })

  it("the shirt quads and anchors are in poster space", () => {
    for (const q of Object.values(QUADS)) for (const [x, y] of q) expect(x >= 0 && x <= POSTER.w && y >= 0 && y <= POSTER.h).toBe(true)
    expect(ANCHORS.lamps).toHaveLength(6)
  })

  it("never references the owner's reference images", () => {
    for (const f of readdirSync(DIR)) expect(readFileSync(path.join(DIR, f), "utf8"), f).not.toContain(REFS)
    const src = path.resolve(import.meta.dirname, "..")
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of walk(src).filter((f) => /\.(tsx?|css|json|svg)$/.test(f))) expect(readFileSync(f, "utf8"), f).not.toContain(REFS)
  })
})
