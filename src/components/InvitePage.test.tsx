import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { InvitePage } from "@/components/InvitePage"
import type { VerifyResult } from "@/lib/api"
import { emptyForm } from "@/lib/schemas/rsvp"
import { CODE_TTL_MS } from "@/lib/timing"
import { fakeApi, setReducedMotion } from "@/test-utils"

type Api = ReturnType<typeof fakeApi>
const setup = (api: Api = fakeApi(), missingKey = false) => {
  const user = userEvent.setup()
  render(<InvitePage api={api} missingKey={missingKey} />)
  return { user, api }
}

const heading = (name: string | RegExp) => screen.getByRole("heading", { level: 1, name })
const findHeading = (name: string | RegExp) => screen.findByRole("heading", { level: 1, name })
const live = () => screen.getAllByRole("status")

async function pick(user: ReturnType<typeof userEvent.setup>, who: "Yes" | "Maybe" | "No") {
  await user.click(screen.getByRole("radio", { name: who }))
  await user.click(screen.getByRole("button", { name: /continue/i }))
  await findHeading(/your shirt|just your name/i) // the form chunk loads lazily
}
async function fillNo(user: ReturnType<typeof userEvent.setup>, email = "sipho@example.com") {
  await user.type(screen.getByLabelText("First name"), "Sipho")
  await user.type(screen.getByLabelText("Surname"), "Dlamini")
  await user.type(screen.getByLabelText("Email"), email)
}
async function fillYes(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("First name"), "Thandi")
  await user.type(screen.getByLabelText("Surname"), "Nkosi")
  await user.click(screen.getByRole("radio", { name: "Football" }))
  await user.type(screen.getByLabelText("Football team"), "Orlando Pirates")
  await user.type(screen.getByLabelText("Email"), "Thandi@Example.com")
  await user.click(screen.getByRole("radio", { name: "Email" }))
}
const submit = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: /send my code/i }))
const typeCode = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
  await user.type(screen.getByLabelText("6-digit code"), code)
  await user.click(screen.getByRole("button", { name: /confirm code/i }))
}


describe("sealed ticket", () => {
  it("shows the title, the owner's opening line and one Tear open action", () => {
    setup()
    expect(heading("You've been called up")).toBeInTheDocument()
    expect(screen.getByText("Thirty feels like half time. Come for the oranges.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /tear open/i })).toBeInTheDocument()
    expect(screen.getByText("Venue TBA")).toBeInTheDocument()
    expect(document.documentElement.lang).toBeDefined()
  })

  it("tears via the button, absorbs a second press, announces and focuses the next heading", async () => {
    const { user } = setup()
    const btn = screen.getByRole("button", { name: /tear open/i })
    await user.click(btn)
    await user.click(btn) // second press during the tear is absorbed
    await waitFor(() => expect(heading("Are you in?")).toHaveFocus(), { timeout: 3000 })
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(live().some((n) => n.textContent === "Ticket opened")).toBe(true)
  })

  it("reduced motion: no drag handle, instant swap, announcement and focus still happen", async () => {
    setReducedMotion(true)
    const { user } = setup()
    expect(screen.queryByTestId("tear-handle")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    expect(heading("Are you in?")).toHaveFocus()
    expect(live().some((n) => n.textContent === "Ticket opened")).toBe(true)
  })

  it("renders the drag handle as decorative when motion is allowed", () => {
    setup()
    expect(screen.getByTestId("tear-handle")).toHaveAttribute("aria-hidden", "true")
  })
})

describe("sealed ticket without an invite key", () => {
  it("shows one calm line instead of Tear open and drops the drag handle", () => {
    setup(fakeApi(), true)
    expect(heading("You've been called up")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /tear open/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId("tear-handle")).not.toBeInTheDocument()
    const line = screen.getByText("This link is missing its invite key. Ask Makes to send you the full link.")
    expect(line.closest("[role=status]")).toHaveAttribute("aria-live", "polite")
  })
})

describe("attendance", () => {
  it("asks for a pick before continuing, and keeps the pick", async () => {
    setReducedMotion(true)
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await user.click(screen.getByRole("button", { name: /continue/i }))
    expect(screen.getByText("Pick Yes, Maybe or No")).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "Maybe" }))
    expect(screen.getByRole("radio", { name: "Maybe" })).toBeChecked()
  })
})

describe("the No path", () => {
  it("collects name and email only, verifies, and shows the sorry stub with no seat", async () => {
    setReducedMotion(true)
    const api = fakeApi({
      verifyAndSave: async () => ({ status: "saved", ticketNo: 4, firstName: "Sipho", surname: "Dlamini", attending: "no" }) as VerifyResult,
    })
    const { user } = setup(api)
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "No")
    expect(await findHeading("Just your name")).toHaveFocus()
    expect(screen.queryByLabelText("Football team")).not.toBeInTheDocument()
    await fillNo(user)
    await submit(user)

    expect(api.requestCode).toHaveBeenCalledWith("sipho@example.com")
    expect(await findHeading("Seal it")).toHaveFocus()
    expect(screen.getByText("Code sent to")).toBeInTheDocument()
    expect(screen.getByText("sipho@example.com")).toBeInTheDocument()

    await typeCode(user, "123456")
    expect(api.verifyAndSave).toHaveBeenCalledWith({
      email: "sipho@example.com",
      code: "123456",
      payload: { firstName: "Sipho", surname: "Dlamini", attending: "no" },
    })
    expect(heading("Sorry you'll miss it, Sipho")).toHaveFocus()
    expect(screen.queryByText("SEAT")).not.toBeInTheDocument()
    expect(screen.queryByText("007")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Changed your mind?" })).toBeInTheDocument()
    expect(document.querySelector("[data-variant]")).toBeNull() // no stamp: red is reserved for a Yes
  })
})

describe("the Yes path form", () => {
  const toYesForm = async () => {
    setReducedMotion(true)
    const ctx = setup()
    await ctx.user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(ctx.user, "Yes")
    return ctx
  }

  it("reveals the conditional fields from their triggers and hides them again", async () => {
    const { user } = await toYesForm()
    expect(screen.queryByLabelText("Their name", { exact: false })).not.toBeInTheDocument()
    await user.click(screen.getByRole("checkbox", { name: /bringing someone/i }))
    expect(screen.getByLabelText(/their name/i)).toBeInTheDocument()
    await user.click(screen.getByRole("checkbox", { name: /bringing someone/i }))
    expect(screen.queryByLabelText(/their name/i)).not.toBeInTheDocument()

    expect(screen.queryByLabelText("Which sport")).not.toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: /other sport/i }))
    expect(screen.getByLabelText("Which sport")).toBeInTheDocument()
    expect(screen.getByLabelText("Team")).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "Football" }))
    expect(screen.queryByLabelText("Which sport")).not.toBeInTheDocument()

    expect(screen.queryByLabelText("WhatsApp number")).not.toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "WhatsApp" }))
    expect(screen.getByLabelText("WhatsApp number")).toHaveAttribute("type", "tel")
    await user.click(screen.getByRole("radio", { name: "Email" }))
    expect(screen.queryByLabelText("WhatsApp number")).not.toBeInTheDocument()
  })

  it("marks optional fields with a tag, not an asterisk, and uses autofill hints", async () => {
    await toYesForm()
    expect(screen.getByLabelText("First name")).toHaveAttribute("autocomplete", "given-name")
    expect(screen.getByLabelText("Surname")).toHaveAttribute("autocomplete", "family-name")
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email")
    expect(within(screen.getByText(/preferred name/i).closest("label")!).getByText("optional")).toBeInTheDocument()
    expect(screen.getByText("May be used in a game on the day")).toBeInTheDocument()
  })

  it("shows field errors under the fields and moves focus to the first one, keeping answers", async () => {
    const { user, api } = await toYesForm()
    await user.type(screen.getByLabelText("Surname"), "Nkosi")
    await submit(user)
    expect(await screen.findByText("Add your first name")).toBeInTheDocument()
    expect(screen.getByLabelText("First name")).toHaveFocus()
    expect(screen.getByLabelText("First name")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Surname")).toHaveValue("Nkosi")
    expect(screen.getByText("Pick football or another sport")).toBeInTheDocument()
    expect(api.requestCode).not.toHaveBeenCalled()
  })

  it("requires the other sport and WhatsApp number when those are chosen", async () => {
    const { user } = await toYesForm()
    await fillYes(user)
    await user.click(screen.getByRole("radio", { name: /other sport/i }))
    await user.click(screen.getByRole("radio", { name: "WhatsApp" }))
    await submit(user)
    expect(await screen.findByText("Say which sport")).toBeInTheDocument()
    expect(screen.getByText("Add your WhatsApp number")).toBeInTheDocument()
    await user.type(screen.getByLabelText("WhatsApp number"), "082123")
    await submit(user)
    expect(await screen.findByText(/use a number like/i)).toBeInTheDocument()
  })

  it("keeps the answers in sessionStorage for a reload, never the code", async () => {
    const { user } = await toYesForm()
    await user.type(screen.getByLabelText("First name"), "Thandi")
    const stored = window.sessionStorage.getItem("thirty-united:answers")
    expect(stored).toContain("Thandi")
    expect(stored).not.toMatch(/code/i)
  })
})

describe("the code step", () => {
  const toCodeView = async (api: Api) => {
    setReducedMotion(true)
    const { user } = setup(api)
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "Yes")
    await fillYes(user)
    await submit(user)
    await screen.findByRole("heading", { name: "Seal it" })
    return user
  }

  it("sends the normalised email, then saves with the trimmed payload and shows the Yes stub", async () => {
    const api = fakeApi()
    const user = await toCodeView(api)
    expect(api.requestCode).toHaveBeenCalledWith("thandi@example.com")
    expect(await findHeading("Seal it")).toHaveFocus()
    await typeCode(user, "123456")
    expect(api.verifyAndSave).toHaveBeenCalledWith({
      email: "thandi@example.com",
      code: "123456",
      payload: expect.objectContaining({
        firstName: "Thandi",
        surname: "Nkosi",
        attending: "yes",
        sport: "football",
        team: "Orlando Pirates",
        inviteChannel: "email",
      }),
    })
    expect(heading("You're on the list")).toHaveFocus()
    // The shirt in his hands: first name only, never the surname; the number is the ticket number.
    const names = [...document.querySelectorAll("[data-name]")].map((n) => n.getAttribute("data-name"))
    expect(names).toEqual(["THANDI"])
    expect(document.querySelector("[data-number]")).toHaveAttribute("data-number", "7")
    expect(screen.getByTestId("seat-line")).toHaveTextContent("Seat 007 · Shirt 7")
    expect(document.querySelector("[data-variant=yes]")).toHaveTextContent(/signed/i)
    expect(window.sessionStorage.getItem("thirty-united:answers")).toBeNull()
    expect(live().some((n) => /You're on the list\. Seat 007/.test(n.textContent ?? ""))).toBe(true)
  })

  it("shows the resend cooldown as a disabled dashed action", async () => {
    const user = await toCodeView(fakeApi())
    void user
    const resend = screen.getByRole("button", { name: /resend in 1:00/i })
    expect(resend).toBeDisabled()
  })

  it.each([
    [{ status: "invalid_code", attemptsLeft: 3 }, "That code didn't match. 3 tries left", "input"],
    [{ status: "invalid_code", attemptsLeft: 1 }, "That code didn't match. 1 try left", "input"],
    [{ status: "invalid_code", attemptsLeft: 0 }, "Too many tries. Send a new code", "none"],
    [{ status: "too_many_attempts" }, "Too many tries. Send a new code", "none"],
    [{ status: "code_expired" }, "That code has expired. Send a new one", "none"],
    [{ status: "no_code" }, "We don't have a code for that email. Send a new one", "none"],
    [{ status: "service_unavailable" }, "We can't save your answer right now. Your code is kept, try again in a minute", "none"],
  ] as const)("renders %j as %j", async (reply, copy, focus) => {
    const api = fakeApi({ verifyAndSave: async () => reply as unknown as VerifyResult })
    const user = await toCodeView(api)
    await typeCode(user, "654321")
    const line = await screen.findByText(copy)
    expect(line).toBeInTheDocument()
    expect(line.closest("[role=status]")).toBeInTheDocument()
    if (focus === "input") await waitFor(() => expect(screen.getByLabelText("6-digit code")).toHaveFocus())
  })

  it("invalid_link on verify shows the invite-key line, keeps the code and does not count a wrong try", async () => {
    const api = fakeApi({ verifyAndSave: async () => ({ status: "invalid_link" }) as VerifyResult })
    const user = await toCodeView(api)
    await typeCode(user, "654321")
    const line = await screen.findByText("This link is missing its invite key. Ask Makes to send you the full link.")
    expect(line.closest("[role=status]")).toBeInTheDocument()
    expect(screen.queryByText(/didn't match/)).not.toBeInTheDocument()
    expect(screen.getByLabelText("6-digit code")).toHaveValue("654321")
  })

  it("clears the cells after a wrong code so it can be retyped", async () => {
    const api = fakeApi({ verifyAndSave: async () => ({ status: "invalid_code", attemptsLeft: 2 }) as VerifyResult })
    const user = await toCodeView(api)
    await typeCode(user, "111111")
    await screen.findByText(/2 tries left/)
    expect(screen.getByLabelText("6-digit code")).toHaveValue("")
    expect(screen.getByLabelText("6-digit code")).toHaveAttribute("aria-invalid", "true")
  })

  it("asks for six digits before calling the backend", async () => {
    const api = fakeApi()
    const user = await toCodeView(api)
    await user.type(screen.getByLabelText("6-digit code"), "123")
    await user.click(screen.getByRole("button", { name: /confirm code/i }))
    expect(await screen.findByText("Enter the 6-digit code")).toBeInTheDocument()
    expect(api.verifyAndSave).not.toHaveBeenCalled()
  })

  it("accepts a pasted code with spaces", async () => {
    const api = fakeApi()
    const user = await toCodeView(api)
    await user.click(screen.getByLabelText("6-digit code"))
    await user.paste("123 456")
    await user.click(screen.getByRole("button", { name: /confirm code/i }))
    expect(api.verifyAndSave).toHaveBeenCalledWith(expect.objectContaining({ code: "123456" }))
  })

  it("maps backend invalid_payload errors onto the fields and returns to the form", async () => {
    const api = fakeApi({
      verifyAndSave: async () =>
        ({ status: "invalid_payload", errors: { team: "Required", whatsapp: "Enter a valid number" } }) as VerifyResult,
    })
    const user = await toCodeView(api)
    await typeCode(user, "123456")
    expect(await screen.findByText("Add your team")).toBeInTheDocument()
    expect(await findHeading("Your shirt")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText("Football team")).toHaveFocus())
    expect(screen.getByLabelText("First name")).toHaveValue("Thandi")
  })

  it("goes back to the form with answers kept", async () => {
    const user = await toCodeView(fakeApi())
    await user.click(screen.getByRole("button", { name: /back to my answers/i }))
    expect(await findHeading("Your shirt")).toBeInTheDocument()
    expect(screen.getByLabelText("First name")).toHaveValue("Thandi")
    expect(screen.getByLabelText("Football team")).toHaveValue("Orlando Pirates")
  })
})

describe("the code step after a reload or discarded tab", () => {
  const STEP = "thirty-united:step"
  const step = () => JSON.parse(window.sessionStorage.getItem(STEP) ?? "null") as { view: string; sentAt: number } | null
  const seed = (sentAt: number) => {
    const answers = { ...emptyForm("yes"), firstName: "Thandi", surname: "Nkosi", email: "thandi@example.com" }
    window.sessionStorage.setItem("thirty-united:answers", JSON.stringify(answers))
    window.sessionStorage.setItem(STEP, JSON.stringify({ view: "code", sentAt }))
  }
  const toCodeView = async (api: Api) => {
    setReducedMotion(true)
    const { user } = setup(api)
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "Yes")
    await fillYes(user)
    await submit(user)
    await findHeading("Seal it")
    return user
  }

  it("the step holds only the view and when the code was sent: never the code, and the invite key stays in its own slot", async () => {
    window.sessionStorage.setItem("thirty-united:k", "invite-key-7f3a") // captured from the link at start, by design
    const api = fakeApi({ verifyAndSave: async () => ({ status: "invalid_code", attemptsLeft: 2 }) as VerifyResult })
    const before = Date.now()
    const user = await toCodeView(api)
    expect(step()).toEqual({ view: "code", sentAt: expect.any(Number) })
    expect(step()!.sentAt).toBeGreaterThanOrEqual(before)
    await typeCode(user, "482913")
    await screen.findByText(/didn't match/i)
    const all = Object.keys(window.sessionStorage).map((k) => window.sessionStorage.getItem(k)).join("|")
    expect(all).not.toContain("482913")
    expect(Object.keys(step()!).sort()).toEqual(["sentAt", "view"])
    // The key stays only where the app already kept it; the step and the answers never carry it.
    expect(window.sessionStorage.getItem(STEP)).not.toContain("invite-key-7f3a")
    expect(window.sessionStorage.getItem("thirty-united:answers")).not.toContain("invite-key-7f3a")
    expect(Object.keys(window.sessionStorage).sort()).toEqual(["thirty-united:answers", "thirty-united:k", STEP].sort())
  })

  it("ignores and clears a step older than the code's 10-minute life: the guest lands on the form", async () => {
    seed(Date.now() - CODE_TTL_MS - 1000)
    const api = fakeApi()
    setup(api)
    expect(await findHeading("Your shirt")).toBeInTheDocument()
    expect(screen.getByLabelText("First name")).toHaveValue("Thandi")
    expect(screen.queryByRole("heading", { name: "Seal it" })).toBeNull()
    expect(step()).toBeNull()
    expect(api.requestCode).not.toHaveBeenCalled()
  })

  it("restores a step sent just inside the code's life", async () => {
    seed(Date.now() - CODE_TTL_MS + 30_000)
    setup()
    expect(await findHeading("Seal it")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send a new code" })).toBeEnabled() // the 60 s cooldown is long over
  })

  it("restores the code step with the resend cooldown still running", async () => {
    seed(Date.now() - 15_000)
    const api = fakeApi()
    setup(api)
    expect(await findHeading("Seal it")).toHaveFocus()
    expect(screen.getByRole("button", { name: /resend in 0:4\d/i })).toBeDisabled()
    expect(screen.getByText(/keep this page open/i)).toBeInTheDocument()
    expect(api.requestCode).not.toHaveBeenCalled()
  })

  it("keeps the new send time after a resend", async () => {
    const old = Date.now() - 70_000
    seed(old)
    const { user } = setup(fakeApi())
    await findHeading("Seal it")
    await user.click(screen.getByRole("button", { name: "Send a new code" }))
    await screen.findByText(/new code sent to/i)
    expect(step()!.sentAt).toBeGreaterThan(old + 60_000)
  })

  it("ignores a stored step without stored answers", () => {
    window.sessionStorage.setItem(STEP, JSON.stringify({ view: "code", sentAt: Date.now() }))
    setup()
    expect(heading("You've been called up")).toBeInTheDocument()
  })

  it("ignores a stored step sent in the future", async () => {
    seed(Date.now() + 60 * 60 * 1000)
    setup()
    expect(await findHeading("Your shirt")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Seal it" })).toBeNull()
  })

  it("clears the step once the answer is saved", async () => {
    const user = await toCodeView(fakeApi())
    expect(step()).not.toBeNull()
    await typeCode(user, "123456")
    await findHeading("You're on the list")
    expect(step()).toBeNull()
  })

  it("clears the step when the guest goes back to edit", async () => {
    const user = await toCodeView(fakeApi())
    await user.click(screen.getByRole("button", { name: /back to my answers/i }))
    await findHeading("Your shirt")
    expect(step()).toBeNull()
  })
})

describe("restored answers are checked before use", () => {
  const ANSWERS = "thirty-united:answers"
  const store = (v: unknown) => window.sessionStorage.setItem(ANSWERS, JSON.stringify(v))

  it.each<[string, unknown]>([
    ["a numeric firstName", { ...emptyForm("yes"), firstName: 42 }],
    ["a non-object", "yes"],
    ["an array", [{ ...emptyForm("yes"), firstName: "Thandi" }]],
  ])("%s is cleared and the guest starts at the ticket", (_, v) => {
    store(v)
    setup()
    expect(heading("You've been called up")).toBeInTheDocument()
    expect(window.sessionStorage.getItem(ANSWERS)).toBeNull()
  })
  it("a valid record still restores to the form", async () => {
    store({ ...emptyForm("yes"), firstName: "Thandi", surname: "Nkosi" })
    setup()
    expect(await findHeading("Your shirt")).toBeInTheDocument()
    expect(screen.getByLabelText("First name")).toHaveValue("Thandi")
    expect(window.sessionStorage.getItem(ANSWERS)).not.toBeNull()
  })
})

describe("sending the code", () => {
  const toSend = async (api: Api) => {
    setReducedMotion(true)
    const { user } = setup(api)
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "No")
    await fillNo(user)
    await submit(user)
    return user
  }

  it("shows the rate-limit line with the wait time and keeps the code box usable", async () => {
    await toSend(fakeApi({ requestCode: async () => ({ status: "rate_limited", retryAfterMs: 45000 }) }))
    expect(await screen.findByText(/Too many codes asked for\. Try again in 45 seconds/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend in 0:45/i })).toBeDisabled()
    expect(screen.getByLabelText("6-digit code")).toBeEnabled()
  })

  it("invalid_link shows the invite-key line at the send step and keeps the answers", async () => {
    const api = fakeApi({ requestCode: async () => ({ status: "invalid_link" }) })
    await toSend(api)
    expect(
      await screen.findByText("This link is missing its invite key. Ask Makes to send you the full link."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("First name")).toHaveValue("Sipho")
    expect(screen.getByLabelText("Email")).toHaveValue("sipho@example.com")
    expect(screen.queryByLabelText("6-digit code")).not.toBeInTheDocument()
  })

  it("rate limit without a wait time says a minute", async () => {
    await toSend(fakeApi({ requestCode: async () => ({ status: "rate_limited" }) }))
    expect(await screen.findByText(/Try again in a minute/)).toBeInTheDocument()
  })

  it("service unavailable keeps the answers and offers a retry that sends again", async () => {
    let calls = 0
    const api = fakeApi({
      requestCode: async () => (++calls === 1 ? { status: "service_unavailable" } : { status: "sent" }),
    })
    const user = await toSend(api)
    expect(
      await screen.findByText("We can't send codes right now. Your answers are kept, try again in a minute"),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("6-digit code")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(await screen.findByText(/New code sent to/)).toBeInTheDocument()
    expect(screen.getByLabelText("6-digit code")).toBeInTheDocument()
  })

  it("a network failure stays on the form with a retry line and keeps the answers", async () => {
    const api = fakeApi({
      requestCode: async () => {
        throw new Error("network")
      },
    })
    await toSend(api)
    expect(await screen.findByText("Couldn't send. Try again")).toBeInTheDocument()
    expect(screen.getByLabelText("First name")).toHaveValue("Sipho")
    expect(screen.getByRole("button", { name: /send my code/i })).toBeEnabled()
  })

  it("invalid_email from the backend lands on the email field", async () => {
    await toSend(fakeApi({ requestCode: async () => ({ status: "invalid_email" }) }))
    expect(await screen.findByText(/Enter an email address/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveFocus())
  })

  it("ignores a double press while sending", async () => {
    setReducedMotion(true)
    let release: () => void = () => {}
    const api = fakeApi({
      requestCode: () =>
        new Promise((res) => {
          release = () => res({ status: "sent" })
        }),
    })
    const { user } = setup(api)
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "No")
    await fillNo(user)
    await user.dblClick(screen.getByRole("button", { name: /send my code/i }))
    expect(api.requestCode).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Sending your code")).toBeInTheDocument()
    release()
    await screen.findByRole("heading", { name: "Seal it" })
  })
})

describe("change my answer", () => {
  it("returns to the prefilled form; re-verifying shows the updated stub with the same seat", async () => {
    setReducedMotion(true)
    let n = 0
    const api = fakeApi({
      verifyAndSave: async ({ payload }) =>
        ({
          status: ++n === 1 ? "saved" : "updated",
          ticketNo: 7,
          firstName: "Thandi",
          surname: "Nkosi",
          team: "Orlando Pirates",
          attending: payload.attending,
        }) as VerifyResult,
    })
    const { user } = setup(api)
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "Yes")
    await fillYes(user)
    await submit(user)
    await screen.findByRole("heading", { name: "Seal it" })
    await typeCode(user, "123456")
    await screen.findByRole("heading", { name: "You're on the list" })

    await user.click(screen.getByRole("button", { name: "Change my answer" }))
    expect(screen.getByLabelText("First name")).toHaveValue("Thandi")
    expect(screen.getByLabelText("Football team")).toHaveValue("Orlando Pirates")
    await user.click(screen.getByRole("button", { name: /change yes, maybe or no/i }))
    await user.click(screen.getByRole("radio", { name: "Maybe" }))
    await user.click(screen.getByRole("button", { name: /continue/i }))
    expect(screen.getByLabelText("First name")).toHaveValue("Thandi")
    await submit(user)
    await screen.findByRole("heading", { name: "Seal it" })
    await typeCode(user, "654321")
    expect(await screen.findByRole("heading", { name: "Your answer is updated" })).toBeInTheDocument()
    expect(screen.getByText("007")).toBeInTheDocument()
    expect(document.querySelector("[data-variant=maybe]")).toHaveTextContent(/pencilled in/i)
  })
})


describe("details form revalidation", () => {
  it("clears the sport error and checks Football after a failed submit, fixing the name first", async () => {
    setReducedMotion(true)
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "Yes")
    await submit(user)
    expect(await screen.findByText(/pick football or another sport/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText("First name"), "Thandi")
    await user.click(screen.getByRole("radio", { name: "Football" }))
    expect(screen.getByRole("radio", { name: "Football" })).toBeChecked()
    expect(screen.queryByText(/pick football or another sport/i)).not.toBeInTheDocument()
  })
})

describe("the world behind the panel", () => {
  const world = () => screen.getByTestId("world-stage")
  const bank = (n: number) => world().querySelector<HTMLElement>(`[data-layer=l2b-stadium-on-b${n}]`)!.style.opacity
  const banks = () => [1, 2, 3, 4].map((n) => Number(bank(n)))

  it("is aria-hidden, a sibling of main, and holds the pass in its pass zone", () => {
    setup()
    expect(world()).toHaveAttribute("aria-hidden", "true")
    expect(world().closest("main")).toBeNull()
    expect(world().querySelector(".pass-zone [data-testid=tear-handle]")).not.toBeNull()
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("button", { name: /tear open/i }))
  })

  it("lights a bank per beat and announces each strike; the lamps mirror the digits; no number before the code", async () => {
    const api = fakeApi()
    setReducedMotion(true)
    const { user } = setup(api)
    expect(world()).toHaveAttribute("data-beat", "cover")
    expect(banks()).toEqual([0, 0, 0, 0])

    await user.click(screen.getByRole("button", { name: /tear open/i }))
    expect(world()).toHaveAttribute("data-beat", "chapter1")
    expect(banks()).toEqual([1, 0, 0, 0])
    expect(live().some((n) => n.textContent === "1 of 4 floodlights on")).toBe(true)

    await pick(user, "Yes")
    expect(banks()).toEqual([1, 1, 0, 0])
    expect(live().some((n) => n.textContent === "You're in. The lights are coming on.")).toBe(true)
    // The shirt mirrors the name field: first name only, even with the surname typed into it. No number yet.
    await user.type(screen.getByLabelText("First name"), "Thandi Nkosi")
    await user.type(screen.getByLabelText("Surname"), "Nkosi")
    expect(world().querySelector("[data-name]")).toHaveAttribute("data-name", "THANDI")
    expect(world().querySelector("[data-number]")).toHaveAttribute("data-number", "")
    await user.clear(screen.getByLabelText("First name"))
    await user.type(screen.getByLabelText("First name"), "Thandi")
    await user.click(screen.getByRole("radio", { name: "Football" }))
    await user.type(screen.getByLabelText("Football team"), "Orlando Pirates")
    await user.type(screen.getByLabelText("Email"), "thandi@example.com")
    await user.click(screen.getByRole("radio", { name: "Email" }))
    await submit(user)
    await findHeading("Seal it")

    expect(world()).toHaveAttribute("data-beat", "code")
    expect(banks()).toEqual([1, 1, 1, 0])
    expect(live().some((n) => n.textContent === "3 of 4 floodlights on")).toBe(true)
    await user.type(screen.getByLabelText("6-digit code"), "123")
    const lamps = world().querySelectorAll(".code-lamp")
    expect(lamps).toHaveLength(6)
    expect(world().querySelectorAll(".code-lamp[data-on=true]")).toHaveLength(3)
    expect(world()).not.toHaveTextContent(/\d/) // lamps, never numerals
    for (const n of world().querySelectorAll("[data-number]")) expect(n).toHaveAttribute("data-number", "")
    expect(api.verifyAndSave).not.toHaveBeenCalled()
  })

  it("Maybe holds the second bank at half", async () => {
    setReducedMotion(true)
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "Maybe")
    expect(banks()).toEqual([1, 0.5, 0, 0])
    expect(live().some((n) => n.textContent === "Maybe. We'll keep a light on.")).toBe(true)
  })

  it("No: the world holds at one bank, Makes waves, no shirt, no stamp", async () => {
    setReducedMotion(true)
    const api = fakeApi({
      verifyAndSave: async () => ({ status: "saved", ticketNo: 4, firstName: "Sipho", surname: "Dlamini", attending: "no" }) as VerifyResult,
    })
    const { user } = setup(api)
    await user.click(screen.getByRole("button", { name: /tear open/i }))
    await pick(user, "No")
    expect(banks()).toEqual([1, 0, 0, 0])
    expect(world().querySelector("[data-name]")).toBeNull()
    await fillNo(user)
    await submit(user)
    await typeCode(user, "123456")
    await findHeading("Sorry you'll miss it, Sipho")
    expect(world()).toHaveAttribute("data-beat", "no-end")
    expect(banks()).toEqual([1, 0, 0, 0])
    expect(world().querySelector("[data-layer=l6-makes-wave]")).toHaveAttribute("data-on", "true")
    expect(world().querySelector("[data-variant]")).toBeNull()
    expect(world().querySelector("[data-name]")).toBeNull()
  })
})
