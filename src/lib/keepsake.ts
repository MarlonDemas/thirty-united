import { shirtName, shirtNumber } from "@/world/shirt"

/** What the saved reply plus the guest's own answers give the shirts: the name they go by over their seat number. */
export type ShirtSource = { firstName: string; ticketNo: number; surname?: string; preferredName?: string }

/** The guest's shirt: preferred-or-first name (never the surname) over `ticketNo`. Null when there is no usable number. */
export function shirtFor(r: ShirtSource): { name: string; number: string } | null {
  const number = shirtNumber(r.ticketNo, true)
  return number === null ? null : { name: shirtName(r), number }
}
