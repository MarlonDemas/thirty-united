import { z } from "zod"
import { FIELD_MESSAGES, LIMITS, isValidEmail, max, normalizeWhatsapp } from "@/lib/schemas/rsvp"

// Skip zod 4's Function("") JIT probe: it trips the CSP (no 'unsafe-eval'). Set here, where zod first loads (the
// details view chunk), before any schema is built or parsed.
z.config({ jitless: true })

/** Form schema. Lives apart from rsvp.ts so zod only loads with the details view. */
export const rsvpFormSchema = z
  .object({
    attending: z.enum(["yes", "maybe", "no"]),
    firstName: z.string(),
    surname: z.string(),
    email: z.string(),
    preferredName: z.string(),
    plusOne: z.boolean(),
    plusOneName: z.string(),
    sport: z.enum(["football", "other"]).optional(),
    team: z.string(),
    otherSport: z.string(),
    funFact: z.string(),
    howKnowMakes: z.string(),
    inviteChannel: z.enum(["email", "whatsapp"]).optional(),
    whatsapp: z.string(),
  })
  .superRefine((v, ctx) => {
    const fail = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message })
    const required = (path: string, raw: string, limit: number, message: string) => {
      const t = raw.trim()
      if (!t) fail(path, message)
      else if (t.length > limit) fail(path, max(limit))
      return t
    }
    const optional = (path: string, raw: string, limit: number) => {
      const t = raw.trim()
      if (t.length > limit) fail(path, max(limit))
      return t
    }

    required("firstName", v.firstName, LIMITS.name, FIELD_MESSAGES.firstName)
    required("surname", v.surname, LIMITS.name, FIELD_MESSAGES.surname)
    if (!isValidEmail(v.email)) fail("email", FIELD_MESSAGES.email)

    // "No" keeps names and attending only.
    if (v.attending === "no") return

    optional("preferredName", v.preferredName, LIMITS.name)

    const plusOneName = optional("plusOneName", v.plusOneName, LIMITS.name)
    if (plusOneName && !v.plusOne) fail("plusOneName", FIELD_MESSAGES.plusOneName)

    if (!v.sport) fail("sport", FIELD_MESSAGES.sport)
    required("team", v.team, LIMITS.team, FIELD_MESSAGES.team)

    const otherSport = optional("otherSport", v.otherSport, LIMITS.otherSport)
    if (v.sport === "other") {
      if (!otherSport) fail("otherSport", FIELD_MESSAGES.otherSport)
    } else if (otherSport) {
      fail("otherSport", FIELD_MESSAGES.otherSportOnly)
    }

    optional("funFact", v.funFact, LIMITS.longText)
    optional("howKnowMakes", v.howKnowMakes, LIMITS.longText)

    if (!v.inviteChannel) fail("inviteChannel", FIELD_MESSAGES.inviteChannel)
    const rawWhatsapp = v.whatsapp.trim()
    if (v.inviteChannel === "whatsapp") {
      if (!rawWhatsapp) fail("whatsapp", FIELD_MESSAGES.whatsapp)
      else if (rawWhatsapp.length > LIMITS.whatsapp) fail("whatsapp", max(LIMITS.whatsapp))
      else if (normalizeWhatsapp(rawWhatsapp) === null) {
        fail("whatsapp", FIELD_MESSAGES.whatsappFormat)
      }
    } else if (rawWhatsapp) {
      fail("whatsapp", FIELD_MESSAGES.whatsappOnly)
    }
  })
