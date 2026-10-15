import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Stamp } from "@/components/Stamp"
import type { Attending } from "@/lib/schemas/rsvp"
import { banksFor, poseFor, shirtHangs, type Beat, type Pose } from "@/world/beats"
import { ANCHORS } from "@/world/layers"
import { StillLayer } from "@/world/StillLayer"
import { placementFor, placeShot, SHOTS, STAMP_LIVE, toScreen, type Layout } from "@/world/shots"
import { demote, isStillTier, isWebGLTier, useTier } from "@/world/tier"

// Phase 4: the WebGL world. Its own chunk, fetched only on T3 and T2.
const WorldCanvas = lazy(() => import("@/world/WorldCanvas"))

/** The finale on T1: the stamp lands at 1800 ms (tokens.md beat timings). T0 shows the final state at once. */
export const STAMP_AT_MS = 1800

/** Plates fetched ahead of the beat that shows them, so a pose change is a cross-fade, not a pop-in. */
const PRELOAD: Partial<Record<Beat, Pose[]>> = { chapter1: ["l6-makes-wave"], code: ["l7-makes-signing"] }

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

  const p = placementFor(beat, attending, layout, vvTop)
  const banks = banksFor(beat, attending)
  const hangs = shirtHangs(beat, attending)
  const signed = beat === "signed"
  const stampOn = useDelayed(signed, t0 ? 0 : STAMP_AT_MS)
  const { frame } = layout

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
      ? { right: STAMP_LIVE.right, bottom: frame.h - layout.panelTop + STAMP_LIVE.abovePanel }
      : { right: STAMP_LIVE.right, bottom: STAMP_LIVE.right }

  return (
    <div
      aria-hidden="true"
      className="world"
      data-beat={beat}
      data-tier={tier}
      data-still={still}
      data-reframe={last.reframe}
      data-testid="world-stage"
    >
      <div className="world-frame" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}>
        <div className="poster" style={{ transform: `translate(${p.tx}px, ${p.ty}px) scale(${p.s})` }}>
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
          />
        </div>
        <div className="world-vignette" />
        <div ref={zoneRef} className="pass-zone" style={zoneStyle} hidden={beat !== "cover"} />
        {stampOn && attending !== "no" && (
          <div className="world-stamp" style={stampStyle}>
            <Stamp variant={attending === "maybe" ? "maybe" : "yes"} />
          </div>
        )}
        {isWebGLTier(tier) && (
          <ErrorBoundary fallback={null} onError={() => demote("T1", "world canvas failed")}>
            <Suspense fallback={null}>
              <WorldCanvas beat={beat} />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}
