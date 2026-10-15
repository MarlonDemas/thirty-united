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
  it("keeps a double first name and a name that only equals the surname", () => {
    expect(shirtName({ firstName: "Mary Jane", surname: "Watson" })).toBe("MARY JANE")
    expect(shirtName({ firstName: "Nkosi", surname: "Nkosi" })).toBe("NKOSI")
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
  it("leaves a name that is only the surname unchanged", () => {
    expect(shirtName({ firstName: "Nkosi", surname: "Nkosi" })).toBe("NKOSI")
    expect(shirtName({ firstName: "Nkosi Nkosi", surname: "Nkosi" })).toBe("NKOSI NKOSI")
  })
  it("caps at 24 characters on a token boundary, hard-slicing one long token", () => {
    expect(shirtName({ firstName: "Alexandria Bartholomew Christopher" })).toBe("ALEXANDRIA BARTHOLOMEW")
    expect(shirtName({ firstName: "Wolfeschlegelsteinhausenbergerdorff" })).toBe("WOLFESCHLEGELSTEINHAUSEN")
    expect(shirtName({ firstName: "Wolfeschlegelsteinhausenbergerdorff" })).toHaveLength(24)
  })
  it("strips Unicode format characters such as the right-to-left override", () => {
    expect(shirtName({ firstName: "Than\u202Edi\u200B" })).toBe("THANDI")
    expect(shirtName({ firstName: "\u202EThandi Nkosi", surname: "Nkosi" })).toBe("THANDI")
  })
})

describe("shirtNumber (no number before verification)", () => {
  it("is null until the code is verified, then the ticket number with no padding", () => {
    expect(shirtNumber(17, false)).toBeNull()
    expect(shirtNumber(undefined, true)).toBeNull()
    expect(shirtNumber(17, true)).toBe("17")
  })
})
