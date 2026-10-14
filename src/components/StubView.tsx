import { useCallback } from "react"
import { animate, useMotionValue } from "motion/react"
import { HeartHandshake, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Stamp } from "@/components/Stamp"
import { Stub } from "@/components/Stub"
import { formatSeat } from "@/lib/seat"
import { Ticket } from "@/components/Ticket"
import { VenueTba } from "@/components/SealedView"
import { useFocusOnMount } from "@/hooks/useFocusOnMount"
import { useTilt } from "@/hooks/useTilt"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import type { SavedResult } from "@/lib/api"
import type { RsvpPayload } from "@/lib/schemas/rsvp"

function teamLine(result: SavedResult, payload: RsvpPayload | undefined): string | undefined {
  if (!result.team) return undefined
  const team = result.team.toUpperCase()
  if (payload?.sport === "other" && payload.otherSport) return `${payload.otherSport.toUpperCase()}: ${team}`
  return team
}

/** Returned stub: the same ticket, filled in. Yes is stamped, Maybe is an outlined stamp, No is void. */
export function StubView({
  result,
  payload,
  onChange,
}: {
  result: SavedResult
  payload?: RsvpPayload
  onChange: () => void
}) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const reduced = useReducedMotion()
  const tilt = useTilt(!reduced)
  const y = useMotionValue(0)
  const rotate = useMotionValue(0)
  // The stamp hits the ticket: 1.5px down and 0.4deg, then it settles (M4.2).
  const recoil = useCallback(() => {
    const spring = { type: "spring", stiffness: 500, damping: 20 } as const
    animate(y, 1.5, spring).then(() => animate(y, 0, spring))
    animate(rotate, 0.4, spring).then(() => animate(rotate, 0, spring))
  }, [y, rotate])
  const no = result.attending === "no"
  const maybe = result.attending === "maybe"
  const fullName = [result.firstName, result.surname].filter(Boolean).join(" ")
  const team = no ? undefined : teamLine(result, payload)

  const heading = no
    ? `Sorry you'll miss it, ${result.firstName}`
    : result.status === "updated"
      ? "Your answer is updated"
      : maybe
        ? "We've held your seat"
        : "You're on the list"

  return (
    <section aria-labelledby="stub-title" className="flex flex-col gap-8">
      <div className="mx-auto flex w-full max-w-[960px] items-start gap-3">
        {no && <HeartHandshake aria-hidden="true" className="mt-1 size-8 shrink-0 md:size-10" strokeWidth={1.5} />}
        <h1 id="stub-title" ref={headingRef} tabIndex={-1} className="heading-view m-0 [overflow-wrap:anywhere]">
          {heading}
        </h1>
      </div>
      <Ticket
        tilt={tilt}
        style={reduced ? undefined : { y, rotate }}
        mainClassName="flex min-h-[18rem] flex-col gap-4 p-4 md:min-h-[26rem] md:p-10"
        stub={
          <Stub
            rows={[
              ...(no ? [] : [{ label: "SEAT", value: formatSeat(result.ticketNo) }]),
              { label: "DATE", value: "21 DEC 2026" },
              { label: "REPLY", value: no ? "NO" : maybe ? "MAYBE" : "YES" },
            ]}
          />
        }
        main={
          <>
            <p className="data-label m-0">21 DEC 2026</p>
            <p aria-hidden="true" className="m-0 font-display text-4xl leading-none font-bold tracking-[0.02em] uppercase md:text-6xl">
              Thirty United
            </p>
            <div className="flex flex-col gap-1">
              <p data-testid="guest-name" className="heading-view m-0 hyphens-auto break-words">
                {fullName}
              </p>
              {!no && (
                <p
                  data-testid="team"
                  className={
                    team
                      ? "m-0 font-display text-xl leading-7 font-bold tracking-[0.06em] hyphens-auto break-words"
                      : "m-0 font-display text-xl leading-7 font-bold tracking-[0.06em] text-muted-foreground"
                  }
                >
                  {team ?? "NEUTRAL"}
                </p>
              )}
            </div>
            {!no && (
              <div className="mt-auto flex justify-start pt-4 md:justify-end">
                <Stamp variant={maybe ? "maybe" : "yes"} onImpact={recoil} />
              </div>
            )}
            {no && (
              <svg aria-hidden="true" className="pointer-events-none -mx-4 -mb-4 mt-auto h-20 w-[calc(100%+2rem)] max-w-none text-ink md:-mx-10 md:-mb-10 md:h-28 md:w-[calc(100%+5rem)]" preserveAspectRatio="none" viewBox="0 0 100 100">
                <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </svg>
            )}
          </>
        }
      />
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <VenueTba />
        <Button type="button" variant="link" className="w-fit" onClick={onChange}>
          <Pencil aria-hidden="true" className="size-5" strokeWidth={1.5} />
          {no ? "Changed your mind?" : "Change my answer"}
        </Button>
      </div>
    </section>
  )
}
