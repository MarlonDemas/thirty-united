import { describe, expect, it } from "vitest"
import { shirtName, shirtNumber } from "@/world/shirt"

describe("shirtName (never the surname)", () => {
  it("uses the preferred name, else the first name, upper-cased", () => {
    expect(shirtName({ preferredName: "Tee", firstName: "Thandi", surname: "Nkosi" })).toBe("TEE")
    expect(shirtName({ preferredName: "  ", firstName: "Thandi", surname: "Nkosi" })).toBe("THANDI")
  })
  it("drops a surname typed into the first-name field", () => {
    expect(shirtName({ firstName: "Thandi Nkosi", surname: "Nkosi" })).toBe("THANDI")
    expect(shirtName({ firstName: "Anna van der Merwe", surname: "van der Merwe" })).toBe("ANNA")
    expect(shirtName({ preferredName: "thandi NKOSI", surname: "Nkosi" })).toBe("THANDI")
  })
  it("shows only the first name token until a surname is entered", () => {
    expect(shirtName({ firstName: "Thandi Nkosi" })).toBe("THANDI")
    expect(shirtName({ firstName: "Thandi Nkosi", surname: "" })).toBe("THANDI")
    expect(shirtName({ preferredName: "Mary Ann", firstName: "Mary" })).toBe("MARY")
    expect(shirtName({ preferredName: "Mary Ann", firstName: "Mary", surname: "Smith" })).toBe("MARY ANN")
  })
  it("keeps a double first name; a name that only equals the surname leaves the shirt empty", () => {
    expect(shirtName({ firstName: "Mary Jane", surname: "Watson" })).toBe("MARY JANE")
    expect(shirtName({ firstName: "Nkosi", surname: "Nkosi" })).toBe("")
    expect(shirtName({ surname: "Nkosi" })).toBe("")
  })
})

describe("shirtName (surname variants, cap, format characters)", () => {
  it("drops the surname wherever it sits, ignoring punctuation", () => {
    expect(shirtName({ preferredName: "Nkosi Thandi", surname: "Nkosi" })).toBe("THANDI")
    expect(shirtName({ firstName: "Thandi Nkosi,", surname: "Nkosi" })).toBe("THANDI")
    expect(shirtName({ firstName: "Thandi (Nkosi)", surname: "Nkosi" })).toBe("THANDI")
    expect(shirtName({ firstName: "Thandi,Nkosi", surname: "Nkosi" })).toBe("THANDI")
    expect(shirtName({ firstName: "Thandi.Nkosi", surname: "Nkosi" })).toBe("THANDI")
  })
  it("drops any token of a compound surname", () => {
    expect(shirtName({ firstName: "Thandi Nkosi", surname: "Nkosi-Dube" })).toBe("THANDI")
    expect(shirtName({ firstName: "Thandi Nkosi-Dube", surname: "Nkosi-Dube" })).toBe("THANDI")
  })
  it("matches across Unicode normalisation forms", () => {
    const nfd = "Zoe\u0308"
    const nfc = "Zo\u00eb"
    expect(shirtName({ firstName: `Thandi ${nfd}`, surname: nfc })).toBe("THANDI")
    expect(shirtName({ firstName: `${nfd} Thandi`, surname: nfc })).toBe("THANDI")
    expect(shirtName({ firstName: nfd, surname: "Dube" })).toBe(nfd.toLocaleUpperCase())
  })
  it("never prints the surname, even when it is the whole name", () => {
    expect(shirtName({ firstName: "Nkosi", surname: "Nkosi" })).toBe("")
    expect(shirtName({ firstName: "Nkosi Nkosi", surname: "Nkosi" })).toBe("")
  })
  it("caps at 24 characters on a token boundary, hard-slicing one long token", () => {
    expect(shirtName({ firstName: "Alexandria Bartholomew Christopher", surname: "Smith" })).toBe("ALEXANDRIA BARTHOLOMEW")
    expect(shirtName({ firstName: "Wolfeschlegelsteinhausenbergerdorff" })).toBe("WOLFESCHLEGELSTEINHAUSEN")
    expect(shirtName({ firstName: "Wolfeschlegelsteinhausenbergerdorff" })).toHaveLength(24)
  })
  it("strips Unicode format characters such as the right-to-left override", () => {
    expect(shirtName({ firstName: "Than\u202Edi\u200B" })).toBe("THANDI")
    expect(shirtName({ firstName: "\u202EThandi Nkosi", surname: "Nkosi" })).toBe("THANDI")
  })
})

describe("shirtName (addresses, the preferred-name cap, the surname fallback)", () => {
  it("drops an email or a web address, in either field", () => {
    expect(shirtName({ firstName: "thandi@example.com", surname: "Nkosi" })).toBe("")
    expect(shirtName({ preferredName: "thandi@example.com", firstName: "Thandi", surname: "Nkosi" })).toBe("THANDI")
    expect(shirtName({ preferredName: "Tee thandi@example.com", surname: "Nkosi" })).toBe("TEE")
    expect(shirtName({ preferredName: "Tee example.com", surname: "Nkosi" })).toBe("TEE")
    expect(shirtName({ firstName: "thandi@example.com" })).toBe("")
  })
  it("caps a preferred name at two tokens", () => {
    expect(shirtName({ preferredName: "Thandi Mokoena", firstName: "Thandi", surname: "Nkosi" })).toBe("THANDI MOKOENA")
    expect(shirtName({ preferredName: "Thandi Lee Mokoena", firstName: "Thandi", surname: "Nkosi" })).toBe("THANDI LEE")
    expect(shirtName({ preferredName: "Nkosi Thandi Lee Mokoena", surname: "Nkosi" })).toBe("THANDI LEE")
  })
  it("a preferred name that is only the surname falls back to the first name's first token, never the surname", () => {
    expect(shirtName({ preferredName: "Nkosi", firstName: "Thandi Zola", surname: "Nkosi" })).toBe("THANDI")
    expect(shirtName({ preferredName: "Nkosi", firstName: "Nkosi Thandi", surname: "Nkosi" })).toBe("")
    expect(shirtName({ preferredName: "Nkosi", firstName: "Nkosi", surname: "Nkosi" })).toBe("")
  })
})

describe("shirtNumber (no number before verification)", () => {
  it("is null until the code is verified, then the ticket number with no padding", () => {
    expect(shirtNumber(17, false)).toBeNull()
    expect(shirtNumber(undefined, true)).toBeNull()
    expect(shirtNumber(17, true)).toBe("17")
  })
})
