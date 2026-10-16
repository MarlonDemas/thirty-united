import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { ArrowLeft, CircleAlert, CloudOff, Mail, MailCheck, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { RuledBox } from "@/components/RuledBox"
import { Announcer, StatusLine, type Tone } from "@/components/StatusLine"
import { useFocusOnMount } from "@/hooks/useFocusOnMount"
import { haptic, HAPTICS } from "@/lib/haptics"
import { useSlowPending } from "@/hooks/useSlowPending"
import { MISSING_KEY_MESSAGE } from "@/lib/inviteKey"
import type { RequestCodeResult, SavedResult, VerifyResult } from "@/lib/api"
import { CODE_LENGTH, cleanCode, type Attending } from "@/lib/schemas/rsvp"
import {
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  formatCountdown,
  formatWait,
  triesLeft,
  withTimeout,
} from "@/lib/timing"

export type CodeStatus =
  | { kind: "sent"; resent?: boolean }
  | { kind: "wrong"; attemptsLeft: number }
  | { kind: "expired" }
  | { kind: "locked" }
  | { kind: "no_code" }
  | { kind: "rate_limited"; retryAfterMs?: number }
  | { kind: "unavailable" }
  | { kind: "send_failed" }
  | { kind: "invalid_link" }
  | { kind: "verify_unavailable" }
  | { kind: "verify_failed" }
  | { kind: "code_format" }

function describe(s: CodeStatus, email: string): { tone: Tone; icon: ReactNode; text: ReactNode } {
  const mono = <span className="data-label break-all">{email}</span>
  switch (s.kind) {
    case "sent":
      return { tone: "success", icon: <MailCheck strokeWidth={1.5} />, text: <>{s.resent ? "New code sent to" : "Code sent to"} {mono}</> }
    case "wrong":
      return { tone: "error", icon: <CircleAlert strokeWidth={1.5} />, text: `That code didn't match. ${triesLeft(s.attemptsLeft)}` }
    case "expired":
      return { tone: "error", icon: <CircleAlert strokeWidth={1.5} />, text: "That code has expired. Send a new one" }
    case "locked":
      return { tone: "error", icon: <CircleAlert strokeWidth={1.5} />, text: "Too many tries. Send a new code" }
    case "no_code":
      return { tone: "error", icon: <CircleAlert strokeWidth={1.5} />, text: "We don't have a code for that email. Send a new one" }
    case "rate_limited":
      return {
        tone: "warning",
        icon: <Timer strokeWidth={1.5} />,
        text: `Too many codes asked for. Try again in ${formatWait(s.retryAfterMs)}. If you already have a code, enter it below.`,
      }
    case "unavailable":
      return { tone: "error", icon: <CloudOff strokeWidth={1.5} />, text: "We can't send codes right now. Your answers are kept, try again in a minute" }
    case "send_failed":
      return { tone: "error", icon: <CircleAlert strokeWidth={1.5} />, text: "Couldn't send. Try again" }
    case "invalid_link":
      return { tone: "neutral", icon: null, text: MISSING_KEY_MESSAGE }
    case "verify_unavailable":
      return { tone: "error", icon: <CloudOff strokeWidth={1.5} />, text: "We can't save your answer right now. Your code is kept, try again in a minute" }
    case "verify_failed":
      return { tone: "error", icon: <CircleAlert strokeWidth={1.5} />, text: "Couldn't confirm. Try again" }
    case "code_format":
      return { tone: "error", icon: <CircleAlert strokeWidth={1.5} />, text: "Enter the 6-digit code" }
  }
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    const onVis = () => setNow(Date.now())
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("focus", onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("focus", onVis)
    }
  }, [active])
  return now
}

export function CodeView({
  email,
  initialStatus,
  initialSentAt,
  initialRetryAfterMs,
  onRequestCode,
  onSent,
  onVerify,
  onSaved,
  onInvalidPayload,
  onBack,
  onDigits,
}: {
  email: string
  /** Kept for the caller's sake; the world shows the answer now. */
  attending?: Attending
  initialStatus: CodeStatus
  /** Epoch ms when a code was sent in this view, if one was. */
  initialSentAt?: number
  initialRetryAfterMs?: number
  onRequestCode: () => Promise<RequestCodeResult>
  /** Told the epoch ms of each new code sent from this view, so a reload keeps the cooldown. */
  onSent?: (sentAt: number) => void
  onVerify: (code: string) => Promise<VerifyResult>
  onSaved: (r: SavedResult) => void
  onInvalidPayload: (errors: Record<string, string>) => void
  onBack: () => void
  /** Digits typed so far: the floodlight's six lamps mirror them, never as numerals. */
  onDigits?: (n: number) => void
}) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const otpRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState("")
  const [rawStatus, setStatus] = useState<CodeStatus>(initialStatus)
  const [sentAt, setSentAt] = useState<number | undefined>(initialSentAt)
  const [cooldownUntil, setCooldownUntil] = useState<number>(() => {
    const t = Date.now()
    if (initialStatus.kind === "sent" && initialSentAt) return initialSentAt + RESEND_COOLDOWN_MS
    if (initialStatus.kind === "rate_limited") return t + (initialRetryAfterMs ?? RESEND_COOLDOWN_MS)
    return 0
  })
  const [announce, setAnnounce] = useState("")
  useEffect(() => {
    onDigits?.(code.length)
  }, [code.length, onDigits])
  const verify = useSlowPending()
  const resend = useSlowPending()

  const expiresAt = sentAt ? sentAt + CODE_TTL_MS : undefined
  const counting = cooldownUntil > 0 || expiresAt !== undefined
  const now = useNow(counting)
  // A code left open past its lifetime reads as expired when the guest returns.
  const status: CodeStatus =
    expiresAt && now >= expiresAt && ["sent", "wrong", "verify_failed"].includes(rawStatus.kind)
      ? { kind: "expired" }
      : rawStatus
  const remaining = Math.max(0, cooldownUntil - now)
  const cooling = remaining > 0

  // Announce only the end of the cooldown, not every second.
  const wasCooling = useRef(cooling)
  useEffect(() => {
    if (wasCooling.current && !cooling) setAnnounce("You can ask for a new code")
    wasCooling.current = cooling
  }, [cooling])

  const focusCode = useCallback(() => {
    otpRef.current?.focus()
    otpRef.current?.select()
  }, [])

  const locked = status.kind === "locked"
  const noInput = status.kind === "unavailable"
  const needsNew = status.kind === "expired" || locked || status.kind === "no_code"

  const doResend = () =>
    resend.run(async () => {
      try {
        const r = await withTimeout(onRequestCode())
        if (r.status === "sent") {
          const t = Date.now()
          setSentAt(t)
          onSent?.(t)
          setCooldownUntil(t + RESEND_COOLDOWN_MS)
          setCode("")
          setStatus({ kind: "sent", resent: true })
          setAnnounce("")
        } else if (r.status === "rate_limited") {
          setCooldownUntil(Date.now() + (r.retryAfterMs ?? RESEND_COOLDOWN_MS))
          setStatus({ kind: "rate_limited", retryAfterMs: r.retryAfterMs })
        } else if (r.status === "service_unavailable") {
          setStatus({ kind: "unavailable" })
        } else if (r.status === "invalid_link") {
          setStatus({ kind: "invalid_link" })
        } else {
          setStatus({ kind: "send_failed" })
        }
      } catch {
        setStatus({ kind: "send_failed" })
      }
    })

  const doVerify = () =>
    verify.run(async () => {
      if (code.length < CODE_LENGTH) {
        setStatus({ kind: "code_format" })
        focusCode()
        return
      }
      try {
        const r = await withTimeout(onVerify(code))
        switch (r.status) {
          case "saved":
          case "updated":
            onSaved(r)
            return
          case "invalid_code":
            haptic(HAPTICS.wrong) // the six lamps go out together
            setCode("")
            setStatus(r.attemptsLeft > 0 ? { kind: "wrong", attemptsLeft: r.attemptsLeft } : { kind: "locked" })
            if (r.attemptsLeft > 0) requestAnimationFrame(focusCode)
            return
          case "code_expired":
            setStatus({ kind: "expired" })
            return
          case "too_many_attempts":
            setStatus({ kind: "locked" })
            return
          case "no_code":
            setStatus({ kind: "no_code" })
            return
          case "invalid_payload":
            if (Object.keys(r.errors).every((k) => k === "code")) {
              setStatus({ kind: "code_format" })
              focusCode()
            } else onInvalidPayload(r.errors)
            return
          case "service_unavailable":
            setStatus({ kind: "verify_unavailable" })
            return
          case "invalid_link":
            setStatus({ kind: "invalid_link" })
            return
        }
      } catch {
        setStatus({ kind: "verify_failed" })
      }
    })

  const d = describe(status, email)
  const invalid = ["wrong", "expired", "locked", "no_code", "code_format"].includes(status.kind)
  const busy = verify.pending || resend.pending

  return (
    <section aria-labelledby="code-title" className="flex flex-col gap-4">
      <h1 id="code-title" ref={headingRef} tabIndex={-1} className="heading-panel m-0">
        Seal it
      </h1>
      <StatusLine id="code-status" tone={d.tone} icon={d.icon}>
        {d.text}
      </StatusLine>
      {/* Recommendation, chapter 3: the promise the code-step persistence keeps (InvitePage STEP_KEY). */}
      <p className="standfirst m-0">Keep this page open. If it closes, open the link again and your answers will be waiting.</p>
      {busy && (
        <StatusLine>
          {resend.pending
            ? resend.slow
              ? "Still working. This can take a moment."
              : "Sending your code"
            : verify.slow
              ? "Still working. This can take a moment."
              : "Checking your code"}
        </StatusLine>
      )}

      {noInput ? (
        <Button type="button" onClick={doResend} disabled={busy} className="w-full">
          <Mail aria-hidden="true" />
          Try again
        </Button>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            doVerify()
          }}
        >
          <RuledBox>
            <InputOTP
              ref={otpRef}
              maxLength={CODE_LENGTH}
              value={code}
              onChange={(v) => {
                setCode(v)
              }}
              pattern={REGEXP_ONLY_DIGITS}
              pasteTransformer={cleanCode}
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={locked || busy}
              aria-label="6-digit code"
              aria-invalid={invalid || undefined}
              aria-describedby="code-status"
              containerClassName="gap-2"
            >
              <InputOTPGroup className="w-full">
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                  <InputOTPSlot key={i} index={i} invalid={invalid} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </RuledBox>
          <div className="flex flex-col-reverse gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={doResend}
              disabled={cooling || busy}
              className={cooling ? "border-dashed" : undefined}
            >
              <Timer aria-hidden="true" />
              {cooling ? `Resend in ${formatCountdown(remaining)}` : "Send a new code"}
            </Button>
            <Button type="submit" disabled={busy || locked || needsNew}>
              Confirm code
            </Button>
          </div>
        </form>
      )}
      <Button type="button" variant="link" className="w-fit px-0" onClick={onBack}>
        <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
        Back to my answers
      </Button>
      <Announcer message={announce} />
    </section>
  )
}
