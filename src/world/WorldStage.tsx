import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Stamp } from "@/components/Stamp"
import type { Attending } from "@/lib/schemas/rsvp"
import { banksFor, poseFor, shirtHangs, type Beat, type Pose } from "@/world/beats"
import { ANCHORS, LAYERS, layerUrl } from "@/world/layers"
import { parallaxDepth } from "@/world/parallax"
import { OVER_CANVAS_Z, StillLayer, type GLPhase } from "@/world/StillLayer"
import { placementFor, placeShot, SHOTS, STAMP_LIVE, toScreen, type Layout } from "@/world/shots"
import { demote, isStillTier, isWebGLTier, useTier } from "@/world/tier"

// Phase 4: the WebGL world. Its own chunk, fetched only on T3 and T2; drawn inside the poster, so the shot carries it.
const WorldCanvas = lazy(() => import("@/world/WorldCanvas"))

/** The finale on T1: the stamp lands at 1800 ms (tokens.md beat timings). T0 shows the final state at once. */
export const STAMP_AT_MS = 1800

/**
 * The signing is two shots: wide while every bank fires (the ignition starts at 1400 ms and runs 600 ms, index.css),
 * then the push-in to the face-and-shirt framing (1200 ms, `--dur-push-in`), so the finale ends at 3200 ms.
 * T0 cuts straight to the final framing with the banks already lit.
 */
export const SIGNED_PUSH_AT_MS = 2000

/** The title lockup (THIRTY, UNITED). On T3 and T2 the cover draws a second copy in front of the lanyard. */
const TITLE = LAYERS.filter((l) => l.name === "thirty" || l.name === "united")

/** Plates fetched ahead of the beat that shows them, so a pose change is a cross-fade, not a pop-in. */
const PRELOAD: Partial<Record<Beat, Pose[]>> = { chapter1: ["l6-makes-wave"], code: ["l7-makes-signing"] }

/** The world canvas cross-fades in over the DOM plates (then they hide under it). */
export const GL_FADE_MS = 400

const subscribeVisibility = (l: () => void) => {
  document.addEventListener("visibilitychange", l)
  return () => document.removeEventListener("visibilitychange", l)
}
const pageHidden = () => document.visibilityState === "hidden"
/** Hidden tab: the world canvas lets go of its textures (tokens.md, ambient); the still layer covers the rebuild. */
const usePageHidden = () => useSyncExternalStore(subscribeVisibility, pageHidden, () => false)

function useDelayed(on: boolean, ms: number) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!on || ms === 0) return
    const id = setTimeout(() => setReady(true), ms)
    return () => {
      clearTimeout(id)
      setReady(false)
    }
  }, [on, ms])
  return on && (ms === 0 || ready)
}

/**
 * The world behind every beat: aria-hidden, a sibling of <main>. Always renders the still layer (the DOM poster),
 * and on T3 and T2 the lazy world canvas over it (phase 4). Owns the shot, the lit banks, the pose and the shirt.
 */
export function WorldStage({
  beat,
  attending,
  layout,
  vvTop,
  shirtName,
  shirtNumber,
  digits,
  passSlot,
}: {
  beat: Beat
  attending?: Attending
  layout: Layout
  vvTop: number
  shirtName: string
  shirtNumber: string | null
  /** Code digits typed: the lamps mirror them. */
  digits: number
  /** The sealed view portals the lanyard pass into this element. */
  passSlot: HTMLElement
}) {
  const { tier, still } = useTier()
  const t0 = isStillTier(tier)
  const zoneRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    zoneRef.current?.appendChild(passSlot)
  }, [passSlot])

  const pose = poseFor(beat, attending)
  const [mounted, setMounted] = useState<string[]>(["l5-makes"])
  const want = [pose, ...(PRELOAD[beat] ?? []), ...(beat !== "cover" ? ["l8-shirt"] : [])]
  if (want.some((n) => !mounted.includes(n))) setMounted([...new Set([...mounted, ...want])])

  // A keyboard toggle reframes at panel speed; a beat change is a push.
  const [last, setLast] = useState({ beat, keyboard: layout.keyboard, reframe: "push" as "push" | "quick" })
  if (last.beat !== beat || last.keyboard !== layout.keyboard)
    setLast({ beat, keyboard: layout.keyboard, reframe: last.beat !== beat ? "push" : "quick" })

  const banks = banksFor(beat, attending)
  const hangs = shirtHangs(beat, attending)
  const signed = beat === "signed"
  const stampOn = useDelayed(signed, t0 ? 0 : STAMP_AT_MS)
  const pushed = useDelayed(signed, t0 ? 0 : SIGNED_PUSH_AT_MS)
  const wide = signed && !pushed
  const p = placementFor(beat, attending, layout, vvTop, wide)
  const { frame } = layout
  const posterTransform = `translate(${p.tx}px, ${p.ty}px) scale(${p.s})`
  const titleFront = beat === "cover" && isWebGLTier(tier)

  // The world canvas: mounted on T3 and T2 while the tab is visible. It reports its first frame, fades in over the
  // DOM plates, then they hide under it (index.css, `data-gl`). Unmounted, it is off again and the DOM is the world.
  const hidden = usePageHidden()
  const glOn = isWebGLTier(tier) && !hidden
  const [gl, setGl] = useState<GLPhase>("off")
  if (!glOn && gl !== "off") setGl("off")
  const onGlReady = useCallback(() => setGl((g) => (g === "off" ? "fading" : g)), [])
  useEffect(() => {
    if (gl !== "fading") return
    const id = setTimeout(() => setGl("live"), GL_FADE_MS)
    return () => clearTimeout(id)
  }, [gl])

  // The pass sits between Makes's face and the panel at the cover shot, outside the transformed poster.
  const cover = layout.mode === "desktop" ? p : placeShot(SHOTS.cover, frame)
  const faceBottom = toScreen(cover, [ANCHORS.face.x, ANCHORS.face.y + ANCHORS.face.r])[1]
  const zoneTop = Math.round(faceBottom + 16)
  const zoneBottom = layout.mode === "phone" ? layout.panelTop - 12 : Math.min(frame.h - 16, zoneTop + frame.h * 0.42)
  const zoneStyle = {
    left: 16,
    right: 16,
    top: zoneTop,
    height: Math.max(0, zoneBottom - zoneTop),
    "--zone-top": `${zoneTop}px`,
  } as CSSProperties

  const stampStyle: CSSProperties =
    layout.mode === "phone"
      ? { left: STAMP_LIVE.right, right: STAMP_LIVE.right, bottom: frame.h - layout.panelTop + STAMP_LIVE.abovePanel }
      : { left: STAMP_LIVE.right, right: STAMP_LIVE.right, bottom: STAMP_LIVE.right }

  return (
    <div
      aria-hidden="true"
      className="world"
      data-beat={beat}
      data-tier={tier}
      data-still={still}
      data-reframe={last.reframe}
      data-wide={wide}
      data-title-front={titleFront}
      data-gl={gl}
      data-testid="world-stage"
    >
      <div className="world-frame" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}>
        <div className="poster" style={{ transform: posterTransform }}>
          {glOn && (
            <ErrorBoundary fallback={null} onError={() => demote("T1", "world canvas failed")}>
              <Suspense fallback={null}>
                <WorldCanvas
                  beat={beat}
                  attending={attending}
                  tier={tier}
                  still={still}
                  mounted={mounted}
                  frame={frame}
                  live={gl === "live"}
                  onReady={onGlReady}
                />
              </Suspense>
            </ErrorBoundary>
          )}
          <StillLayer
            tier={tier}
            still={still}
            beat={beat}
            pose={pose}
            mounted={mounted}
            banks={banks}
            hangs={hangs}
            shirtName={shirtName}
            shirtNumber={shirtNumber}
            digits={digits}
            gl={gl}
          />
          {/* finale-dim: the held breath before the ignition, on the WebGL tiers (index.css). */}
          {signed && isWebGLTier(tier) && <div className="world-dim" />}
        </div>
        <div className="world-vignette" />
        <div ref={zoneRef} className="pass-zone" style={zoneStyle} hidden={beat !== "cover"} />
        {/* The lanyard cord hangs through THIRTY. The poster is one stacking context under the pass zone, so a
            second copy of the title over the zone puts the letters in front of the cord (and of a card lifted that
            high): the cord reads as passing behind them. Same transform and transition as the poster, so the copies
            never part, and the poster's own copy is hidden meanwhile (one title, no doubled edges); it never takes the
            pointer. Only where the lanyard can hang: the cover on T3 and T2. */}
        {titleFront && (
          <div className="poster poster-front" data-testid="title-front" style={{ transform: posterTransform }}>
            {TITLE.map((l) => (
              <img
                key={l.name}
                src={layerUrl(l.name)}
                alt=""
                draggable={false}
                decoding="async"
                data-layer={l.name}
                className={l.name === "united" ? "layer layer-united par" : "layer par"}
                style={
                  {
                    left: l.bbox[0],
                    top: l.bbox[1],
                    width: l.bbox[2],
                    height: l.bbox[3],
                    zIndex: OVER_CANVAS_Z,
                    "--par-d": parallaxDepth(l.name, l.depth, tier),
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
        {stampOn && attending !== "no" && (
          <div className="world-stamp" style={stampStyle}>
            <Stamp variant={attending === "maybe" ? "maybe" : "yes"} />
          </div>
        )}
      </div>
    </div>
  )
}
