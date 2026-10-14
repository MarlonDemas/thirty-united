import { describe, expect, it } from "vitest"
import {
  cleanCode,
  emptyForm,
  isValidEmail,
  mapBackendErrors,
  normalizeWhatsapp,
  toPayload,
  type RsvpFormValues,
} from "./rsvp"
import { rsvpFormSchema } from "./rsvpSchema"

const yes = (over: Partial<RsvpFormValues> = {}): RsvpFormValues => ({
  ...emptyForm("yes"),
  firstName: "Thandi",
  surname: "Nkosi",
  email: "thandi@example.com",
  sport: "football",
  team: "Orlando Pirates",
  inviteChannel: "email",
  ...over,
})

const errorsOf = (v: RsvpFormValues) => {
  const r = rsvpFormSchema.safeParse(v)
  if (r.success) return {}
  return Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))
}

describe("isValidEmail", () => {
  it.each(["a@b.co", "  Thandi@Example.COM ", "first.last+tag@sub.example.org"])("accepts %j", (e) => {
    expect(isValidEmail(e)).toBe(true)
  })
  it.each(["", "a", "a@b", "a@@b.co", "@b.co", "a@b.c", "a b@c.co", "a@-b.co"])("rejects %j", (e) => {
    expect(isValidEmail(e)).toBe(false)
  })
})

describe("rsvpFormSchema", () => {
  it("accepts a complete Yes answer", () => {
    expect(errorsOf(yes())).toEqual({})
  })

  it("only needs names and email for No", () => {
    const v = { ...emptyForm("no"), firstName: "Sipho", surname: "Dlamini", email: "s@example.com" }
    expect(errorsOf(v)).toEqual({})
    expect(errorsOf({ ...v, email: "nope" }).email).toBeDefined()
  })

  it("requires names, sport, team and channel for Yes and Maybe", () => {
    const e = errorsOf({ ...emptyForm("maybe") })
    expect(Object.keys(e).sort()).toEqual(["email", "firstName", "inviteChannel", "sport", "surname", "team"])
  })

  it("trims before checking required fields", () => {
    expect(errorsOf(yes({ firstName: "   " })).firstName).toBeDefined()
    expect(errorsOf(yes({ team: "  " })).team).toBeDefined()
  })

  it("enforces bounds: name 100, team 150, other sport 60, text 500, whatsapp 30", () => {
    expect(errorsOf(yes({ firstName: "a".repeat(100) })).firstName).toBeUndefined()
    expect(errorsOf(yes({ firstName: "a".repeat(101) })).firstName).toBeDefined()
    expect(errorsOf(yes({ surname: "a".repeat(101) })).surname).toBeDefined()
    expect(errorsOf(yes({ preferredName: "a".repeat(101) })).preferredName).toBeDefined()
    expect(errorsOf(yes({ team: "a".repeat(150) })).team).toBeUndefined()
    expect(errorsOf(yes({ team: "a".repeat(151) })).team).toBeDefined()
    expect(errorsOf(yes({ funFact: "a".repeat(500) })).funFact).toBeUndefined()
    expect(errorsOf(yes({ funFact: "a".repeat(501) })).funFact).toBeDefined()
    expect(errorsOf(yes({ howKnowMakes: "a".repeat(501) })).howKnowMakes).toBeDefined()
    expect(errorsOf(yes({ sport: "other", otherSport: "a".repeat(61) })).otherSport).toBeDefined()
  })

  it("requires the other sport only when sport is other, and forbids it otherwise", () => {
    expect(errorsOf(yes({ sport: "other", team: "Proteas" })).otherSport).toBeDefined()
    expect(errorsOf(yes({ sport: "other", team: "Proteas", otherSport: "Cricket" }))).toEqual({})
    expect(errorsOf(yes({ otherSport: "Cricket" })).otherSport).toBeDefined()
  })

  it("allows a plus-one name only with a plus one, and keeps it optional", () => {
    expect(errorsOf(yes({ plusOne: true }))).toEqual({})
    expect(errorsOf(yes({ plusOne: true, plusOneName: "Lerato" }))).toEqual({})
    expect(errorsOf(yes({ plusOne: false, plusOneName: "Lerato" })).plusOneName).toBeDefined()
  })

  it("requires a WhatsApp number only for the WhatsApp channel", () => {
    expect(errorsOf(yes({ inviteChannel: "whatsapp" })).whatsapp).toBeDefined()
    expect(errorsOf(yes({ inviteChannel: "whatsapp", whatsapp: "+27 82 123 4567" }))).toEqual({})
    expect(errorsOf(yes({ inviteChannel: "whatsapp", whatsapp: "(27) 82-123.4567" }))).toEqual({})
    expect(errorsOf(yes({ inviteChannel: "email", whatsapp: "+27821234567" })).whatsapp).toBeDefined()
  })

  it("normalizes WhatsApp numbers like the backend", () => {
    expect(normalizeWhatsapp("082 123 4567")).toBe("+27821234567")
    expect(normalizeWhatsapp("+27 82 123 4567")).toBe("+27821234567")
    expect(normalizeWhatsapp("0027821234567")).toBe("+27821234567")
    expect(normalizeWhatsapp("27821234567")).toBe("+27821234567")
    expect(normalizeWhatsapp("+44 7700 900123")).toBe("+447700900123")
    expect(normalizeWhatsapp("082 123")).toBeNull()
    expect(normalizeWhatsapp("0000000000")).toBeNull()
    expect(normalizeWhatsapp("abc")).toBeNull()
  })

  it("mirrors the backend number rule: 7 to 15 digits after normalising", () => {
    const wa = (whatsapp: string) => errorsOf(yes({ inviteChannel: "whatsapp", whatsapp })).whatsapp
    expect(wa("0821234567")).toBeUndefined()
    expect(wa("0000000000")).toBeDefined()
    expect(wa("+123456")).toBeDefined()
    expect(wa("+1234567")).toBeUndefined()
    expect(wa("+" + "1".repeat(15))).toBeUndefined()
    expect(wa("+" + "1".repeat(16))).toBeDefined()
    expect(wa("+" + "1".repeat(30))).toBeDefined() // 31 chars
    expect(wa("+27 82 abc 4567")).toBeDefined()
  })

  it("accepts accents and diacritics in names", () => {
    expect(errorsOf(yes({ firstName: "Zoë", surname: "Müller-Ndlovu" }))).toEqual({})
  })
})

describe("toPayload", () => {
  it("keeps only names and attending for No", () => {
    const v = { ...emptyForm("no"), firstName: " Sipho ", surname: "Dlamini", email: "s@example.com", team: "x" }
    expect(toPayload(v)).toEqual({ firstName: "Sipho", surname: "Dlamini", attending: "no" })
  })

  it("trims, drops blanks and strips inapplicable fields", () => {
    const p = toPayload(
      yes({
        preferredName: " ",
        plusOne: false,
        plusOneName: "ignored",
        otherSport: "ignored",
        whatsapp: "ignored",
        funFact: " I can juggle ",
      }),
    )
    expect(p).toEqual({
      firstName: "Thandi",
      surname: "Nkosi",
      attending: "yes",
      plusOne: false,
      sport: "football",
      team: "Orlando Pirates",
      funFact: "I can juggle",
      inviteChannel: "email",
    })
  })

  it("keeps the number and plus-one name when they apply", () => {
    const p = toPayload(
      yes({ plusOne: true, plusOneName: "Lerato", inviteChannel: "whatsapp", whatsapp: "+27 82 123 4567" }),
    )
    expect(p.plusOneName).toBe("Lerato")
    expect(p.whatsapp).toBe("+27 82 123 4567")
    expect(p).not.toHaveProperty("email")
  })
})

describe("mapBackendErrors", () => {
  it("maps backend keys to friendly field copy", () => {
    const m = mapBackendErrors({
      firstName: "Required",
      team: "Max 150 characters",
      whatsapp: "Enter a valid number",
      email: "Enter a valid email",
      code: "Enter the 6-digit code",
    })
    expect(m.firstName).toMatch(/first name/i)
    expect(m.team).toContain("150")
    expect(m.whatsapp).toMatch(/\+27/)
    expect(m.email).toMatch(/email/i)
    expect(m.code).toMatch(/6-digit/)
  })
})

describe("cleanCode", () => {
  it("strips spaces and dashes and caps at six digits", () => {
    expect(cleanCode("123 456")).toBe("123456")
    expect(cleanCode("123-456-789")).toBe("123456")
    expect(cleanCode("ab1c2")).toBe("12")
  })
})
