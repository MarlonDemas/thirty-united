import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CodeView } from "@/components/CodeView"
import type { RequestCodeResult } from "@/lib/api"

const noop = () => {}
const renderCode = (over: { onRequestCode?: () => Promise<RequestCodeResult> } = {}) =>
  render(
    <CodeView
      email="a@example.com"
      attending="yes"
      initialStatus={{ kind: "sent" }}
      initialSentAt={Date.now()}
      onRequestCode={over.onRequestCode ?? (async () => ({ status: "sent" }))}
      onVerify={async () => ({ status: "no_code" })}
      onSaved={noop}
      onInvalidPayload={noop}
      onBack={noop}
    />,
  )

describe("CodeView timing (computed from timestamps)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] })
  })
  afterEach(() => vi.useRealTimers())

  it("counts the 60 s cooldown down, then enables a new code and announces it once", () => {
    renderCode()
    expect(screen.getByRole("button", { name: /resend in 1:00/i })).toBeDisabled()
    act(() => vi.advanceTimersByTime(30_000))
    expect(screen.getByRole("button", { name: /resend in 0:30/i })).toBeDisabled()
    act(() => vi.advanceTimersByTime(30_000))
    expect(screen.getByRole("button", { name: "Send a new code" })).toBeEnabled()
    expect(screen.getAllByRole("status").some((n) => n.textContent === "You can ask for a new code")).toBe(true)
  })

  it("a code left open past 10 minutes reads as expired", () => {
    renderCode()
    act(() => vi.advanceTimersByTime(10 * 60 * 1000 + 1000))
    expect(screen.getByText("That code has expired. Send a new one")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send a new code" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Confirm code" })).toBeDisabled()
  })

  it("coming back from the background recomputes from the clock, not from ticks", () => {
    renderCode()
    vi.setSystemTime(Date.now() + 11 * 60 * 1000)
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(screen.getByText("That code has expired. Send a new one")).toBeInTheDocument()
  })

  it("a resend that the backend rate-limits uses retryAfterMs for the countdown", async () => {
    renderCode({ onRequestCode: async () => ({ status: "rate_limited", retryAfterMs: 20_000 }) })
    act(() => vi.advanceTimersByTime(60_000))
    await act(async () => {
      screen.getByRole("button", { name: "Send a new code" }).click()
    })
    expect(screen.getByText(/Try again in 20 seconds/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend in 0:20/i })).toBeDisabled()
  })

  it("a successful resend restarts the cooldown and says a new code was sent", async () => {
    renderCode()
    act(() => vi.advanceTimersByTime(60_000))
    await act(async () => {
      screen.getByRole("button", { name: "Send a new code" }).click()
    })
    expect(screen.getByText(/New code sent to/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend in 1:00/i })).toBeDisabled()
  })
})

describe("CodeView haptics and copy", () => {
  afterEach(() => {
    delete (navigator as unknown as { vibrate?: unknown }).vibrate
    delete (navigator as unknown as { userActivation?: unknown }).userActivation
  })

  it("a wrong code buzzes [10, 30, 10] (Android, after the first tap)", async () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true, writable: true })
    Object.defineProperty(navigator, "userActivation", { value: { hasBeenActive: true }, configurable: true })
    const user = userEvent.setup()
    render(
      <CodeView
        email="a@example.com"
        initialStatus={{ kind: "sent" }}
        initialSentAt={Date.now()}
        onRequestCode={async () => ({ status: "sent" })}
        onVerify={async () => ({ status: "invalid_code", attemptsLeft: 2 })}
        onSaved={noop}
        onInvalidPayload={noop}
        onBack={noop}
      />,
    )
    await user.type(screen.getByLabelText("6-digit code"), "111111")
    await user.click(screen.getByRole("button", { name: "Confirm code" }))
    await screen.findByText(/didn't match/i)
    expect(vibrate).toHaveBeenCalledWith([10, 30, 10])
  })

  it("asks the guest to keep the page open (recommendation, chapter 3)", () => {
    renderCode()
    expect(
      screen.getByText("Keep this page open. If it closes, open the link again and your answers will be waiting."),
    ).toBeInTheDocument()
  })
})
