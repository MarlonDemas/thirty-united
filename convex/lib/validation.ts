import { v, type Infer } from "convex/values";
import {
  attendingValidator,
  inviteChannelValidator,
  sportValidator,
} from "../schema";

/** Raw RSVP payload as sent by the client (email and code travel separately). */
export const rsvpPayloadValidator = v.object({
  firstName: v.string(),
  surname: v.string(),
  preferredName: v.optional(v.string()),
  attending: attendingValidator,
  plusOne: v.optional(v.boolean()),
  plusOneName: v.optional(v.string()),
  sport: v.optional(sportValidator),
  team: v.optional(v.string()),
  otherSport: v.optional(v.string()),
  funFact: v.optional(v.string()),
  howKnowMakes: v.optional(v.string()),
  inviteChannel: v.optional(inviteChannelValidator),
  whatsapp: v.optional(v.string()),
});
export type RsvpPayload = Infer<typeof rsvpPayloadValidator>;

/** Cleaned payload that is safe to write to `guests` (minus system fields). */
export type CleanRsvp = RsvpPayload;

export type ValidationResult =
  | { ok: true; value: CleanRsvp }
  | { ok: false; errors: Record<string, string> };

const LIMITS = {
  name: 100,
  team: 150,
  otherSport: 60,
  longText: 500,
  whatsapp: 30,
} as const;

// Newlines/tabs become spaces; other control chars, bidi overrides/isolates and
// zero-width characters are removed (they enable spoofing and CSV/log trickery).
const WS_CONTROLS = /[\t\n\r\u2028\u2029]/g;
// oxlint-disable-next-line no-control-regex -- intentional: strip control/bidi chars
const STRIP = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/g;

/** Strips hostile characters, trims; empty string becomes undefined. */
function clean(s: string | undefined): string | undefined {
  const t = s?.replace(WS_CONTROLS, " ").replace(STRIP, "").trim();
  return t ? t : undefined;
}

/**
 * Normalises a WhatsApp number to canonical E.164 ("+" then 7-15 digits), or
 * returns null when invalid. Accepts South African local numbers ("082 123 4567").
 */
export function normalizeWhatsapp(raw: string): string | null {
  let n = raw.replace(/[\s().-]/g, "");
  if (n.startsWith("00")) n = "+" + n.slice(2);
  else if (/^0\d{9}$/.test(n)) n = "+27" + n.slice(1);
  else if (!n.startsWith("+")) n = "+" + n;
  return /^\+[1-9]\d{6,14}$/.test(n) ? n : null;
}

/**
 * Validates and normalises an RSVP payload. Mirrors the Zod schema used by the UI.
 * For attending "no" only names + attending are kept.
 */
export function validateRsvp(input: RsvpPayload): ValidationResult {
  const errors: Record<string, string> = {};

  const requireText = (key: string, raw: string | undefined, max: number) => {
    const val = clean(raw);
    if (!val) errors[key] = "Required";
    else if (val.length > max) errors[key] = `Max ${max} characters`;
    return val ?? "";
  };
  const optionalText = (key: string, raw: string | undefined, max: number) => {
    const val = clean(raw);
    if (val && val.length > max) errors[key] = `Max ${max} characters`;
    return val;
  };

  const firstName = requireText("firstName", input.firstName, LIMITS.name);
  const surname = requireText("surname", input.surname, LIMITS.name);

  const attending = input.attending;
  if (!(["yes", "maybe", "no"] as const).includes(attending)) {
    errors.attending = "Must be yes, maybe or no";
  }

  const value: CleanRsvp = { firstName, surname, attending };

  if (attending === "no") {
    return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
  }

  const preferredName = optionalText("preferredName", input.preferredName, LIMITS.name);
  if (preferredName) value.preferredName = preferredName;

  // plus one
  const plusOneName = optionalText("plusOneName", input.plusOneName, LIMITS.name);
  if (input.plusOne !== undefined) value.plusOne = input.plusOne;
  if (plusOneName) {
    if (input.plusOne === true) value.plusOneName = plusOneName;
    else errors.plusOneName = "Only allowed with a plus one";
  }

  // sport / team
  if (!input.sport) errors.sport = "Required";
  else value.sport = input.sport;

  const team = clean(input.team);
  if (!team) errors.team = "Required";
  else if (team.length > LIMITS.team) errors.team = `Max ${LIMITS.team} characters`;
  else value.team = team;

  const otherSport = optionalText("otherSport", input.otherSport, LIMITS.otherSport);
  if (input.sport === "other") {
    if (!otherSport) errors.otherSport ??= "Required";
    else value.otherSport = otherSport;
  } else if (otherSport) {
    errors.otherSport = "Only allowed when sport is other";
  }

  const funFact = optionalText("funFact", input.funFact, LIMITS.longText);
  if (funFact) value.funFact = funFact;
  const howKnowMakes = optionalText("howKnowMakes", input.howKnowMakes, LIMITS.longText);
  if (howKnowMakes) value.howKnowMakes = howKnowMakes;

  // invite channel / whatsapp
  if (!input.inviteChannel) errors.inviteChannel = "Required";
  else value.inviteChannel = input.inviteChannel;

  const rawWhatsapp = clean(input.whatsapp);
  if (input.inviteChannel === "whatsapp") {
    if (!rawWhatsapp) errors.whatsapp = "Required";
    else if (rawWhatsapp.length > LIMITS.whatsapp) {
      errors.whatsapp = `Max ${LIMITS.whatsapp} characters`;
    } else {
      const normalized = normalizeWhatsapp(rawWhatsapp);
      if (!normalized) errors.whatsapp = "Enter a valid number";
      else value.whatsapp = normalized;
    }
  } else if (rawWhatsapp) {
    errors.whatsapp = "Only allowed when the invite channel is WhatsApp";
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
