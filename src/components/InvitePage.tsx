import { cn } from "cn"
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react"
import { AttendanceView } from "@/components/AttendanceView"
import type { CodeStatus } from "@/components/CodeView"
import type { FieldErrors, SubmitOutcome } from "@/components/DetailsView"
import { SealedView } from "@/components/SealedView"
import { Announcer } from "@/components/StatusLine"
import { StubView } from "@/components/StubView"
import type { RsvpApi, SavedResult } from "@/lib/api"
import {
  FIELD_MESSAGES,
  emptyForm,
  mapBackendErrors,
  normalizeEmail,
  toPayload,
  type Attending,
  type RsvpPayload,
  type RsvpFormValues,
} from "@/lib/schemas/rsvp"
import { formatSeat } from "@/lib/seat"
import { withTimeout } from "@/lib/timing"

const loadDetails = () => import("@/components/DetailsView")
const loadCode = () => import("@/components/CodeView")
const DetailsView = lazy(() => loadDetails().then((m) => ({ default: m.DetailsView })))
const CodeView = lazy(() => loadCode().then((m) => ({ default: m.CodeView })))

type View = "sealed" | "attendance" | "form" | "code" | "stub"

export const STORAGE_KEY = "thirty-united:answers"

/** Answers (never the code) survive a reload or back. Cleared once saved. */
function loadAnswers(): RsvpFormValues | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as RsvpFormValues
    return v && ["yes", "maybe", "no"].includes(v.attending) ? v : null
  } catch {
    return null
  }
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

/** The code step (when the code was sent, never the code) survives a discarded tab, so the cooldown holds. */
function loadSentAt(): number | null {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(STEP_KEY) ?? "null") as { view?: string; sentAt?: unknown } | null
    return v?.view === "code" && typeof v.sentAt === "number" && Number.isFinite(v.sentAt) && v.sentAt > 0 && v.sentAt <= Date.now() ? v.sentAt : null
  } catch {
    return null
  }
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
  const [stageOn, setStageOn] = useState(true) // the sealed screen's night stage; false once "Tear open" settles
  const valuesRef = useRef(values)

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
  }, [])

  const toForm = (v: RsvpFormValues | null) => {
    if (v) {
      valuesRef.current = v
      setValues(v)
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

  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col px-4 py-8 md:px-8 md:py-16",
        view === "sealed" && stageOn && "stage",
      )}
    >
      {view === "sealed" && (
        <div aria-hidden="true" data-on={stageOn} className="stage-backdrop">
          <div className="stage-glow" />
        </div>
      )}
      <main className="flex-1">
        <Suspense fallback={null}>
        <div key={view + (view === "form" ? formKey : "")} className="view-enter">
          {view === "sealed" && (
            <SealedView staged={stageOn} missingKey={missingKey} focusHeading={navigated} onStageEnd={() => setStageOn(false)} onTorn={() => go("attendance", "Ticket opened")} />
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
            />
          )}
          {view === "stub" && result && (
            <StubView
              result={result.saved}
              payload={result.payload}
              onChange={() => toForm(valuesRef.current)}
            />
          )}
        </div>
        </Suspense>
      </main>
      <footer className="helper pt-12 text-center">Makes, 21 DEC 2026</footer>
      <Announcer message={announce} />
    </div>
  )
}
