import type { ReactNode, Ref } from "react"
import { m, type MotionStyle } from "motion/react"
import { cn } from "cn"
import type { useTilt } from "@/hooks/useTilt"

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
      className={cn("pointer-events-none absolute size-(--notch) text-pass-ink", pos)}
      fill="none"
      preserveAspectRatio="none"
    >
      <path d="M0 0.5 A9.5 9.5 0 0 0 9.5 10" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** The stub half. Rendered once at rest; while tearing, a second aria-hidden copy is the free (peeling) part. */
function StubPiece({ stub, className, style, free }: { stub: ReactNode; className?: string; style?: MotionStyle; free?: boolean }) {
  return (
    <m.div
      aria-hidden={free || undefined}
      inert={free || undefined}
      data-peel={free ? "free" : undefined}
      // .grain sets position: relative outside the utility layer, so the free copy is pinned inline
      style={free ? { position: "absolute", inset: 0, ...style } : style}
      className={cn(
        "piece-stub grain w-full border border-l-0 border-pass-ink bg-pass",
        !free && "relative",
        className,
      )}
    >
      {stub}
      <Notch corner="tl" />
      <Notch corner="bl" />
    </m.div>
  )
}

export type Peel = {
  /** Clip for the real stub: only what is still below the tip. */
  heldStyle: MotionStyle
  /** Style for the free copy above the tip. Omit while nothing is peeling, and the copy is not rendered. */
  freeStyle?: MotionStyle
}

/**
 * The lanyard pass's DOM face (the tear's object on the cover): a main half and a stub half joined at a perforation
 * of punched holes, in the scoped --pass-* paper tokens. Sized by content, capped at 960px. Decorative: the cover's
 * readable words are on the panel.
 */
export function Ticket({
  main,
  stub,
  peel,
  tilt,
  lit,
  stubEdge,
  style,
  mainStyle,
  ticketRef,
  className,
  mainClassName,
  stubClassName,
  children,
}: {
  main: ReactNode
  stub: ReactNode
  peel?: Peel
  tilt?: ReturnType<typeof useTilt>
  /** On the stage only: the key light's contact shadow and sheen. Omit off the stage (no shadow, no sheen). */
  lit?: boolean
  /** Edge label of the stub (aria-hidden). While tearing it rides with the free part, so it is never cut. */
  stubEdge?: ReactNode
  style?: MotionStyle
  mainStyle?: MotionStyle
  ticketRef?: Ref<HTMLDivElement>
  className?: string
  mainClassName?: string
  stubClassName?: string
  children?: ReactNode
}) {
  return (
    <m.div
      ref={ticketRef}
      style={{ ...tilt?.style, ...style }}
      {...tilt?.handlers}
      data-lit={lit}
      className={cn("ticket relative mx-auto flex w-full max-w-[960px] items-stretch text-pass-ink", className)}
    >
      {lit !== undefined && <m.div aria-hidden="true" className="ticket-shadow" style={tilt?.shadow} />}
      <m.div
        style={mainStyle}
        className={cn(
          "piece-main grain relative min-w-0 flex-1 border border-r border-pass-ink border-r-pass-ink bg-pass",
          mainClassName,
        )}
      >
        {main}
        <Notch corner="tr" />
        <Notch corner="br" />
      </m.div>
      <div className="relative flex w-(--stub-w) shrink-0">
        <StubPiece
          stub={
            <>
              {stub}
              {!peel?.freeStyle && stubEdge}
            </>
          }
          className={stubClassName}
          style={peel?.heldStyle}
        />
        {peel?.freeStyle && (
          <StubPiece
            free
            stub={
              <>
                {stub}
                {stubEdge}
              </>
            }
            className={stubClassName}
            style={peel.freeStyle}
          />
        )}
      </div>
      {children}
    </m.div>
  )
}
