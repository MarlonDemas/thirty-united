import { useEffect, useRef } from "react"
import { m } from "motion/react"
import { CircleHelp } from "lucide-react"
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
 * The ADMIT ONE rubber stamp, rotated -4deg: the only rotated element on the page.
 * Yes is solid red. Maybe is outlined, with a circle-help icon and a MAYBE tag, so the two differ
 * by shape and wording, not colour alone. It lands with an impact (spring, haptic, optional sound)
 * and calls `onImpact` at the moment of contact; reduced motion appears in place with none of it.
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
      data-variant={variant}
      initial={reduced ? false : FROM[variant]}
      animate={{ opacity: 1, scale: 1, rotate: -4 }}
      transition={{ default: LAND, opacity: { duration: 0.05 } }}
      className={cn(
        "stamp-worn inline-flex w-fit max-w-full flex-col items-center border-2 border-red p-1 forced-colors:border-[CanvasText]",
        maybe ? "bg-transparent text-red" : "bg-red text-paper-raised",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-y-1 border px-3 py-1.5 text-center font-mono text-sm leading-5 font-medium tracking-wide uppercase md:flex-row md:gap-x-2 md:text-base",
          maybe ? "border-red" : "border-paper-raised",
        )}
      >
        {maybe && <CircleHelp aria-hidden="true" className="size-5" strokeWidth={1.5} />}
        <span className="inline-flex flex-col items-center md:flex-row md:gap-x-2">
          <span className="whitespace-nowrap">Admit one</span>
          <span aria-hidden="true" className="hidden md:inline">·</span>
          <span className="sr-only">, </span>
          <span className="whitespace-nowrap">21 Dec 2026</span>
        </span>
        {maybe && (
          <span className="rounded-mark border border-red px-1.5 text-xs font-medium tracking-widest md:text-sm">Maybe</span>
        )}
      </div>
    </m.div>
  )
}
