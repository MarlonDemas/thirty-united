import type { ReactNode, Ref } from "react"
import { m, type MotionStyle } from "motion/react"
import { cn } from "cn"

/** A quarter-arc stroke that redraws the ink edge of a punched notch (stroke = currentColor). */
function Notch({ corner }: { corner: "tr" | "br" | "tl" | "bl" }) {
  const pos = {
    tr: "top-0 right-0",
    br: "bottom-0 right-0 -scale-y-100",
    tl: "top-0 left-0 -scale-x-100",
    bl: "bottom-0 left-0 -scale-100",
  }[corner]
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 10"
      className={cn("pointer-events-none absolute size-(--notch) text-ink", pos)}
      fill="none"
      preserveAspectRatio="none"
    >
      <path d="M0 0.5 A9.5 9.5 0 0 0 9.5 10" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/**
 * The ticket: a main half and a stub half joined at a perforation. Sized by content (no fixed
 * aspect ratio), so enlarged text grows it. Capped at 960px.
 */
export function Ticket({
  main,
  stub,
  stubStyle,
  stubRef,
  ticketRef,
  className,
  mainClassName,
  stubClassName,
  children,
}: {
  main: ReactNode
  stub: ReactNode
  stubStyle?: MotionStyle
  stubRef?: Ref<HTMLDivElement>
  ticketRef?: Ref<HTMLDivElement>
  className?: string
  mainClassName?: string
  stubClassName?: string
  children?: ReactNode
}) {
  return (
    <div ref={ticketRef} className={cn("ticket relative mx-auto flex w-full max-w-[960px] items-stretch", className)}>
      <div
        className={cn(
          "piece-main grain relative min-w-0 flex-1 border border-r-2 border-ink border-r-ink bg-paper [border-right-style:dotted]",
          mainClassName,
        )}
      >
        {main}
        <Notch corner="tr" />
        <Notch corner="br" />
      </div>
      <m.div
        ref={stubRef}
        style={{ transformOrigin: "0 0", ...stubStyle }}
        className={cn("piece-stub grain relative w-(--stub-w) shrink-0 border border-l-0 border-ink bg-paper", stubClassName)}
      >
        {stub}
        <Notch corner="tl" />
        <Notch corner="bl" />
      </m.div>
      {children}
    </div>
  )
}
