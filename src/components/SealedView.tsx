import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { animate, m, useMotionValue, useTransform } from "motion/react"
import { cn } from "cn"
import { MapPin, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { StatusLine } from "@/components/StatusLine"
import { MISSING_KEY_MESSAGE } from "@/lib/inviteKey"
import { Ticket } from "@/components/Ticket"
import { useFocusOnMount } from "@/hooks/useFocusOnMount"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useTilt } from "@/hooks/useTilt"
import { haptic, HAPTICS, ticksBetween } from "@/lib/haptics"
import { getSoundOn, playTearSeparate, playTearTick, setSoundOn, unlockAudio } from "@/lib/sound"
import { forcedColors } from "@/lib/motionPrefs"
import { hasWebGL } from "@/lib/webgl"
import type { SettleFn } from "@/components/three/LanyardTicket"

// 3D lanyard ticket. Separate chunk, fetched once the sealed view is idle.
const LanyardTicket = lazy(() => import("@/components/three/LanyardTicket"))

export const HOST_LINE = "Thirty feels like half time. Come for the oranges."

// M5.2: the finish carries the hand's velocity; cancel snaps back; the stub flicks away.
const FINISH = { type: "spring", stiffness: 180, damping: 26 } as const
const CANCEL = { type: "spring", stiffness: 400, damping: 34 } as const
const SETTLE = { type: "spring", stiffness: 260, damping: 22 } as const
const FLICK = { duration: 0.42, delay: 0.2, ease: [0.4, 0, 1, 1] as const }
const STAGE_FADE_MS = 160 // stage-fade: the night cross-fades to paper while the 3D ticket cross-fades to the DOM one
const SEPARATE_MS = 200 // the moment the stub lets go: haptic, rip and the main half's settle
const THRESHOLD = 0.35
const HANDLE = 56
const INSET = 28 // keeps the handle clear of the punched notches
const TIP0 = INSET + HANDLE / 2 // the scissors tip when the tear has not started
const PEEL_DEG = 14 // in-plane rotation of the free part at full tear
const PEEL_Y_DEG = -22 // out-of-plane
const PEEL_Z = 24
const LABEL_HALF = 56 // half the height of the vertical label, with a margin
const LABEL_COL = 36 // the width of its column along the right edge
const span = (h: number) => Math.max(h - TIP0, 1)
const tipAt = (p: number, h: number) => TIP0 + p * span(h)

export function VenueTba() {
  return (
    <p className="helper m-0 flex items-center gap-2 text-ink-2">
      <span aria-hidden="true" className="inline-flex size-6 items-center justify-center border border-dashed border-ink-2">
        <MapPin className="size-4" strokeWidth={1.5} />
      </span>
      Venue TBA
    </p>
  )
}

/** Sealed ticket. Drag the handle down the perforation, or press "Tear open": same finish. */
export function SealedView({
  onTorn,
  focusHeading,
  missingKey = false,
  onStageEnd,
  staged = true,
}: {
  onTorn: () => void
  /** Called once when the night stage should fade to the paper page. */
  onStageEnd?: () => void
  /** Owned by the page: true while the night stage is up. */
  staged?: boolean
  focusHeading: boolean
  missingKey?: boolean
}) {
  const reduced = useReducedMotion()
  const headingRef = useFocusOnMount<HTMLHeadingElement>(focusHeading)
  const progress = useMotionValue(0)
  const flick = useMotionValue(0)
  const lift = useMotionValue(0)
  const mainScale = useMotionValue(1)
  const trackH = useMotionValue(0)
  const ticketRef = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const dragging = useRef<{ startY: number; startP: number; t: number; lastY: number; v: number } | null>(null)
  const interacted = useRef(false)
  const speed = useRef(1)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const [lanyard, setLanyard] = useState<"off" | "loading" | "ready">("off")
  const [boxed, setBoxed] = useState(false) // the 30rem stage box stays until the view is left, so nothing jumps at the hand-off
  const [domShown, setDomShown] = useState(false) // the DOM ticket cross-fades in over the 3D one
  const [peeling, setPeeling] = useState(false)
  const settleRef = useRef<SettleFn | null>(null)
  // 3D is for guests who can take motion and effects; WebGL is probed once per mount.
  const [glOk] = useState(hasWebGL)
  const canLanyard = !reduced && !missingKey && glOk && !forcedColors()
  const [sound, setSound] = useState(getSoundOn)
  // The 3D layer failed (chunk import rejected, or it threw while rendering): step down to the DOM ticket.
  const failLanyard = useCallback(() => {
    setLanyard("off")
    setBoxed(false)
    setDomShown(true)
  }, [])
  const tilt = useTilt(!reduced && lanyard !== "ready" && !peeling)

  // The free part above the scissors tip pivots at the tip; the real stub below it never moves.
  const tip = useTransform([progress, trackH], ([p, h]: number[]) => Math.round(tipAt(p, h)))
  // The vertical "ADMIT ONE" sits mid-edge. The free part keeps a tab down the right edge that carries the
  // whole label, so the tip never cuts through it; the held part has the matching notch.
  const heldClip = useTransform([tip, trackH], ([t, h]: number[]) => {
    const yb = Math.max(t, h / 2 + LABEL_HALF)
    return yb > t
      ? `polygon(0px ${t}px, calc(100% - ${LABEL_COL}px) ${t}px, calc(100% - ${LABEL_COL}px) ${yb}px, 100% ${yb}px, 100% 100%, 0px 100%)`
      : `inset(${t}px 0px 0px 0px)`
  })
  const freeClip = useTransform([tip, trackH], ([t, h]: number[]) => {
    const yb = Math.max(t, h / 2 + LABEL_HALF)
    return yb > t
      ? `polygon(0px 0px, 100% 0px, 100% ${yb}px, calc(100% - ${LABEL_COL}px) ${yb}px, calc(100% - ${LABEL_COL}px) ${t}px, 0px ${t}px)`
      : `inset(0px 0px ${Math.max(0, h - t)}px 0px)`
  })
  const freeOrigin = useTransform(tip, (t) => `0px ${t}px`)
  const freeRotate = useTransform([progress, flick], ([p, f]: number[]) => p * PEEL_DEG + f * 24)
  const freeRotateY = useTransform(progress, (p) => p * PEEL_Y_DEG)
  const freeZ = useTransform(progress, (p) => p * PEEL_Z)
  const freeX = useTransform(flick, (f) => f * 180)
  const freeY = useTransform(flick, (f) => f * 60)
  const freeScale = useTransform(flick, (f) => 1 - f * 0.04)
  const freeOpacity = useTransform(flick, (f) => (f <= 0.71 ? 1 : Math.max(0, (1 - f) / 0.29))) // falls only in the last 120 ms
  const handleY = useTransform([progress, trackH, lift], ([p, h, l]: number[]) => tipAt(p, h) - HANDLE / 2 - l)
  const handleOpacity = useTransform(progress, (p) => (p <= 0.6 ? 1 : Math.max(0, (1 - p) / 0.4)))

  useEffect(() => {
    const el = ticketRef.current
    if (!el) return
    const measure = () => trackH.set(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [trackH])

  // M6.3: no timer loop. One 4px lift of the handle at 2.5s if the guest has not touched the ticket.
  useEffect(() => {
    if (reduced || missingKey) return
    const t = setTimeout(() => {
      if (!interacted.current) animate(lift, [0, 4, 0], { duration: 0.5, ease: "easeInOut" })
    }, 2500)
    return () => clearTimeout(t)
  }, [reduced, missingKey, lift])

  // M4.1: a tick (haptic, and a rip if sound is on) each time the tip passes another 40px of travel.
  useEffect(() => {
    let last = 0
    const off = progress.on("change", (p) => {
      const tipPx = p * trackH.get()
      if (tipPx < last) last = tipPx
      const { count, next } = ticksBetween(last, tipPx)
      last = next
      for (let i = 0; i < count; i++) {
        haptic(HAPTICS.tick)
        playTearTick(speed.current)
      }
    })
    return off
  }, [progress, trackH])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  // Load the 3D layer after first paint, when idle. Never for reduced motion, forced colors, no key, or no WebGL.
  useEffect(() => {
    if (!canLanyard) return
    const go = () => setLanyard((s) => (s === "off" ? "loading" : s))
    const w = window as Window & { requestIdleCallback?: typeof requestIdleCallback; cancelIdleCallback?: typeof cancelIdleCallback }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(go, { timeout: 1500 })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = setTimeout(go, 600)
    return () => clearTimeout(t)
  }, [canLanyard])

  const endStage = useCallback(() => {
    onStageEnd?.()
  }, [onStageEnd])

  // Button or finished drag: settle the ticket, fade the stage to paper, then tear on the DOM ticket.
  const finish = useCallback(
    (velocity = 0) => {
      if (busy.current) return // a second press during the tear is absorbed
      busy.current = true
      interacted.current = true
      if (reduced) {
        endStage()
        onTorn()
        return
      }
      if (getSoundOn()) unlockAudio()
      setPeeling(true)
      const tear = () => {
        timers.current.push(
          setTimeout(() => {
            haptic(HAPTICS.separate)
            playTearSeparate()
            mainScale.set(1.02)
            animate(mainScale, 1, SETTLE)
          }, SEPARATE_MS),
        )
        Promise.all([animate(progress, 1, { ...FINISH, velocity }), animate(flick, 1, FLICK)]).then(() => onTorn())
      }
      const wait = (ms: number, then: () => void) => timers.current.push(setTimeout(then, ms))
      const rect = ticketRef.current?.getBoundingClientRect()
      if (lanyard === "ready" && settleRef.current && rect) {
        let resized = false
        const onResize = () => (resized = true)
        window.addEventListener("resize", onResize)
        // A resize mid-hand-off cannot align the two tickets: swap instantly instead of cross-fading.
        settleRef.current(rect).then(() => {
          window.removeEventListener("resize", onResize)
          setDomShown(true)
          endStage()
          wait(resized ? 0 : STAGE_FADE_MS, () => {
            setLanyard("off")
            tear()
          })
        })
        return
      }
      setLanyard("off") // not shown yet, or no 3D: the DOM ticket is already there
      setDomShown(true) // (and if the stage box is up but the hand-off is unavailable, un-hide the DOM ticket)
      endStage()
      if (progress.get() > 0) tear() // a drag already tore along: the stage fades as the hand lets go
      else wait(STAGE_FADE_MS, tear) // pressed: the night fades to paper first, then the tear
    },
    [onTorn, progress, flick, mainScale, reduced, lanyard, endStage],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy.current) return
    interacted.current = true
    if (getSoundOn()) unlockAudio() // a gesture: the only moment the audio context may start
    setPeeling(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragging.current = { startY: e.clientY, startP: progress.get(), t: e.timeStamp, lastY: e.clientY, v: 0 }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragging.current
    if (!d) return
    progress.set(Math.min(1, Math.max(0, d.startP + (e.clientY - d.startY) / span(trackH.get()))))
    const dt = e.timeStamp - d.t
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt
    speed.current = Math.abs(d.v)
    d.t = e.timeStamp
    d.lastY = e.clientY
  }
  const onPointerUp = () => {
    const d = dragging.current
    dragging.current = null
    if (!d) return
    speed.current = 1
    const flicked = d.v > 1.2 // px per ms, downward
    if (progress.get() >= THRESHOLD || (flicked && progress.get() > 0.1)) {
      finish(Math.min(20, Math.max(0, (d.v * 1000) / span(trackH.get())))) // px/ms to progress per second
    } else {
      animate(progress, 0, CANCEL).then(() => {
        if (!busy.current) setPeeling(false)
      })
    }
  }

  const toggleSound = () => {
    const next = !sound
    setSoundOn(next)
    if (next) unlockAudio() // created on this tap, never earlier
    setSound(next)
  }

  // DOM mode: the Sound tab sits 8px above the ticket's top rule (the +0.5rem in its translate), clear of the corner.
  // Stage chrome only once the stage box is up. While the chunk loads the DOM ticket is still in flow, so the tab stays above it.
  const in3d = boxed

  return (
    <section aria-labelledby="sealed-title" className="flex flex-col items-center gap-8 pt-10">
      <div className={cn("relative w-full", boxed && "h-[min(30rem,60svh)]")}>
      {!reduced && !missingKey && (
        <div className={cn("pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto max-w-[960px]", in3d && "flex justify-end")}>
          <button
            type="button"
            aria-pressed={sound}
            title="Sound plays through the speaker. A phone on silent stays quiet."
            onClick={toggleSound}
            className={cn(
              "label-tab stage-tab pointer-events-auto relative inline-block border px-3 py-1 transition-opacity duration-160 before:absolute before:-inset-x-2 before:-inset-y-3 before:content-['']",
              in3d
                ? "mr-4 mt-2 border-paper md:mr-10"
                : "ml-4 -translate-y-[calc(100%+0.5rem)] border-ink md:ml-10",
              in3d && !staged && "pointer-events-none opacity-0",
              in3d && staged
                ? sound
                  ? "bg-paper text-ink"
                  : "bg-scene-night-mid text-paper"
                : sound
                  ? "bg-ink text-paper-raised"
                  : "bg-paper-raised text-ink",
            )}
          >
            Sound <span aria-hidden="true">{sound ? "on" : "off"}</span>
          </button>
        </div>
      )}
      {/* The DOM ticket stays in the accessibility tree; it is only visually replaced by the canvas. */}
      <div
        className={cn(
          boxed && "pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2",
          boxed && "transition-opacity duration-160 ease-(--ease-fade)",
          boxed && !domShown && "opacity-0",
        )}
      >
      <Ticket
        ticketRef={ticketRef}
        tilt={tilt}
        lit={staged && !peeling}
        mainStyle={{ scale: mainScale, transformOrigin: "100% 50%" }}
        peel={
          peeling && !reduced
            ? {
                heldStyle: { clipPath: heldClip },
                freeStyle: {
                  clipPath: freeClip,
                  transformOrigin: freeOrigin,
                  transformPerspective: 1100,
                  rotate: freeRotate,
                  rotateY: freeRotateY,
                  z: freeZ,
                  x: freeX,
                  y: freeY,
                  scale: freeScale,
                  opacity: freeOpacity,
                },
              }
            : undefined
        }
        mainClassName="flex min-h-[15rem] flex-col justify-between gap-4 p-4 md:min-h-[26rem] md:gap-8 md:p-10"
        stubClassName="flex flex-col"
        main={
          <>
            <p className="data-stub m-0">21 DEC 2026</p>
            <h1
              id="sealed-title"
              ref={headingRef}
              tabIndex={-1}
              className="display-ticket m-0 [overflow-wrap:anywhere]"
            >
              Thirty United
            </h1>
            <div className="flex flex-col gap-2">
              <p className="standfirst m-0">{HOST_LINE}</p>
              <p className="helper m-0">Makes</p>
            </div>
            <VenueTba />
          </>
        }
        stubEdge={
          <span aria-hidden="true" className="data-label absolute top-1/2 right-2 -translate-y-1/2 rotate-180 text-ink-2 [writing-mode:vertical-rl]">
            ADMIT ONE
          </span>
        }
        stub={
          <div className="relative flex h-full flex-col items-center justify-center gap-1 p-3 pr-10 text-center">
            <span className="data-label text-ink-2">SEAT</span>
            <span className="data-stub text-muted-foreground">
              ---
            </span>
          </div>
        }
      >
        {!reduced && !missingKey && (
          <m.div
            data-testid="tear-handle"
            data-tilt-ignore=""
            aria-hidden="true"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ y: handleY, opacity: handleOpacity, touchAction: "none", height: HANDLE }}
            className="absolute top-0 right-(--stub-w) z-10 w-11 translate-x-1/2 cursor-grab touch-none items-center justify-center"
          >
            <div className="mx-auto flex h-full w-6 items-center justify-center border border-ink bg-paper-raised">
              <Scissors className="size-4 rotate-90" strokeWidth={1.5} />
            </div>
          </m.div>
        )}
      </Ticket>
      </div>
      {lanyard !== "off" && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-1/2 h-[min(30rem,60svh)] -translate-y-1/2",
            "transition-opacity duration-160 ease-(--ease-fade)",
            (lanyard !== "ready" || domShown) && "pointer-events-none opacity-0",
          )}
        >
          <ErrorBoundary fallback={null} onError={failLanyard}>
          <Suspense fallback={null}>
            <LanyardTicket
              hostLine={HOST_LINE}
              settleRef={settleRef}
              onReady={() => {
                setLanyard("ready")
                setBoxed(true)
              }}
              onFail={failLanyard}
            />
          </Suspense>
          </ErrorBoundary>
        </div>
      )}
      </div>
      {missingKey ? (
        <StatusLine className="stage-status max-w-sm justify-center text-center md:max-w-none">{MISSING_KEY_MESSAGE}</StatusLine>
      ) : (
        <Button type="button" onClick={() => finish()} className="w-full max-w-sm md:w-auto md:min-w-64">
          <Scissors aria-hidden="true" />
          Tear open
        </Button>
      )}
    </section>
  )
}
