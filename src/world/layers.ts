import manifest from "@/world/layers/layers.json"
import type { Tier } from "@/world/tier"

/** Poster space: every plate, quad and shot is in these pixels. */
export const POSTER = manifest.poster as { w: 1080; h: 1920 }

export type Point = readonly [number, number]
export type Quad = readonly [Point, Point, Point, Point]

export type Layer = {
  /** The file name without extension, exactly as the painted WebP will be named. */
  name: string
  /** Back to front. Layers with the same z never overlap in a way that matters. */
  z: number
  /** [x, y, w, h] in poster px. The file is cropped to this box. */
  bbox: readonly [number, number, number, number]
  /** The floodlight bank this layer lights (1 to 4), or null. */
  bank: 1 | 2 | 3 | 4 | null
  /** Tiers whose still layer draws it. */
  tiers: readonly Tier[]
  /** 0 far to 1 near: touch-drag parallax travel. */
  depth: number
}

export const LAYERS = manifest.layers as unknown as Layer[]
export const QUADS = manifest.quads as unknown as Record<"l8-shirt" | "l7-makes-signing", Quad>
export const ANCHORS = manifest.anchors as unknown as {
  face: { x: number; y: number; r: number }
  moon: { x: number; y: number; r: number }
  /**
   * Banks 1 to 4: the lamp-core centre on each tower head (measured on the lit plate), the glow's radius, and its
   * z (bank 3's head sits behind the hanging shirt, so its glow is drawn over the shirt, as light through cloth).
   */
  banks: { x: number; y: number; r: number; z: number }[]
  lamps: Point[]
  lampR: number
  title: { top: number; bottom: number }
}

// Every plate is its own hashed file under /assets (never inlined: the CSP allows data: images, but inlining
// would put the art in the entry chunk). Only URLs land in the bundle; a file is fetched when an <img> asks.
// Plates are WebP, 1080 wide in layers/ and 720 wide in layers/720/; the title lockups are SVG (one size).
const FILES = import.meta.glob<string>(["./layers/*.{webp,svg}", "./layers/720/*.webp"], {
  eager: true,
  query: "?url&no-inline",
  import: "default",
})

/** File paths under layers/ (with extension, 720/ prefixed), for the manifest test. */
export const LAYER_FILES = Object.keys(FILES).map((p) => p.slice("./layers/".length))

/** Which plate set a session draws: 720 wide on T1 (Poster, the low-end rung), 1080 everywhere else. */
export type PlateSet = 1080 | 720
export const plateSetFor = (tier: Tier): PlateSet => (tier === "T1" ? 720 : 1080)

/** The layer's file at this plate set. A layer with no 720 file (the SVG title lockups) uses its one file. */
export function layerUrl(name: string, set: PlateSet = 1080): string | undefined {
  return (set === 720 ? FILES[`./layers/720/${name}.webp`] : undefined) ?? FILES[`./layers/${name}.webp`] ?? FILES[`./layers/${name}.svg`]
}
