import { Suspense, lazy, useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { AttendanceView } from "@/components/AttendanceView"
import type { CodeStatus } from "@/components/CodeView"
import type { FieldErrors, SubmitOutcome } from "@/components/DetailsView"
import { SealedView } from "@/components/SealedView"
import { Announcer } from "@/components/StatusLine"
import { StubView } from "@/components/StubView"
import type { RsvpApi, SavedResult } from "@/lib/api"
import {
  FIELD_MESSAGES,
  FORM_FIELDS,
  emptyForm,
  mapBackendErrors,
  normalizeEmail,
  toPayload,
  type Attending,
  type RsvpPayload,
  type RsvpFormValues,
} from "@/lib/schemas/rsvp"
import { formatSeat } from "@/lib/seat"
import { CODE_TTL_MS, withTimeout } from "@/lib/timing"
import { banksFor, beatFor, worldLine, type Banks, type Beat, type View } from "@/world/beats"
import { CHIP } from "@/world/chips"
import { useWorldHits } from "@/world/cues"
import { layoutFor } from "@/world/shots"
import { shirtName, shirtNumber } from "@/world/shirt"
import { useViewport } from "@/world/useViewport"
import { WorldChips } from "@/world/WorldChips"
import { WorldStage } from "@/world/WorldStage"

const loadDetails = () => import("@/components/DetailsView")
const loadCode = () => import("@/components/CodeView")
const DetailsView = lazy(() => loadDetails().then((m) => ({ default: m.DetailsView })))
const CodeView = lazy(() => loadCode().then((m) => ({ default: m.CodeView })))

const sameBanks = (a: Banks, b: Banks) => a.every((l, i) => l === b[i])

export const STORAGE_KEY = "thirty-united:answers"

/**
 * Hand-written on purpose: zod loads after first paint (rsvpSchema.ts) and this runs at first paint. A tampered record
 * (say a numeric firstName) would otherwise make the shirt's name throw on every reload. FORM_FIELDS is every string
 * field of the form; attending and plusOne are checked on their own.
 */
function isAnswers(v: unknown): v is RsvpFormValues {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false
  const r = v as Record<string, unknown>
  return (
    (r.attending === "yes" || r.attending === "maybe" || r.attending === "no") &&
    FORM_FIELDS.every((k) => r[k] === undefined || typeof r[k] === "string") &&
    (r.plusOne === undefined || typeof r.plusOne === "boolean")
  )
}

/** Answers (never the code) survive a reload or back. Cleared once saved, or when they fail the shape check. */
function loadAnswers(): RsvpFormValues | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const v: unknown = JSON.parse(raw)
    if (isAnswers(v)) return v
  } catch {
    /* unreadable: cleared below */
  }
  clearAnswers()
  return null
}
function saveAnswers(v: RsvpFormValues) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  } catch {
    /* private mode: answers just stay in memory */
  }
}
function clearAnswers() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nothing to clear */
  }
}

export const STEP_KEY = "thirty-united:step"

/**
 * The code step (when the code was sent, never the code) survives a discarded tab, so the cooldown holds. It lasts
 * as long as the code does (CODE_TTL_MS, the backend's validity window): after that the guest lands on the form.
 */
function loadSentAt(): number | null {
  try {
    const raw = window.sessionStorage.getItem(STEP_KEY)
    if (raw === null) return null // nothing stored: nothing to clear
    const v = JSON.parse(raw) as { view?: unknown; sentAt?: unknown } | null
    if (v?.view === "code" && typeof v?.sentAt === "number") {
      const age = Date.now() - v.sentAt
      if (age >= 0 && age < CODE_TTL_MS) return v.sentAt
    }
  } catch {
    /* unreadable: cleared below */
  }
  clearStep() // present but expired, sent in the future, or malformed
  return null
}
function saveStep(sentAt: number) {
  try {
    window.sessionStorage.setItem(STEP_KEY, JSON.stringify({ view: "code", sentAt }))
  } catch {
    /* private mode: a reload returns to the form */
  }
}
function clearStep() {
  try {
    window.sessionStorage.removeItem(STEP_KEY)
  } catch {
    /* nothing to clear */
  }
}

type CodeState = { status: CodeStatus; sentAt?: number; retryAfterMs?: number; key: number }

/**
 * The page is one small state machine: sealed, attendance, form (Yes, Maybe or No), code, stub.
 * Each view moves focus to its own heading. The guest's answers stay in memory between steps.
 * The world (one beat per view) sits behind the step panel, <main>; it is aria-hidden, and its progress (the
 * floodlights) is announced in a second live region.
 */
export function InvitePage({ api, missingKey = false }: { api: RsvpApi; missingKey?: boolean }) {
  const [restored] = useState(loadAnswers)
  const [restoredSentAt] = useState(() => (restored ? loadSentAt() : null))
  const [view, setView] = useState<View>(restoredSentAt ? "code" : restored ? "form" : "sealed")
  const [values, setValues] = useState<RsvpFormValues | null>(restored)
  const [formKey, setFormKey] = useState(0)
  const [serverErrors, setServerErrors] = useState<FieldErrors | undefined>()
  const [code, setCode] = useState<CodeState>(() =>
    restoredSentAt
      ? { status: { kind: "sent" }, sentAt: restoredSentAt, key: restoredSentAt }
      : { status: { kind: "sent" }, key: 0 },
  )
  const [result, setResult] = useState<{ saved: SavedResult; payload: RsvpPayload } | null>(null)
  const [navigated, setNavigated] = useState(false)
  const [announce, setAnnounce] = useState("")
  const [live, setLive] = useState<RsvpFormValues | null>(restored) // the form as typed: the shirt mirrors it
  const [digits, setDigits] = useState(0)
  // The world's pass zone hosts this node; the sealed view portals its pass into it. It fills the zone.
  const [passSlot] = useState(() => Object.assign(document.createElement("div"), { className: "absolute inset-0" }))
  const valuesRef = useRef(values)
  const viewport = useViewport()
  const layout = layoutFor(viewport)

  // Warm both chunks while the guest reads the ticket, so the views open without a gap.
  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadDetails()
      void loadCode()
    }, 300)
    return () => window.clearTimeout(id)
  }, [])

  const go = (next: View, message = "") => {
    if (next !== "code") clearStep() // saved, back to edit, or the backend sent the guest to the form
    setNavigated(true)
    setAnnounce(message)
    setView(next)
  }

  const onChangeValues = useCallback((v: RsvpFormValues) => {
    valuesRef.current = v
    saveAnswers(v)
    setLive(v)
  }, [])

  const toForm = (v: RsvpFormValues | null) => {
    if (v) {
      valuesRef.current = v
      setValues(v)
      setLive(v)
    }
    setFormKey((k) => k + 1)
    setServerErrors(undefined)
    go("form")
  }

  const submitForm = async (v: RsvpFormValues): Promise<SubmitOutcome> => {
    valuesRef.current = v
    setValues(v)
    try {
      const r = await withTimeout(api.requestCode(normalizeEmail(v.email)))
      const start = Date.now()
      if (r.status === "invalid_email") return { fieldErrors: { email: FIELD_MESSAGES.email } }
      if (r.status === "invalid_link") return { invalidLink: true }
      const next: CodeState =
        r.status === "sent"
          ? { status: { kind: "sent" }, sentAt: start, key: start }
          : r.status === "rate_limited"
            ? { status: { kind: "rate_limited", retryAfterMs: r.retryAfterMs }, retryAfterMs: r.retryAfterMs, key: start }
            : { status: { kind: "unavailable" }, key: start }
      setCode(next)
      if (next.sentAt) saveStep(next.sentAt)
      go("code", r.status === "sent" ? `Code sent to ${normalizeEmail(v.email)}` : "")
    } catch {
      return { failed: true }
    }
  }

  const current = values ?? emptyForm("yes")
  const email = normalizeEmail(current.email)

  // The world: one beat per view. Before the save the answer in hand drives it; after, the saved one.
  const attending = view === "stub" && result ? result.saved.attending : values?.attending
  const beat: Beat = beatFor(view, attending)
  const banks = banksFor(beat, attending)
  const [world, setWorld] = useState({ beat, banks, line: "" })
  if (world.beat !== beat || !sameBanks(world.banks, banks)) setWorld({ beat, banks, line: worldLine(world, { beat, banks }, attending) })
  useWorldHits(beat, attending, digits) // the strikes' sound (opt-in) and haptics
  const signed = beat === "signed" && result
  // The shirt carries the preferred or first name, never the surname; the number only once the code is verified.
  const name = signed
    ? shirtName({ preferredName: result.payload.preferredName, firstName: result.saved.firstName, surname: result.saved.surname })
    : shirtName(live ?? current)
  const number = signed ? shirtNumber(result.saved.ticketNo, true) : null

  const { frame } = layout
  const chipsStyle: CSSProperties | undefined =
    layout.mode === "desktop" ? { top: frame.y + CHIP.inset, right: viewport.w - frame.x - frame.w + CHIP.inset } : undefined
  const rootStyle = { "--panel-top": `${layout.panelTop}px`, "--panel-h": `${layout.panelH}px` } as CSSProperties

  return (
    <div data-layout={layout.mode} data-keyboard={layout.keyboard} style={rootStyle}>
      <WorldStage
        beat={beat}
        attending={attending}
        layout={layout}
        vvTop={viewport.vvTop}
        shirtName={name}
        shirtNumber={number}
        digits={digits}
        passSlot={passSlot}
      />
      <WorldChips hidden={layout.keyboard} missingKey={missingKey} style={chipsStyle} />
      <main className="panel">
        <Suspense fallback={null}>
        <div key={view + (view === "form" ? formKey : "")} className="view-enter">
          {view === "sealed" && (
            <SealedView missingKey={missingKey} focusHeading={navigated} passSlot={passSlot} onTorn={() => go("attendance", "Ticket opened")} />
          )}
          {view === "attendance" && (
            <AttendanceView
              initial={values?.attending}
              onContinue={(a: Attending) => {
                const base = values ?? emptyForm(a)
                toForm({ ...base, attending: a })
              }}
            />
          )}
          {view === "form" && values && (
            <DetailsView
              initial={values}
              serverErrors={serverErrors}
              onChangeValues={onChangeValues}
              onSubmit={submitForm}
              onChangeAttending={(v) => {
                valuesRef.current = v
                setValues(v)
                go("attendance")
              }}
            />
          )}
          {view === "code" && (
            <CodeView
              key={code.key}
              email={email}
              attending={current.attending}
              initialStatus={code.status}
              initialSentAt={code.sentAt}
              initialRetryAfterMs={code.retryAfterMs}
              onRequestCode={() => api.requestCode(email)}
              onSent={saveStep}
              onVerify={(c) =>
                api.verifyAndSave({ email, code: c, payload: toPayload(valuesRef.current ?? current) })
              }
              onSaved={(r) => {
                clearAnswers()
                setResult({ saved: r, payload: toPayload(valuesRef.current ?? current) })
                go(
                  "stub",
                  r.attending === "no"
                    ? "Saved. Sorry you'll miss it"
                    : r.status === "updated"
                      ? `Your answer is updated. Seat ${formatSeat(r.ticketNo)}`
                      : `You're on the list. Seat ${formatSeat(r.ticketNo)}`,
                )
              }}
              onInvalidPayload={(errors) => {
                const mapped = mapBackendErrors(errors) as FieldErrors
                setServerErrors(mapped)
                setFormKey((k) => k + 1)
                go("form")
              }}
              onBack={() => toForm(valuesRef.current)}
              onDigits={setDigits}
            />
          )}
          {view === "stub" && result && (
            <StubView result={result.saved} payload={result.payload} onChange={() => toForm(valuesRef.current)} />
          )}
        </div>
        </Suspense>
      </main>
      <Announcer message={announce} />
      <Announcer message={world.line} />
    </div>
  )
}
