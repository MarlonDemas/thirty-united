import { useState } from "react"
import { ArrowRight, Check, CircleHelp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioTile } from "@/components/ui/radio-group"
import { FieldError } from "@/components/ui/field"
import { useFocusOnMount } from "@/hooks/useFocusOnMount"
import type { Attending } from "@/lib/schemas/rsvp"

const CHOICES: { value: Attending; label: string; Icon: typeof Check }[] = [
  { value: "yes", label: "Yes", Icon: Check },
  { value: "maybe", label: "Maybe", Icon: CircleHelp },
  { value: "no", label: "No", Icon: X },
]

export function AttendanceView({
  initial,
  onContinue,
}: {
  initial?: Attending
  onContinue: (a: Attending) => void
}) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const [choice, setChoice] = useState<Attending | undefined>(initial)
  const [error, setError] = useState(false)

  return (
    <section aria-labelledby="attendance-title" className="flex flex-col gap-4">
      <h1 id="attendance-title" ref={headingRef} tabIndex={-1} className="heading-panel m-0">
        Are you in?
      </h1>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (!choice) {
            setError(true)
            document.querySelector<HTMLElement>("#field-attending [role=radio]")?.focus()
            return
          }
          onContinue(choice)
        }}
      >
        <div className="flex flex-col gap-3">
          <RadioGroup
            id="field-attending"
            aria-label="Are you in?"
            aria-invalid={error || undefined}
            aria-describedby={error ? "err-attending" : undefined}
            value={choice ?? ""}
            onValueChange={(v) => {
              setChoice(v as Attending)
              setError(false)
            }}
            className="grid-cols-[repeat(auto-fit,minmax(min(100%,5.5rem),1fr))] gap-2 md:gap-3"
          >
            {CHOICES.map(({ value, label, Icon }) => (
              <RadioTile key={value} value={value} className="flex-col gap-1 py-2 sm:flex-row sm:gap-2">
                <Icon aria-hidden="true" strokeWidth={choice === value ? 2.5 : 1.5} />
                {label}
              </RadioTile>
            ))}
          </RadioGroup>
          {error && <FieldError id="err-attending">Pick Yes, Maybe or No</FieldError>}
        </div>
        <Button type="submit" className="w-full">
          Continue
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
    </section>
  )
}
