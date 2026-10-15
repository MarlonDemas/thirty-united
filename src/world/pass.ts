import { useSyncExternalStore, type MutableRefObject } from "react"
import { POSTER } from "@/world/layers"

/**
 * The lanyard pass inside the world canvas (B2, phase 5). The sealed view owns the tear; the world canvas owns the
 * one WebGL context. This bridge is how the sealed view asks the world to hang the pass, and how the pass hands the
 * tear back (`settleRef`). Plain data and a tiny store: no three, so it stays in the entry chunk at no cost.
 */

/** Brings the ticket face-front over the DOM ticket's rect in about 400 ms, input locked. Resolves when at rest. */
export type SettleFn = (domRect: DOMRect) => Promise<void>

export type PassRequest = {
  hostLine: string
  /** The pass's box on screen (from the top of the frame to the bottom of the pass zone). Never takes the pointer. */
  host: HTMLElement
  /** Follows the card on screen and takes its pointer (touch-action none), so a drag on the pass is never parallax. */
  hit: HTMLElement
  settleRef: MutableRefObject<SettleFn | null>
  /** The pass shows (fades in); false fades it out (the DOM pass has taken over). */
  shown: boolean
  /** The pass is drawn and the world canvas is up: the stage may hand over to it. */
  onReady: () => void
  /** The pass could not be drawn (its textures failed). */
  onFail: () => void
  /** The pass left the world canvas (the canvas unmounted: hidden tab, demotion, failure). */
  onGone: () => void
}

let current: PassRequest | null = null
const listeners = new Set<() => void>()

export function setPass(next: PassRequest | null) {
  if (next === current) return
  current = next
  listeners.forEach((l) => l())
}

/** Clears the request only if it is still this one (a newer one may already have replaced it). */
export function clearPass(mine: PassRequest) {
  if (current === mine) setPass(null)
}

export function getPass(): PassRequest | null {
  return current
}

function subscribePass(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function usePass(): PassRequest | null {
  return useSyncExternalStore(subscribePass, getPass, getPass)
}

type Box = { left: number; top: number; width: number; height: number }

/**
 * Where a screen box (the pass's host) lands in poster px, given the world canvas's on-screen rect. The canvas is laid
 * out at POSTER.w x POSTER.h CSS px and the shot only translates and scales it, so one factor maps both axes.
 */
export function posterRect(canvas: Box, host: Box): { x0: number; y0: number; x1: number; y1: number } | null {
  if (!(canvas.width > 0) || !(host.width > 0) || !(host.height > 0)) return null
  const k = canvas.width / POSTER.w
  const x0 = (host.left - canvas.left) / k
  const y0 = (host.top - canvas.top) / k
  return { x0, y0, x1: x0 + host.width / k, y1: y0 + host.height / k }
}

/** The pass never draws at more pixels per CSS px than its own canvas did (`dpr={[1, 1.5]}`): same cost as built. */
export const PASS_MAX_DPR = 1.5

/**
 * The pass's target for a box `r` in poster px, on a world canvas of `dpr` canvas px per poster px shown at `k` CSS px
 * per poster px. Up to PASS_MAX_DPR the box snaps to whole canvas pixels and one texel lands on one canvas pixel (one
 * resample, canvas to screen, as the pass's own canvas had). A denser canvas gets the as-built PASS_MAX_DPR target.
 */
export function passTarget(r: { x0: number; y0: number; x1: number; y1: number }, dpr: number, k: number) {
  if (dpr / k > PASS_MAX_DPR) {
    const w = Math.max(1, Math.round((r.x1 - r.x0) * k * PASS_MAX_DPR))
    const h = Math.max(1, Math.round((r.y1 - r.y0) * k * PASS_MAX_DPR))
    return { rect: r, w, h }
  }
  const x0 = Math.round(r.x0 * dpr)
  const y0 = Math.round(r.y0 * dpr)
  const w = Math.max(1, Math.round(r.x1 * dpr) - x0)
  const h = Math.max(1, Math.round(r.y1 * dpr) - y0)
  return { rect: { x0: x0 / dpr, y0: y0 / dpr, x1: (x0 + w) / dpr, y1: (y0 + h) / dpr }, w, h }
}

/** The pass's cross-fade with the DOM pass (160 ms, as the stage fade). Linear in time; returns the new opacity. */
export const PASS_FADE_MS = 160

export function fadeToward(opacity: number, target: number, dtMs: number): number {
  const step = Math.max(0, dtMs) / PASS_FADE_MS
  return target > opacity ? Math.min(target, opacity + step) : Math.max(target, opacity - step)
}

/** The smallest screen box around some projected points (the card's corners), or null with none. */
export function boundsOf(points: readonly (readonly [number, number])[]): Box | null {
  if (!points.length) return null
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [x, y] of points) {
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 }
}
