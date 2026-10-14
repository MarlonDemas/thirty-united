import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { animate, m, useMotionValue, useTransform } from "motion/react"
import { cn } from "cn"
import { MapPin, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusLine } from "@/components/StatusLine"
import { MISSING_KEY_MESSAGE } from "@/lib/inviteKey"
import { Ticket } from "@/components/Ticket"
import { useFocusOnMount } from "@/hooks/useFocusOnMount"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { hasWebGL } from "@/lib/webgl"

// SPIKE: 3D lanyard ticket. Separate chunk, fetched only once the sealed view is idle.
const LanyardTicket = lazy(() => import("@/components/three/LanyardTicket"))

export const HOST_LINE = "Thirty feels like half time. Come for the oranges."

const FINISH = { duration: 0.7, ease: [0.33, 1, 0.68, 1] as const }
const CANCEL = { duration: 0.2, ease: [0.33, 1, 0.68, 1] as const }
const THRESHOLD = 0.35
const HANDLE = 56
const INSET = 28 // keeps the handle clear of the punched notches
const span = (h: number) => Math.max(h - HANDLE - INSET * 2, 1)

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
}: {
  onTorn: () => void
  focusHeading: boolean
  missingKey?: boolean
}) {
  const reduced = useReducedMotion()
  const headingRef = useFocusOnMount<HTMLHeadingElement>(focusHeading)
  const progress = useMotionValue(0)
  const hint = useMotionValue(0)
  const trackH = useMotionValue(0)
  const ticketRef = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const dragging = useRef<{ startY: number; startP: number; t: number; lastY: number; v: number } | null>(null)
  const interacted = useRef(false)
  const [lanyard, setLanyard] = useState<"off" | "loading" | "ready">("off")

  const rotate = useTransform([progress, hint], ([p, h]: number[]) => -p * 12 - h)
  const x = useTransform(progress, (p) => p * 16)
  const opacity = useTransform(progress, (p) => (p <= 0.6 ? 1 : Math.max(0, (1 - p) / 0.4)))
  const handleY = useTransform([progress, trackH], ([p, h]: number[]) => INSET + p * span(h))
  const handleOpacity = useTransform(progress, (p) => (p <= 0.6 ? 1 : Math.max(0, (1 - p) / 0.4)))

  useEffect(() => {
    const el = ticketRef.current
    if (!el) return
    const measure = () => trackH.set(el.getBoundingClientRect().height)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [trackH])

  // Idle hint: after 3s the stub edge lifts a little, at most twice, then still.
  useEffect(() => {
    if (reduced) return
    let count = 0
    let timer: ReturnType<typeof setTimeout>
    let running: ReturnType<typeof animate> | undefined
    const schedule = () => {
      timer = setTimeout(() => {
        if (interacted.current || count >= 2) return
        count += 1
        running = animate(hint, [0, 1.5, 0], { duration: 0.6, ease: "easeInOut" })
        running.then(schedule)
      }, 3000)
    }
    schedule()
    return () => {
      clearTimeout(timer)
      running?.stop()
    }
  }, [reduced, hint])

  // SPIKE: load the 3D layer after first paint, when idle. Never for reduced motion, no key, or no WebGL.
  useEffect(() => {
    if (reduced || missingKey || !hasWebGL()) {
      setLanyard("off")
      return
    }
    const go = () => setLanyard((s) => (s === "off" ? "loading" : s))
    const w = window as Window & { requestIdleCallback?: typeof requestIdleCallback; cancelIdleCallback?: typeof cancelIdleCallback }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(go, { timeout: 1500 })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = setTimeout(go, 600)
    return () => clearTimeout(t)
  }, [reduced, missingKey])

  const finish = useCallback(() => {
    if (busy.current) return // a second press during the tear is absorbed
    busy.current = true
    interacted.current = true
    setLanyard("off") // the DOM ticket takes over for the tear
    if (reduced) {
      onTorn()
      return
    }
    animate(progress, 1, FINISH).then(() => onTorn())
  }, [onTorn, progress, reduced])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy.current) return
    interacted.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragging.current = { startY: e.clientY, startP: progress.get(), t: e.timeStamp, lastY: e.clientY, v: 0 }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragging.current
    if (!d) return
    progress.set(Math.min(1, Math.max(0, d.startP + (e.clientY - d.startY) / span(trackH.get()))))
    const dt = e.timeStamp - d.t
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt
    d.t = e.timeStamp
    d.lastY = e.clientY
  }
  const onPointerUp = () => {
    const d = dragging.current
    dragging.current = null
    if (!d) return
    const flick = d.v > 1.2 // px per ms, downward
    if (progress.get() >= THRESHOLD || (flick && progress.get() > 0.1)) finish()
    else animate(progress, 0, CANCEL)
  }

  return (
    <section aria-labelledby="sealed-title" className="flex flex-col items-center gap-8">
      <div className={cn("relative w-full", lanyard === "ready" && "h-[min(30rem,60svh)]")}>
      {/* The DOM ticket stays in the accessibility tree; it is only visually replaced by the canvas. */}
      <div className={cn(lanyard === "ready" && "pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0")}>
      <Ticket
        ticketRef={ticketRef}
        stubStyle={reduced ? undefined : { rotate, x, opacity }}
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
        stub={
          <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center">
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
            lanyard !== "ready" && "pointer-events-none opacity-0",
          )}
        >
          <Suspense fallback={null}>
            <LanyardTicket hostLine={HOST_LINE} onReady={() => setLanyard("ready")} onFail={() => setLanyard("off")} />
          </Suspense>
        </div>
      )}
      </div>
      {missingKey ? (
        <StatusLine className="max-w-sm justify-center text-center md:max-w-none">{MISSING_KEY_MESSAGE}</StatusLine>
      ) : (
        <Button type="button" onClick={finish} className="w-full max-w-sm md:w-auto md:min-w-64">
          <Scissors aria-hidden="true" />
          Tear open
        </Button>
      )}
    </section>
  )
}
