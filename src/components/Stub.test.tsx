import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Stamp } from "@/components/Stamp"
import { StubView } from "@/components/StubView"
import { formatSeat } from "@/lib/seat"
import type { SavedResult } from "@/lib/api"
import type { RsvpPayload } from "@/lib/schemas/rsvp"

const PAYLOAD: RsvpPayload = { firstName: "Thandi", surname: "Nkosi", attending: "yes" }

const saved = (over: Partial<SavedResult> = {}): SavedResult => ({
  status: "saved",
  ticketNo: 7,
  firstName: "Thandi",
  surname: "Nkosi",
  team: "Orlando Pirates",
  attending: "yes",
  ...over,
})

describe("formatSeat", () => {
  it.each([
    [7, "007"],
    [42, "042"],
    [123, "123"],
    [1234, "1234"],
    [undefined, "---"],
  ])("%s -> %s", (n, out) => expect(formatSeat(n)).toBe(out))
})

describe("Stamp", () => {
  it("Yes is the solid poster-red stamp, SIGNED with the date, and no white text on the red", () => {
    render(<Stamp variant="yes" />)
    const el = document.querySelector("[data-variant=yes]")!
    expect(el).toHaveTextContent(/signed/i)
    expect(el).toHaveTextContent(/21 dec 2026/i)
    expect(el.className).toContain("bg-poster-red")
    expect(el.className).toContain("text-panel")
    expect(el.className).not.toMatch(/text-(white|foreground)\b/)
  })

  it("Maybe is a panel-filled outline with the pencil, PENCILLED IN", () => {
    render(<Stamp variant="maybe" />)
    const el = document.querySelector("[data-variant=maybe]")!
    expect(el).toHaveTextContent(/pencilled in/i)
    expect(el.className).toContain("bg-panel")
    expect(el.className).not.toContain("bg-poster-red")
    expect(el.querySelector("svg.lucide-pencil")).not.toBeNull()
  })
})

describe("StubView (the signed panel and the No end)", () => {
  it("Yes: heading takes focus; seat and shirt in mono, from the saved ticket number", () => {
    render(<StubView payload={PAYLOAD} result={saved()} onChange={() => {}} />)
    expect(screen.getByRole("heading", { level: 1, name: "You're on the list" })).toHaveFocus()
    expect(screen.getByTestId("seat-line")).toHaveTextContent("Seat 007 · Shirt 7")
    expect(screen.getByText("Signed")).toHaveClass("sr-only")
  })

  it("Maybe: held seat, and the stamp's words for screen readers", () => {
    render(<StubView payload={PAYLOAD} result={saved({ attending: "maybe" })} onChange={() => {}} />)
    expect(screen.getByRole("heading", { level: 1, name: "We've held your seat" })).toBeInTheDocument()
    expect(screen.getByText("Pencilled in")).toHaveClass("sr-only")
  })

  it("updated: says so, keeps the seat", () => {
    render(<StubView payload={PAYLOAD} result={saved({ status: "updated" })} onChange={() => {}} />)
    expect(screen.getByRole("heading", { level: 1, name: "Your answer is updated" })).toBeInTheDocument()
    expect(screen.getByTestId("seat-line")).toHaveTextContent("007")
  })

  it("Change my answer goes back", () => {
    const onChange = vi.fn()
    render(<StubView payload={PAYLOAD} result={saved()} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Change my answer" }))
    expect(onChange).toHaveBeenCalledOnce()
  })

  it("No: sorry heading, no seat, no stamp words, and a secondary (not red) Changed your mind?", () => {
    render(<StubView payload={PAYLOAD} result={saved({ attending: "no", team: undefined })} onChange={() => {}} />)
    expect(screen.getByRole("heading", { level: 1, name: "Sorry you'll miss it, Thandi" })).toBeInTheDocument()
    expect(screen.queryByTestId("seat-line")).not.toBeInTheDocument()
    expect(screen.queryByText(/signed|pencilled/i)).not.toBeInTheDocument()
    const back = screen.getByRole("button", { name: "Changed your mind?" })
    expect(back.className).not.toMatch(/shirt-red|poster-red/)
  })

  it("Yes and Maybe: Save your poster arrives from its own lazy chunk, with the no-copy line", async () => {
    render(<StubView payload={PAYLOAD} result={saved({ attending: "maybe" })} onChange={() => {}} />)
    expect(await screen.findByRole("button", { name: "Save your poster" })).toBeInTheDocument()
    expect(screen.getByText("Save it now. We don't keep a copy.")).toBeInTheDocument()
  })

  it("No: no poster, so no Save or Share", async () => {
    render(<StubView payload={PAYLOAD} result={saved({ attending: "no" })} onChange={() => {}} />)
    await act(async () => {})
    expect(screen.queryByRole("button", { name: "Save your poster" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull()
  })
})
