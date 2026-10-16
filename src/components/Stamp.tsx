import { useEffect, useRef } from "react"
import { m } from "motion/react"
import { Pencil } from "lucide-react"
import { cn } from "cn"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { haptic, HAPTICS } from "@/lib/haptics"
import { playStamp } from "@/lib/sound"

// M4.2: lands as an impact. Contact is about 90 ms in; Maybe uses the same impact at 70% of the travel.
const IMPACT_MS = 90
const LAND = { type: "spring", stiffness: 900, damping: 32, mass: 0.6 } as const
const FROM = {
  yes: { opacity: 0, scale: 1.7, rotate: -9 },
  maybe: { opacity: 0, scale: 1.49, rotate: -7.5 },
} as const

export type StampVariant = "yes" | "maybe"

/**
 * The signing stamp, rotated -4deg, in the world over the finale (aria-hidden there: its meaning is the panel's
 * heading). Yes is solid poster red with panel-dark words (white on poster red is 4.04:1, so no white text sits on it),
 * "SIGNED · 21 DEC 2026". Maybe is a panel-filled outline with a pencil,
 * "PENCILLED IN", so the two differ by shape, words and icon, not colour alone. It lands with an impact (spring,
 * haptic, optional sound) and calls `onImpact` at contact; reduced motion shows it in place with none of it.
 * Placed twice (CHOSEN.md): live by WorldStage (`STAMP_LIVE`), on the exported poster by the compositor (`STAMP_POSTER`, src/poster/layout.ts).
 */
export function Stamp({ variant, className, onImpact }: { variant: StampVariant; className?: string; onImpact?: () => void }) {
  const reduced = useReducedMotion()
  const maybe = variant === "maybe"
  const impact = useRef(onImpact)
  useEffect(() => {
    impact.current = onImpact
  })

  useEffect(() => {
    if (reduced) return
    const t = setTimeout(() => {
      haptic(maybe ? HAPTICS.stampSoft : HAPTICS.stamp)
      playStamp()
      impact.current?.()
    }, IMPACT_MS)
    return () => clearTimeout(t)
  }, [reduced, maybe])
  return (
    <m.div
      initial={reduced ? false : FROM[variant]}
      animate={{ opacity: 1, scale: 1, rotate: -4 }}
      transition={{ default: LAND, opacity: { duration: 0.05 } }}
      className={cn("relative inline-flex w-fit max-w-full", className)}
    >
      {/* Contact shadow: a sibling of the masked face so the speckle mask cannot clip it. It lands at contact. */}
      <m.span
        aria-hidden="true"
        className="stamp-shadow"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.08, delay: IMPACT_MS / 1000 }}
      />
      <div
        data-variant={variant}
        className={cn(
          "stamp-worn inline-flex w-fit max-w-full border-2 p-1 forced-colors:border-[CanvasText]",
          maybe ? "border-foreground bg-panel text-foreground" : "border-poster-red bg-poster-red text-panel",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center gap-2 border px-3 py-1 text-center font-display text-2xl leading-7 font-bold tracking-[0.06em] whitespace-nowrap uppercase",
            maybe ? "border-foreground" : "border-panel",
          )}
        >
          {maybe ? (
            <>
              <Pencil aria-hidden="true" className="size-5" strokeWidth={2} />
              <span>Pencilled in</span>
            </>
          ) : (
            <>
              <span>Signed</span>
              <span aria-hidden="true">·</span>
              <span className="sr-only">, </span>
              <span>21 Dec 2026</span>
            </>
          )}
        </div>
      </div>
    </m.div>
  )
}
