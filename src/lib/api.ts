import type { RsvpPayload } from "@/lib/schemas/rsvp"

/** Mirrors the return unions of convex/otp.ts `requestCode` and convex/rsvp.ts `verifyAndSave`. */
export type RequestCodeResult =
  | { status: "sent" }
  | { status: "rate_limited"; retryAfterMs?: number }
  | { status: "invalid_email" }
  | { status: "invalid_link" }
  | { status: "service_unavailable" }

export type VerifyResult =
  | {
      status: "saved" | "updated"
      ticketNo: number
      firstName: string
      surname: string
      team?: string
      attending: "yes" | "maybe" | "no"
    }
  | { status: "invalid_code"; attemptsLeft: number }
  | { status: "code_expired" }
  | { status: "too_many_attempts" }
  | { status: "no_code" }
  | { status: "invalid_payload"; errors: Record<string, string> }
  | { status: "invalid_link" }
  | { status: "service_unavailable" }

export type SavedResult = Extract<VerifyResult, { status: "saved" | "updated" }>

/** The two backend calls the page needs. Tests pass fakes; main.tsx wires Convex. */
export interface RsvpApi {
  requestCode(email: string): Promise<RequestCodeResult>
  verifyAndSave(args: { email: string; code: string; payload: RsvpPayload }): Promise<VerifyResult>
}
