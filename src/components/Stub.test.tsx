import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Stamp } from "@/components/Stamp"
import { Stub } from "@/components/Stub"
import { StubView } from "@/components/StubView"
import { formatSeat } from "@/lib/seat"
import type { SavedResult } from "@/lib/api"

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
  it("Yes is the solid stamp with the date", () => {
    render(<Stamp variant="yes" />)
    const el = document.querySelector("[data-variant=yes]")!
    expect(el).toHaveTextContent(/admit one/i)
    expect(el).toHaveTextContent(/21 dec 2026/i)
    expect(el.className).toContain("bg-red")
    expect(screen.queryByText("Maybe")).not.toBeInTheDocument()
  })

  it("Maybe is outlined, with the help icon and a MAYBE tag", () => {
    render(<Stamp variant="maybe" />)
    const el = document.querySelector("[data-variant=maybe]")!
    expect(el.className).toContain("bg-transparent")
    expect(el.className).not.toContain("bg-red ")
    expect(screen.getByText("Maybe")).toBeInTheDocument()
    expect(el.querySelector("svg.lucide-circle-help, svg.lucide-circle-question-mark")).not.toBeNull()
  })
})

describe("Stub table", () => {
  it("renders label and value rows", () => {
    render(<Stub rows={[{ label: "SEAT", value: "007" }]} />)
    expect(screen.getByText("SEAT")).toBeInTheDocument()
    expect(screen.getByText("007")).toBeInTheDocument()
  })
})

describe("StubView", () => {
  it("Yes: name, team, three-digit seat, date and a heading", () => {
    render(<StubView result={saved()} payload={{ firstName: "Thandi", surname: "Nkosi", attending: "yes" }} onChange={() => {}} />)
    expect(screen.getByRole("heading", { level: 1, name: "You're on the list" })).toHaveFocus()
    expect(screen.getByTestId("guest-name")).toHaveTextContent("Thandi Nkosi")
    expect(screen.getByTestId("team")).toHaveTextContent("ORLANDO PIRATES")
    expect(screen.getByText("007")).toBeInTheDocument()
    expect(screen.getAllByText("21 DEC 2026").length).toBeGreaterThan(0)
    expect(screen.getByText("YES")).toBeInTheDocument()
  })

  it("Maybe: held seat and the outlined stamp", () => {
    render(<StubView result={saved({ attending: "maybe" })} onChange={() => {}} />)
    expect(screen.getByRole("heading", { level: 1, name: "We've held your seat" })).toBeInTheDocument()
    expect(document.querySelector("[data-variant=maybe]")).not.toBeNull()
    expect(screen.getByText("MAYBE", { selector: "dd" })).toBeInTheDocument()
  })

  it("no team shows NEUTRAL in muted type", () => {
    render(<StubView result={saved({ team: undefined })} onChange={() => {}} />)
    const t = screen.getByTestId("team")
    expect(t).toHaveTextContent("NEUTRAL")
    expect(t.className).toContain("text-muted-foreground")
  })

  it("other sport shows the sport before the team", () => {
    render(
      <StubView
        result={saved({ team: "Proteas" })}
        payload={{ firstName: "Thandi", surname: "Nkosi", attending: "yes", sport: "other", otherSport: "Cricket", team: "Proteas" }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByTestId("team")).toHaveTextContent("CRICKET: PROTEAS")
  })

  it("a 40+ character surname wraps instead of clipping", () => {
    const surname = "Montgomery-Featherstonehaugh-Cholmondeley"
    render(<StubView result={saved({ surname })} onChange={() => {}} />)
    const el = screen.getByTestId("guest-name")
    expect(el).toHaveTextContent(surname)
    expect(el.className).toContain("break-words")
  })

  it("shows the server surname even when the local form surname differs", () => {
    render(<StubView result={saved({ surname: "Nkosi" })} payload={{ firstName: "Thandi", surname: "Typo", attending: "yes" }} onChange={() => {}} />)
    expect(screen.getByTestId("guest-name")).toHaveTextContent("Thandi Nkosi")
    expect(screen.getByTestId("guest-name")).not.toHaveTextContent("Typo")
  })

  it("updated: says so, keeps the seat", () => {
    render(<StubView result={saved({ status: "updated" })} onChange={() => {}} />)
    expect(screen.getByRole("heading", { level: 1, name: "Your answer is updated" })).toBeInTheDocument()
    expect(screen.getByText("007")).toBeInTheDocument()
  })

  it("No: sorry heading, void ticket, no seat, no stamp, change-of-mind link", () => {
    render(<StubView result={saved({ attending: "no", team: undefined })} onChange={() => {}} />)
    expect(screen.getByRole("heading", { level: 1, name: "Sorry you'll miss it, Thandi" })).toBeInTheDocument()
    expect(screen.queryByText("SEAT")).not.toBeInTheDocument()
    expect(screen.queryByText("007")).not.toBeInTheDocument()
    expect(document.querySelector("[data-variant]")).toBeNull()
    expect(document.querySelector("line")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Changed your mind?" })).toBeInTheDocument()
  })
})
