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
  lamps: Point[]
  lampR: number
  title: { top: number; bottom: number }
}

// Every plate is its own hashed file under /assets (never inlined: the CSP allows data: images, but inlining
// would put the art in the entry chunk). A painted .webp beside a greybox .svg of the same name wins.
const FILES = import.meta.glob<string>("./layers/*.{webp,svg}", { eager: true, query: "?url&no-inline", import: "default" })

/** File name (with extension) per layer, for the manifest test. */
export const LAYER_FILES = Object.keys(FILES).map((p) => p.slice("./layers/".length))

export function layerUrl(name: string): string | undefined {
  return FILES[`./layers/${name}.webp`] ?? FILES[`./layers/${name}.svg`]
}
