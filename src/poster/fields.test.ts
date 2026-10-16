import { describe, expect, it } from "vitest"
import type { SavedResult } from "@/lib/api"
import type { RsvpPayload } from "@/lib/schemas/rsvp"
import { PLUS_ONE_UNNAMED, POSTER_FIELD_KEYS, plusOneCredit, posterAlt, posterFieldsFor } from "@/poster/fields"

const saved = (over: Partial<SavedResult> = {}): SavedResult => ({
  status: "saved",
  ticketNo: 17,
  firstName: "Thandi",
  surname: "Nkosi",
  team: "Orlando Pirates",
  attending: "yes",
  ...over,
})

/** Everything a guest can type, filled in, so any leak would show in the poster's fields. */
const payload = (over: Partial<RsvpPayload> = {}): RsvpPayload => ({
  firstName: "Thandi",
  surname: "Nkosi",
  preferredName: "Thandi Nkosi",
  attending: "yes",
  plusOne: true,
  plusOneName: "Lerato Mokoena",
  sport: "football",
  team: "Orlando Pirates",
  funFact: "Ran the Comrades twice",
  howKnowMakes: "University",
  inviteChannel: "whatsapp",
  whatsapp: "+27 82 555 0199",
  ...over,
})

const EMAIL = "thandi.nkosi@example.com"
const KEY = "k7Qx2mPz9LwR"

describe("posterFieldsFor: only what the brief allows reaches the poster", () => {
  it("carries exactly the four poster fields, nothing else", () => {
    const f = posterFieldsFor(saved(), payload())!
    expect(Object.keys(f).sort()).toEqual([...POSTER_FIELD_KEYS].sort())
    expect(f).toEqual({ attending: "yes", name: "THANDI", number: "17", plusOne: "+ LERATO" })
  })

  it("never carries a surname, email, WhatsApp number, fun fact, team, sport or invite key", () => {
    // The email and the invite key travel separately in the page; smuggled onto the inputs here, they still never
    // reach the fields, because each field is picked by name.
    const smuggled = { ...payload(), email: EMAIL, inviteKey: KEY, k: KEY } as RsvpPayload
    const result = { ...saved(), email: EMAIL, inviteKey: KEY } as SavedResult
    const text = JSON.stringify(posterFieldsFor(result, smuggled)).toLowerCase()
    for (const leak of ["nkosi", "mokoena", EMAIL, "@", "+27", "555", "comrades", "pirates", "football", "university", "whatsapp", KEY.toLowerCase()])
      expect(text).not.toContain(leak)
  })

  it("drops the surname wherever it was typed: preferred name, first name, plus-one", () => {
    expect(posterFieldsFor(saved({ firstName: "Thandi Nkosi" }), payload({ preferredName: undefined }))!.name).toBe("THANDI")
    expect(posterFieldsFor(saved(), payload({ preferredName: "NKOSI thandi" }))!.name).toBe("THANDI")
    expect(posterFieldsFor(saved(), payload({ plusOneName: "Nkosi" }))!.plusOne).toBe(PLUS_ONE_UNNAMED)
  })

  it("uses the preferred name when given, else the first name", () => {
    expect(posterFieldsFor(saved(), payload({ preferredName: "Tee" }))!.name).toBe("TEE")
    expect(posterFieldsFor(saved(), payload({ preferredName: undefined }))!.name).toBe("THANDI")
  })

  it("a No gets no poster", () => {
    expect(posterFieldsFor(saved({ attending: "no" }), payload({ attending: "no" }))).toBeNull()
  })

  it("Maybe keeps its own stamp; the number is the seat", () => {
    const f = posterFieldsFor(saved({ attending: "maybe", ticketNo: 142 }), payload({ attending: "maybe" }))!
    expect(f.attending).toBe("maybe")
    expect(f.number).toBe("142")
  })

  it("no plus-one, no credit line", () => {
    expect(posterFieldsFor(saved(), payload({ plusOne: false, plusOneName: undefined }))!.plusOne).toBeNull()
    expect(posterFieldsFor(saved(), {})!.plusOne).toBeNull()
  })
})

describe("plusOneCredit", () => {
  it("their first word only, upper-cased", () => {
    expect(plusOneCredit("Lerato Mokoena", "Nkosi")).toBe("+ LERATO")
    expect(plusOneCredit("  lerato  ", "Nkosi")).toBe("+ LERATO")
  })
  it("no usable name is '+ 1'", () => {
    expect(plusOneCredit(undefined, "Nkosi")).toBe(PLUS_ONE_UNNAMED)
    expect(plusOneCredit("", "Nkosi")).toBe(PLUS_ONE_UNNAMED)
    expect(plusOneCredit("123 !!", "Nkosi")).toBe(PLUS_ONE_UNNAMED)
  })
  it("a first word that is the guest's surname (any case, any part of a compound) is '+ 1'", () => {
    expect(plusOneCredit("nkosi Lerato", "Nkosi")).toBe(PLUS_ONE_UNNAMED)
    expect(plusOneCredit("Dube", "Nkosi-Dube")).toBe(PLUS_ONE_UNNAMED)
    expect(plusOneCredit("Merwe", "van der Merwe")).toBe(PLUS_ONE_UNNAMED)
  })
})

describe("posterAlt", () => {
  it("names what is on the poster, as the brief words it", () => {
    const f = posterFieldsFor(saved(), payload({ plusOne: false }))!
    expect(posterAlt(f)).toBe("Poster: Makes holds up a red shirt reading THANDI 17. THIRTY UNITED, Monday 21 December 2026. Stamped Signed")
  })
  it("adds the Maybe stamp and the plus-one credit", () => {
    const f = posterFieldsFor(saved({ attending: "maybe" }), payload())!
    expect(posterAlt(f)).toMatch(/Stamped Pencilled in\. Credit: plus LERATO$/)
    expect(posterAlt({ ...f, plusOne: PLUS_ONE_UNNAMED })).toMatch(/Credit: plus one$/)
    expect(posterAlt(f)).not.toMatch(/nkosi|mokoena/i)
  })
})
