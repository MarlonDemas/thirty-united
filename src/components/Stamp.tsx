import { m } from "motion/react"
import { CircleHelp } from "lucide-react"
import { cn } from "cn"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export type StampVariant = "yes" | "maybe"

/**
 * The ADMIT ONE rubber stamp, rotated -4deg: the only rotated element on the page.
 * Yes is solid red. Maybe is outlined, with a circle-help icon and a MAYBE tag, so the two differ
 * by shape and wording, not colour alone.
 */
export function Stamp({ variant, className }: { variant: StampVariant; className?: string }) {
  const reduced = useReducedMotion()
  const maybe = variant === "maybe"
  return (
    <m.div
      data-variant={variant}
      initial={reduced ? false : { opacity: 0, scale: 1.15 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotate: -4 }}
      className={cn(
        "inline-flex w-fit max-w-full flex-col items-center border-2 border-red p-1 forced-colors:border-[CanvasText]",
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
