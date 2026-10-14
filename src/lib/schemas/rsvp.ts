import type { z } from "zod"
import type { rsvpFormSchema } from "@/lib/schemas/rsvpSchema"

/**
 * Mirrors convex/lib/validation.ts (validateRsvp) and convex/lib/otp.ts (isValidEmail).
 * Keep the bounds and conditional rules in step with the backend.
 */
export const LIMITS = {
  name: 100,
  team: 150,
  otherSport: 60,
  longText: 500,
  whatsapp: 30,
  email: 254,
} as const

export const CODE_LENGTH = 6

const LOCAL_RE = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
const WHATSAPP_RE = /^\+[1-9]\d{6,14}$/

/**
 * Same rule as the backend: strip separators, "00" -> "+", SA local 0XXXXXXXXX -> +27…,
 * otherwise assume a missing "+". Returns E.164 or null.
 */
export function normalizeWhatsapp(raw: string): string | null {
  let n = raw.replace(/[\s().-]/g, "")
  if (n.startsWith("00")) n = "+" + n.slice(2)
  else if (/^0\d{9}$/.test(n)) n = "+27" + n.slice(1)
  else if (!n.startsWith("+")) n = "+" + n
  return WHATSAPP_RE.test(n) ? n : null
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw)
  if (email.length === 0 || email.length > LIMITS.email) return false
  const at = email.indexOf("@")
  if (at < 1 || at !== email.lastIndexOf("@")) return false
  const local = email.slice(0, at)
  const labels = email.slice(at + 1).split(".")
  if (local.length > 64 || !LOCAL_RE.test(local)) return false
  if (labels.length < 2 || !labels.every((l) => LABEL_RE.test(l))) return false
  return labels[labels.length - 1].length >= 2
}

export type Attending = "yes" | "maybe" | "no"
export type Sport = "football" | "other"
export type InviteChannel = "email" | "whatsapp"

/** Field copy: what to do, not what went wrong. */
export const FIELD_MESSAGES = {
  firstName: "Add your first name",
  surname: "Add your surname",
  email: "Enter an email address, like name@example.com",
  sport: "Pick football or another sport",
  team: "Add your team",
  otherSport: "Say which sport",
  inviteChannel: "Pick how we should reach you",
  whatsapp: "Add your WhatsApp number",
  whatsappFormat: "Use a number like 082 123 4567 or +27 82 123 4567",
  plusOneName: "Tick “Bringing someone?” to add their name",
  otherSportOnly: "Pick “Other sport” to add a sport",
  whatsappOnly: "Pick WhatsApp to add a number",
  code: "Enter the 6-digit code",
} as const

export const max = (n: number) => `Keep this under ${n} characters`

/** Raw form state (what the inputs hold). */
export type RsvpFormValues = z.input<typeof rsvpFormSchema>

export const emptyForm = (attending: Attending): RsvpFormValues => ({
  attending,
  firstName: "",
  surname: "",
  email: "",
  preferredName: "",
  plusOne: false,
  plusOneName: "",
  sport: undefined,
  team: "",
  otherSport: "",
  funFact: "",
  howKnowMakes: "",
  inviteChannel: undefined,
  whatsapp: "",
})

/** The payload sent to `rsvp.verifyAndSave` (email and code travel separately). */
export type RsvpPayload = {
  firstName: string
  surname: string
  preferredName?: string
  attending: Attending
  plusOne?: boolean
  plusOneName?: string
  sport?: Sport
  team?: string
  otherSport?: string
  funFact?: string
  howKnowMakes?: string
  inviteChannel?: InviteChannel
  whatsapp?: string
}

const t = (s: string | undefined) => {
  const x = s?.trim()
  return x ? x : undefined
}

/** Trim, drop empties and keep only what applies to the answer, like the backend does. */
export function toPayload(v: RsvpFormValues): RsvpPayload {
  const base: RsvpPayload = {
    firstName: v.firstName.trim(),
    surname: v.surname.trim(),
    attending: v.attending,
  }
  if (v.attending === "no") return base
  const out: RsvpPayload = { ...base }
  const set = <K extends keyof RsvpPayload>(k: K, val: RsvpPayload[K] | undefined) => {
    if (val !== undefined) out[k] = val
  }
  set("preferredName", t(v.preferredName))
  out.plusOne = v.plusOne ?? false
  if (v.plusOne) set("plusOneName", t(v.plusOneName))
  set("sport", v.sport)
  set("team", t(v.team))
  if (v.sport === "other") set("otherSport", t(v.otherSport))
  set("funFact", t(v.funFact))
  set("howKnowMakes", t(v.howKnowMakes))
  set("inviteChannel", v.inviteChannel)
  if (v.inviteChannel === "whatsapp") set("whatsapp", t(v.whatsapp))
  return out
}

/** Keys the form can show an error on. */
export const FORM_FIELDS = [
  "firstName", "surname", "email", "preferredName", "plusOneName", "sport", "team",
  "otherSport", "funFact", "howKnowMakes", "inviteChannel", "whatsapp",
] as const
export type FormField = (typeof FORM_FIELDS)[number]

/** Map backend `invalid_payload.errors` (keyed by field) to friendly per-field copy. */
export function mapBackendErrors(errors: Record<string, string>): Partial<Record<FormField | "code", string>> {
  const out: Partial<Record<FormField | "code", string>> = {}
  for (const [key, raw] of Object.entries(errors)) {
    let msg: string
    if (raw === "Required") msg = (FIELD_MESSAGES as Record<string, string>)[key] ?? "Fill this in"
    else if (raw.startsWith("Max ")) msg = max(Number(/\d+/.exec(raw)?.[0] ?? 0))
    else if (key === "whatsapp" && raw === "Enter a valid number") msg = FIELD_MESSAGES.whatsappFormat
    else if (key === "email") msg = FIELD_MESSAGES.email
    else if (key === "code") msg = FIELD_MESSAGES.code
    else if (key === "plusOneName") msg = FIELD_MESSAGES.plusOneName
    else if (key === "otherSport") msg = FIELD_MESSAGES.otherSportOnly
    else if (key === "whatsapp") msg = FIELD_MESSAGES.whatsappOnly
    else msg = raw
    out[key as FormField | "code"] = msg
  }
  return out
}

/** Pull digits out of pasted text ("123 456", "123-456"). */
export function cleanCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, CODE_LENGTH)
}
