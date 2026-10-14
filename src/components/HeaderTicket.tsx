import { Check, CircleHelp, X } from "lucide-react"
import { Ticket } from "@/components/Ticket"
import { Stub } from "@/components/Stub"
import type { Attending } from "@/lib/schemas/rsvp"

const PREVIEW = {
  yes: { word: "YES", Icon: Check },
  maybe: { word: "MAYBE", Icon: CircleHelp },
  no: { word: "NO", Icon: X },
} as const

/** The torn ticket as a page header: the main half stays, the stub previews the pick. */
export function HeaderTicket({ attending }: { attending?: Attending }) {
  const p = attending ? PREVIEW[attending] : undefined
  return (
    <Ticket
      className="max-w-[640px]"
      mainClassName="flex min-h-28 flex-col justify-between gap-2 p-4 md:p-6"
      stub={
        <Stub
          rows={[
            { label: "SEAT", value: "---", muted: true },
            {
              label: "REPLY",
              value: p ? (
                <span className="inline-flex items-center gap-1.5">
                  <p.Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={2} />
                  {p.word}
                </span>
              ) : (
                "---"
              ),
              muted: !p,
            },
          ]}
        />
      }
      main={
        <>
          <p className="data-label m-0">21 DEC 2026</p>
          <p aria-hidden="true" className="m-0 font-display text-4xl leading-none font-bold tracking-[0.02em] uppercase md:text-5xl">
            Thirty United
          </p>
        </>
      }
    />
  )
}
