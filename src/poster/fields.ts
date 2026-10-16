import type { SavedResult } from "@/lib/api"
import type { RsvpPayload } from "@/lib/schemas/rsvp"
import { nameKey, shirtName, shirtNumber, surnameKeys } from "@/world/shirt"

/**
 * Everything the saved poster may show, and nothing else. The compositor takes only this, so a surname, email,
 * WhatsApp number, fun fact, team, sport or invite key cannot reach the image: they are never copied in here.
 */
export type PosterFields = {
  /** Yes is the solid "SIGNED" stamp, Maybe the outlined "PENCILLED IN". A No gets no poster. */
  attending: "yes" | "maybe"
  /** The name on the shirt: the preferred or first name, never the surname (`shirtName`). */
  name: string
  /** The shirt number: the seat, `ticketNo`. */
  number: string
  /** The plus-one credit, "+ LERATO" (their first word only), or null with no plus-one. */
  plusOne: string | null
}

/** The exact keys a PosterFields carries (the privacy test checks against this list). */
export const POSTER_FIELD_KEYS = ["attending", "name", "number", "plusOne"] as const

/** A plus-one with no name given still gets a credit line. */
export const PLUS_ONE_UNNAMED = "+ 1"

/**
 * The plus-one's credit: their first word only, so a typed surname never shows, and never a word that is the
 * guest's own surname. With no usable name, "+ 1".
 */
export function plusOneCredit(plusOneName: string | undefined, guestSurname: string): string {
  const first = shirtName({ firstName: plusOneName ?? "" })
  return first && !surnameKeys(guestSurname).has(nameKey(first)) ? `+ ${first}` : PLUS_ONE_UNNAMED
}

/**
 * The poster's fields from the saved answer. Null for a No (no poster). The name follows the live shirt exactly:
 * preferred name, else first name, with any surname token dropped.
 */
export function posterFieldsFor(saved: SavedResult, payload: Pick<RsvpPayload, "preferredName" | "plusOne" | "plusOneName"> = {}): PosterFields | null {
  if (saved.attending === "no") return null
  const number = shirtNumber(saved.ticketNo, true)
  if (number === null) return null
  return {
    attending: saved.attending,
    name: shirtName({ preferredName: payload.preferredName, firstName: saved.firstName, surname: saved.surname }),
    number,
    plusOne: payload.plusOne ? plusOneCredit(payload.plusOneName, saved.surname) : null,
  }
}

/** The viewer's alt text (recommendation, "Saving and sharing"), plus the stamp and the plus-one credit. */
export function posterAlt(f: PosterFields): string {
  const stamp = f.attending === "maybe" ? "Stamped Pencilled in" : "Stamped Signed"
  const plus = f.plusOne ? `. Credit: ${f.plusOne === PLUS_ONE_UNNAMED ? "plus one" : f.plusOne.replace(/^\+ /, "plus ")}` : ""
  return `Poster: Makes holds up a red shirt reading ${f.name} ${f.number}. THIRTY UNITED, Monday 21 December 2026. ${stamp}${plus}`
}
