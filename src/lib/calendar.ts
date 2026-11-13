/**
 * Add to calendar: the event as an all-day .ics file and a Google Calendar link. Pure and framework-free (importable
 * from the vanilla world). It carries event fields only, never anything the guest typed.
 */

export const CALENDAR_EVENT = {
  title: "Makes turns 30",
  /** First night of the all-day event, ISO date. */
  date: "2026-12-21",
  location: "Venue TBA",
  description: "Thirty United, Makes's 30th. I'll send the venue and details closer to the day.",
  uid: "thirty-united-20261221@thirty-united",
} as const

export const ICS_FILE_NAME = "thirty-united.ics"

/** DTSTAMP is a fixed instant so the file is byte-for-byte the same every time. */
const DTSTAMP = "20261103T000000Z"

const compact = (isoDate: string) => isoDate.replaceAll("-", "")

/** The day after an ISO date (an all-day DTEND is exclusive). UTC maths, so no timezone can shift it. */
export function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** RFC 5545 TEXT escaping: backslash, semicolon, comma and newlines. */
export function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n")
}

/** Fold a content line to at most 75 octets (UTF-8) per physical line; continuation lines start with one space. */
export function foldLine(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out: string[] = []
  let cur = ""
  let curBytes = 0
  let limit = 75 // the first line holds 75 octets; each continuation holds 74 after its leading space
  for (const ch of line) {
    const n = enc.encode(ch).length
    if (curBytes + n > limit) {
      out.push(cur)
      cur = ""
      curBytes = 0
      limit = 74
    }
    cur += ch
    curBytes += n
  }
  out.push(cur)
  return out.join("\r\n ")
}

export type CalendarEvent = typeof CALENDAR_EVENT

/** The .ics text: CRLF line endings, folded, an all-day VEVENT with a stable UID. */
export function buildIcs(e: CalendarEvent = CALENDAR_EVENT): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Thirty United//Matchday//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${DTSTAMP}`,
    `DTSTART;VALUE=DATE:${compact(e.date)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `LOCATION:${icsEscape(e.location)}`,
    `DESCRIPTION:${icsEscape(e.description)}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.map(foldLine).join("\r\n") + "\r\n"
}

/** A Google Calendar "create event" link with the event fields only. */
export function googleCalendarUrl(e: CalendarEvent = CALENDAR_EVENT): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${compact(e.date)}/${compact(nextDay(e.date))}`,
    details: e.description,
    location: e.location,
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}
