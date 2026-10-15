import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { ANCHORS, LAYER_FILES, LAYERS, layerUrl, plateSetFor, POSTER, QUADS } from "@/world/layers"

const DIR = path.resolve(import.meta.dirname, "layers")
// Built from parts so this file itself never contains the path it guards against.
const REFS = [".specno-design", "references"].join("/")

/** Pixel size from a WebP's RIFF header (VP8X, lossy VP8 or lossless VP8L). */
function webpSize(file: string): [number, number] {
  const b = readFileSync(file)
  expect(b.toString("ascii", 0, 4) + b.toString("ascii", 8, 12), file).toBe("RIFFWEBP")
  const chunk = b.toString("ascii", 12, 16)
  if (chunk === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]
  if (chunk === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21)
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)]
  }
  throw new Error(`${file}: unknown WebP chunk ${chunk}`)
}

const files = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : [path.join(d, e.name)]))

describe("the layer manifest", () => {
  it("every layer has exactly one file, and every file is in the manifest", () => {
    const names = LAYERS.map((l) => l.name)
    expect(new Set(names).size).toBe(names.length)
    for (const n of names) expect(layerUrl(n), n).toBeTruthy()
    const top = LAYER_FILES.filter((f) => !f.includes("/")).map((f) => f.replace(/\.(svg|webp)$/, ""))
    expect([...top].sort()).toEqual([...names].sort())
  })

  it("every plate ships as a WebP at 1080 and 720; only the two title lockups are SVG", () => {
    const svgs = LAYER_FILES.filter((f) => f.endsWith(".svg"))
    expect(svgs.sort()).toEqual(["thirty.svg", "united.svg"])
    const plates = LAYERS.filter((l) => !svgs.includes(`${l.name}.svg`)).map((l) => l.name)
    expect(plates).toHaveLength(12)
    for (const n of plates) {
      expect(LAYER_FILES, n).toContain(`${n}.webp`)
      expect(LAYER_FILES, n).toContain(`720/${n}.webp`)
    }
    // Nothing else in 720/: one file per plate.
    expect(LAYER_FILES.filter((f) => f.startsWith("720/")).length).toBe(plates.length)
  })

  it("T1 draws the 720 files; every other tier draws the 1080 files; the titles have one file for all", () => {
    expect(plateSetFor("T1")).toBe(720)
    for (const t of ["T3", "T2", "T0", "forced-colors"] as const) expect(plateSetFor(t), t).toBe(1080)
    expect(layerUrl("l5-makes", 720)).not.toBe(layerUrl("l5-makes", 1080))
    expect(layerUrl("l5-makes", 720)).toMatch(/l5-makes/)
    expect(layerUrl("thirty", 720)).toBe(layerUrl("thirty", 1080))
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

  it("each file is cropped to its bbox (720 files to exactly 2/3 of it), and every bbox sits inside the poster", () => {
    for (const l of LAYERS) {
      const [x, y, w, h] = l.bbox
      expect(x >= 0 && y >= 0 && x + w <= POSTER.w && y + h <= POSTER.h, l.name).toBe(true)
      const svg = path.join(DIR, `${l.name}.svg`)
      if (LAYER_FILES.includes(`${l.name}.svg`)) {
        expect(readFileSync(svg, "utf8"), l.name).toContain(`viewBox="0 0 ${w} ${h}"`)
        continue
      }
      expect(webpSize(path.join(DIR, `${l.name}.webp`)), l.name).toEqual([w, h])
      expect(x % 3 === 0 && y % 3 === 0 && w % 3 === 0 && h % 3 === 0, `${l.name} bbox snaps to 3`).toBe(true)
      expect(webpSize(path.join(DIR, "720", `${l.name}.webp`)), `720/${l.name}`).toEqual([(w * 2) / 3, (h * 2) / 3])
    }
  })

  it("the title lockup is drawn as paths (no font, no text element), so its letters are the same on every device", () => {
    for (const n of ["thirty", "united"]) {
      const svg = readFileSync(path.join(DIR, `${n}.svg`), "utf8")
      expect(svg, n).toMatch(/<path /)
      expect(svg, n).not.toMatch(/<text|font-family/)
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

  it("the title lockup sits fully above Makes's hairline (poster y 315), THIRTY in y 50 to 180, UNITED in 196 to 276", () => {
    const box = (n: string) => LAYERS.find((l) => l.name === n)!.bbox
    const [, ty, , th] = box("thirty")
    const [, uy, , uh] = box("united")
    expect(ty).toBeGreaterThanOrEqual(50)
    expect(ty + th).toBeLessThanOrEqual(180)
    expect(uy).toBeGreaterThanOrEqual(196)
    expect(uy + uh).toBeLessThanOrEqual(276)
    expect(ANCHORS.title).toEqual({ top: ty, bottom: uy + uh })
    const hairline = Math.min(...["l5-makes", "l6-makes-wave", "l7-makes-signing"].map((n) => box(n)[1]))
    expect(hairline).toBeGreaterThan(ANCHORS.title.bottom)
  })

  it("the shirt quads, bank glows and anchors are in poster space; six code lamps sit on the bank 4 head", () => {
    const inPoster = ([x, y]: readonly [number, number]) => x >= 0 && x <= POSTER.w && y >= 0 && y <= POSTER.h
    for (const q of Object.values(QUADS)) for (const pt of q) expect(inPoster(pt)).toBe(true)
    expect(ANCHORS.banks).toHaveLength(4)
    for (const b of ANCHORS.banks) expect(inPoster([b.x, b.y])).toBe(true)
    // Each glow centre sits on its own bank's lit plate.
    for (const l of LAYERS.filter((l) => l.bank)) {
      const { x, y } = ANCHORS.banks[l.bank! - 1]
      const [bx, by, bw, bh] = l.bbox
      expect(x >= bx && x <= bx + bw && y >= by && y <= by + bh, l.name).toBe(true)
    }
    expect(ANCHORS.lamps).toHaveLength(6)
    const head = [968, 641, 84, 79] // the bank 4 head, measured on the lit plate
    for (const [x, y] of ANCHORS.lamps) expect(x >= head[0] && x <= head[0] + head[2] && y >= head[1] && y <= head[1] + head[3]).toBe(true)
  })

  it("never references the owner's reference images", () => {
    for (const f of files(DIR)) expect(readFileSync(f, "latin1"), f).not.toContain(REFS)
    const src = path.resolve(import.meta.dirname, "..")
    for (const f of files(src).filter((f) => /\.(tsx?|css|json|svg)$/.test(f)))
      expect(readFileSync(f, "utf8"), f).not.toContain(REFS)
  })
})
