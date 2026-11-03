import { describe, expect, it } from "vitest"
import { CALENDAR_EVENT, buildIcs, foldLine, googleCalendarUrl, icsEscape, nextDay } from "@/lib/calendar"

describe("buildIcs", () => {
  const ics = buildIcs()
  const lines = ics.split("\r\n")

  it("uses CRLF only and ends with a CRLF", () => {
    expect(ics.endsWith("\r\n")).toBe(true)
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/)
  })

  it("is an all-day event on 21 December 2026 with an exclusive end", () => {
    expect(lines).toContain("DTSTART;VALUE=DATE:20261221")
    expect(lines).toContain("DTEND;VALUE=DATE:20261222")
    expect(ics).not.toMatch(/DTSTART:.*T/)
  })

  it("has a stable UID and the literal title and location", () => {
    expect(buildIcs()).toBe(ics)
    expect(lines).toContain(`UID:${CALENDAR_EVENT.uid}`)
    expect(lines).toContain("SUMMARY:Makes turns 30")
    expect(lines).toContain("LOCATION:Venue TBA")
    expect(lines[0]).toBe("BEGIN:VCALENDAR")
    expect(lines.at(-2)).toBe("END:VCALENDAR")
  })

  it("never folds a line past 75 octets", () => {
    for (const l of lines) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75)
  })
})

describe("foldLine", () => {
  it("leaves a short line alone", () => {
    expect(foldLine("SUMMARY:short")).toBe("SUMMARY:short")
  })

  it("folds at 75 octets with a leading space and unfolds back to the original", () => {
    const long = "DESCRIPTION:" + "a".repeat(200)
    const folded = foldLine(long)
    const parts = folded.split("\r\n")
    expect(parts.length).toBeGreaterThan(1)
    expect(new TextEncoder().encode(parts[0]).length).toBe(75)
    for (const p of parts.slice(1)) {
      expect(p.startsWith(" ")).toBe(true)
      expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75)
    }
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(long)
  })

  it("never splits a multi-byte character", () => {
    const long = "DESCRIPTION:" + "é".repeat(80)
    const folded = foldLine(long)
    for (const p of folded.split("\r\n")) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75)
    expect(folded.split("\r\n").map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(long)
  })
})

describe("icsEscape and nextDay", () => {
  it("escapes backslash, semicolon, comma and newlines", () => {
    expect(icsEscape("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne")
  })

  it("rolls over month and year ends", () => {
    expect(nextDay("2026-12-21")).toBe("2026-12-22")
    expect(nextDay("2026-12-31")).toBe("2027-01-01")
  })
})

describe("googleCalendarUrl", () => {
  const u = new URL(googleCalendarUrl())

  it("carries the event fields and nothing else", () => {
    expect(u.origin + u.pathname).toBe("https://calendar.google.com/calendar/render")
    expect([...u.searchParams.keys()].sort()).toEqual(["action", "dates", "details", "location", "text"])
    expect(u.searchParams.get("dates")).toBe("20261221/20261222")
    expect(u.searchParams.get("text")).toBe("Makes turns 30")
    expect(u.searchParams.get("location")).toBe("Venue TBA")
  })
})
