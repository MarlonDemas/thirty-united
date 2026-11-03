import { describe, expect, it } from "vitest"
import { shirtFor } from "@/lib/keepsake"

describe("shirtFor", () => {
  it("uses the preferred name over the seat number", () => {
    expect(shirtFor({ firstName: "Thandiwe", surname: "Nkosi", preferredName: "Thandi", ticketNo: 7 })).toEqual({ name: "THANDI", number: "7" })
  })

  it("falls back to the first name and drops a surname typed into the name field", () => {
    expect(shirtFor({ firstName: "Lerato Dlamini", surname: "Dlamini", ticketNo: 112 })).toEqual({ name: "LERATO", number: "112" })
  })

  it("has no shirt without a usable number", () => {
    expect(shirtFor({ firstName: "Sam", ticketNo: Number.NaN })).toBeNull()
  })
})
