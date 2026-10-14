import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, CircleAlert, Mail, MessageCircle, Pencil, Trophy, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioTile } from "@/components/ui/radio-group"
import { HeaderTicket } from "@/components/HeaderTicket"
import { RuledBox } from "@/components/RuledBox"
import { StatusLine } from "@/components/StatusLine"
import { OptionalTag, TextAreaField, TextField } from "@/components/fields"
import { useFocusOnMount } from "@/hooks/useFocusOnMount"
import { MISSING_KEY_MESSAGE } from "@/lib/inviteKey"
import { useSlowPending } from "@/hooks/useSlowPending"
import {
  FORM_FIELDS,
  type FormField,
  type RsvpFormValues,
} from "@/lib/schemas/rsvp"
import { rsvpFormSchema } from "@/lib/schemas/rsvpSchema"

export type FieldErrors = Partial<Record<FormField, string>>
export type SubmitOutcome = { fieldErrors?: FieldErrors; failed?: boolean; invalidLink?: boolean } | void

const KNOW_MAKES = ["Family", "Friend", "School", "University", "Work", "Football", "Somewhere else"]

function focusField(name: FormField) {
  const el = document.getElementById(`field-${name}`)
  if (!el) return
  const target = el.matches("input,textarea,button,select") ? el : el.querySelector<HTMLElement>("[role=radio],button,input")
  target?.focus()
}

function firstErrorField(errors: FieldErrors): FormField | undefined {
  return FORM_FIELDS.find((f) => errors[f])
}

export function DetailsView({
  initial,
  serverErrors,
  onChangeValues,
  onSubmit,
  onChangeAttending,
}: {
  initial: RsvpFormValues
  serverErrors?: FieldErrors
  onChangeValues: (v: RsvpFormValues) => void
  onSubmit: (v: RsvpFormValues) => Promise<SubmitOutcome>
  onChangeAttending: (v: RsvpFormValues) => void
}) {
  const attending = initial.attending
  const isNo = attending === "no"
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const { pending, slow, run } = useSlowPending()
  const [failed, setFailed] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const form = useForm<RsvpFormValues>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: initial,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
  })
  const { register, control, handleSubmit, setError, clearErrors, setValue, getValues, watch, formState } = form
  const errors = formState.errors
  const errMsg = (k: FormField) => errors[k]?.message as string | undefined

  // Persist answers (never the code) so a reload or back keeps them.
  useEffect(() => {
    const sub = watch((v) => onChangeValues({ ...initial, ...(v as RsvpFormValues) }))
    return () => sub.unsubscribe()
  }, [watch, onChangeValues, initial])

  const applyErrors = (errs: FieldErrors) => {
    for (const k of FORM_FIELDS) if (errs[k]) setError(k, { type: "server", message: errs[k] })
    const first = firstErrorField(errs)
    if (first) requestAnimationFrame(() => focusField(first))
  }

  // Errors mapped from the backend (invalid_payload).
  useEffect(() => {
    if (serverErrors) applyErrors(serverErrors)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverErrors])

  const submit = handleSubmit(
    async (values) => {
      setFailed(false)
      setInvalidLink(false)
      const out = await run(() => onSubmit({ ...values, attending }))
      if (out?.fieldErrors) applyErrors(out.fieldErrors)
      else if (out?.invalidLink) setInvalidLink(true)
      else if (out?.failed) setFailed(true)
    },
    (errs) => {
      const e: FieldErrors = {}
      for (const k of FORM_FIELDS) if (errs[k]) e[k] = errs[k]?.message as string
      const first = firstErrorField(e)
      if (first) focusField(first)
    },
  )

  const sport = watch("sport")
  const plusOne = watch("plusOne")
  const channel = watch("inviteChannel")

  return (
    <section aria-labelledby="details-title" className="mx-auto flex w-full max-w-[640px] flex-col gap-8">
      <HeaderTicket attending={attending} />
      <div className="flex flex-col gap-3">
        <h1 id="details-title" ref={headingRef} tabIndex={-1} className="heading-view m-0">
          {isNo ? "Just your name" : "Your details"}
        </h1>
        <p className="standfirst m-0">
          {isNo ? "So I know you replied." : "A few lines so I can seat you properly."}
        </p>
        <Button
          type="button"
          variant="link"
          className="w-fit"
          onClick={() => onChangeAttending({ ...initial, ...getValues(), attending })}
        >
          <Pencil aria-hidden="true" className="size-5" strokeWidth={1.5} />
          Change Yes, Maybe or No
        </Button>
      </div>

      <form
        noValidate
        onSubmit={submit}
        className="flex flex-col gap-8"
      >
        <RuledBox legend="You">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField name="firstName" label="First name" autoComplete="given-name" reg={register("firstName")} error={errMsg("firstName")} />
            <TextField name="surname" label="Surname" autoComplete="family-name" reg={register("surname")} error={errMsg("surname")} />
          </div>
          {!isNo && (
            <TextField name="preferredName" label="Preferred name" optional autoComplete="nickname" reg={register("preferredName")} error={errMsg("preferredName")} />
          )}
          {isNo && (
            <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" reg={register("email")} error={errMsg("email")} helper="We send a 6-digit code here." />
          )}
        </RuledBox>

        {!isNo && (
          <>
            <RuledBox legend="Plus one">
              <Controller
                control={control}
                name="plusOne"
                render={({ field }) => (
                  <div className="flex min-h-12 items-center gap-3">
                    <Checkbox
                      id="field-plusOne"
                      checked={field.value}
                      onCheckedChange={(c) => {
                        field.onChange(c)
                        if (!c) setValue("plusOneName", "")
                      }}
                    />
                    <Label htmlFor="field-plusOne" className="cursor-pointer items-center gap-3">
                      <UserPlus aria-hidden="true" className="size-5" strokeWidth={1.5} />
                      Bringing someone?
                    </Label>
                  </div>
                )}
              />
              {plusOne && (
                <TextField name="plusOneName" label="Their name" optional reg={register("plusOneName")} error={errMsg("plusOneName")} />
              )}
            </RuledBox>

            <RuledBox legend="Your team">
              <Controller
                control={control}
                name="sport"
                render={({ field }) => (
                  <Field data-invalid={!!errMsg("sport") || undefined}>
                    <RadioGroup
                      id="field-sport"
                      aria-label="Which kind of sport"
                      aria-invalid={!!errMsg("sport") || undefined}
                      aria-describedby={errMsg("sport") ? "err-sport" : undefined}
                      value={field.value ?? ""}
                      onValueChange={(v) => {
                        field.onChange(v)
                        clearErrors("sport")
                        if (v === "football") {
                          setValue("otherSport", "")
                          clearErrors("otherSport")
                        }
                      }}
                      className="grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2 md:gap-3"
                    >
                      <RadioTile value="football">Football</RadioTile>
                      <RadioTile value="other">
                        <Trophy aria-hidden="true" strokeWidth={1.5} />
                        Other sport
                      </RadioTile>
                    </RadioGroup>
                    {errMsg("sport") && <FieldError id="err-sport">{errMsg("sport")}</FieldError>}
                  </Field>
                )}
              />
              {sport === "other" && (
                <TextField name="otherSport" label="Which sport" reg={register("otherSport")} error={errMsg("otherSport")} />
              )}
              <TextField
                name="team"
                label={sport === "other" ? "Team" : "Football team"}
                reg={register("team")}
                error={errMsg("team")}
              />
            </RuledBox>

            <RuledBox legend="A bit more">
              <TextAreaField name="funFact" label="Fun fact about you" optional helper="May be used in a game on the day" reg={register("funFact")} error={errMsg("funFact")} />
              <Field>
                <Label htmlFor="field-howKnowMakes">
                  How do you know Makes?
                  <OptionalTag />
                </Label>
                <div className="relative">
                  <select
                    id="field-howKnowMakes"
                    data-slot="select"
                    className="h-12 w-full min-w-0 appearance-none rounded-none border border-input bg-paper-raised py-0 pr-10 pl-3 text-base text-ink has-[option[value='']:checked]:text-muted-foreground [&>option]:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                    {...register("howKnowMakes")}
                  >
                    <option value="">Choose one</option>
                    {KNOW_MAKES.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink" strokeWidth={1.5} />
                </div>
              </Field>
            </RuledBox>

            <RuledBox legend="Contact">
              <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" reg={register("email")} error={errMsg("email")} helper="We send a 6-digit code here." />
              <Controller
                control={control}
                name="inviteChannel"
                render={({ field }) => (
                  <Field data-invalid={!!errMsg("inviteChannel") || undefined}>
                    <span id="label-channel" className="text-base leading-6 font-medium">
                      Send updates by
                    </span>
                    <RadioGroup
                      id="field-inviteChannel"
                      aria-labelledby="label-channel"
                      aria-invalid={!!errMsg("inviteChannel") || undefined}
                      aria-describedby={errMsg("inviteChannel") ? "err-inviteChannel" : undefined}
                      value={field.value ?? ""}
                      onValueChange={(v) => {
                        field.onChange(v)
                        clearErrors("inviteChannel")
                        if (v === "email") {
                          setValue("whatsapp", "")
                          clearErrors("whatsapp")
                        }
                      }}
                      className="grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2 md:gap-3"
                    >
                      <RadioTile value="email">
                        <Mail aria-hidden="true" strokeWidth={1.5} />
                        Email
                      </RadioTile>
                      <RadioTile value="whatsapp">
                        <MessageCircle aria-hidden="true" strokeWidth={1.5} />
                        WhatsApp
                      </RadioTile>
                    </RadioGroup>
                    {errMsg("inviteChannel") && <FieldError id="err-inviteChannel">{errMsg("inviteChannel")}</FieldError>}
                  </Field>
                )}
              />
              {channel === "whatsapp" && (
                <TextField
                  name="whatsapp"
                  label="WhatsApp number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  helper="Like 082 123 4567, or +44… for numbers outside South Africa"
                  reg={register("whatsapp")}
                  error={errMsg("whatsapp")}
                />
              )}
            </RuledBox>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={pending} className="w-full md:ml-auto md:w-auto md:min-w-56">
            <Mail aria-hidden="true" />
            Send my code
          </Button>
          <StatusLine
            tone={failed ? "error" : "neutral"}
            icon={failed ? <CircleAlert strokeWidth={1.5} /> : undefined}
          >
            {invalidLink
              ? MISSING_KEY_MESSAGE
              : failed
                ? "Couldn't send. Try again"
                : pending
                ? slow
                  ? "Still working. This can take a moment."
                  : "Sending your code"
                : undefined}
          </StatusLine>
        </div>
      </form>
    </section>
  )
}
