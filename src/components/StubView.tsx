import { Suspense, lazy } from "react"
import { HeartHandshake, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatSeat } from "@/lib/seat"
import { useFocusOnMount } from "@/hooks/useFocusOnMount"
import type { SavedResult } from "@/lib/api"
import type { RsvpPayload } from "@/lib/schemas/rsvp"

// Save your poster and Share: the compositor, its draw code and the share logic are their own chunk (phase 6).
const SavePoster = lazy(() => import("@/poster/SavePoster"))

/**
 * The signed panel (Yes and Maybe) and the No end. The world carries the shirt and the stamp; the panel carries
 * the heading, the seat and shirt line, and the way back.
 */
export function StubView({ result, payload, onChange }: { result: SavedResult; payload: RsvpPayload; onChange: () => void }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const no = result.attending === "no"
  const maybe = result.attending === "maybe"

  if (no)
    return (
      <section aria-labelledby="stub-title" className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <HeartHandshake aria-hidden="true" className="mt-1 size-8 shrink-0" strokeWidth={1.5} />
          <h1 id="stub-title" ref={headingRef} tabIndex={-1} className="heading-panel m-0 [overflow-wrap:anywhere]">
            Sorry you'll miss it, {result.firstName}
          </h1>
        </div>
        {/* No red here: the way back is a secondary button. */}
        <Button type="button" variant="outline" className="mt-2 w-full" onClick={onChange}>
          <Pencil aria-hidden="true" className="size-5" strokeWidth={1.5} />
          Changed your mind?
        </Button>
      </section>
    )

  const heading = result.status === "updated" ? "Your answer is updated" : maybe ? "We've held your seat" : "You're on the list"
  return (
    <section aria-labelledby="stub-title" className="flex flex-col gap-4">
      <h1 id="stub-title" ref={headingRef} tabIndex={-1} className="heading-panel m-0 [overflow-wrap:anywhere]">
        {heading}
      </h1>
      {/* The stamp lands in the world (aria-hidden); its words are read here once. */}
      <p className="sr-only">{maybe ? "Pencilled in" : "Signed"}</p>
      <p data-testid="seat-line" className="data-stub m-0">
        Seat <span>{formatSeat(result.ticketNo)}</span> · Shirt <span>{result.ticketNo}</span>
      </p>
      <Suspense fallback={null}>
        <SavePoster saved={result} payload={payload} />
      </Suspense>
      <Button type="button" variant="link" className="w-fit px-0" onClick={onChange}>
        <Pencil aria-hidden="true" className="size-5" strokeWidth={1.5} />
        Change my answer
      </Button>
    </section>
  )
}
