import { clean, LIMITS, NOTICE_VERSION_RE } from "./validation";
import { hmacCode } from "./otp";

/** Privacy-notice versions a decline may cite. Bump together with the client. */
export const DECLINE_NOTICE_VERSIONS: readonly string[] = ["popia-2026-11-v2"];

export const REASON_MAX = 140;

const NAME_RE = /^[\p{L}\p{M}' ’.\- ]+$/u;
const HAS_LETTER_RE = /\p{L}/u;
const URL_RE = /https?:\/\/|www\./i;
// Hangul fillers and braille blank render as nothing but are letters/symbols. The fillers are also
// Default_Ignorable; listed anyway so the intent survives a Unicode-table change.
const KEY_STRIP = /[\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}\u115F\u1160\u3164\uFFA0\u2800]/gu;
// Hidden text that must never reach storage or exports.
const HIDDEN = /[\p{Cf}\p{Default_Ignorable_Code_Point}]/gu;
const APOSTROPHES = /[’‘ʼ`´]/g;
const TAG_BLOCK = /[\u{E0020}-\u{E007E}]/gu;

export interface DeclineInput {
  firstName: string;
  surname: string;
  reason?: string;
  noticeVersion: string;
}

export interface CleanDecline {
  firstName: string;
  surname: string;
  reason?: string;
  noticeVersion: string;
  nameKey: string;
}

export type DeclineValidation =
  | { ok: true; value: CleanDecline }
  | { ok: false; errors: Record<string, string> };

function keyPart(name: string): string {
  return name
    .replace(APOSTROPHES, "'")
    .normalize("NFKC")
    .replace(KEY_STRIP, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Maps the Unicode tag block (U+E0020-E007E) onto ASCII so hidden-text URLs can be seen. */
function untag(s: string): string {
  return s.replace(TAG_BLOCK, (c) => String.fromCharCode(c.codePointAt(0)! - 0xe0000));
}

/** Normalised `first|surname` key. Cleans the raw names first, so admin lookups match stored rows. */
export function declineNameKey(firstName: string, surname: string): string {
  const f = (clean(firstName) ?? "").normalize("NFC");
  const s = (clean(surname) ?? "").normalize("NFC");
  return `${keyPart(f)}|${keyPart(s)}`;
}

/** Per-name limiter key: HMAC, never the plaintext name. */
export async function declineLimiterKey(nameKey: string, pepper: string): Promise<string> {
  return await hmacCode(`rl:decline:${nameKey}`, pepper);
}

/** Validates and normalises a decline. Errors are a field -> message map like validateRsvp. */
export function validateDecline(input: DeclineInput): DeclineValidation {
  const errors: Record<string, string> = {};

  const name = (key: string, raw: string): string => {
    const val = clean(raw)?.normalize("NFC");
    if (!val) errors[key] = "Required";
    else if (val.length > LIMITS.name) errors[key] = `Max ${LIMITS.name} characters`;
    else if (!NAME_RE.test(val) || !HAS_LETTER_RE.test(keyPart(val))) {
      errors[key] = "Use letters only";
    }
    return val?.replace(HIDDEN, "") ?? "";
  };
  const firstName = name("firstName", input.firstName);
  const surname = name("surname", input.surname);

  let reason: string | undefined;
  const rawReason = clean(input.reason);
  if (rawReason) {
    if (rawReason.length > REASON_MAX) errors.reason = `Max ${REASON_MAX} characters`;
    // keyPart(untag(x)) NFKC-folds (full-width), drops invisible characters ("ht\u00ADtps://"), lowercases and
    // reads tag characters as ASCII; each step can only create a match, so this one form covers the raw text too.
    else if (URL_RE.test(keyPart(untag(rawReason)))) {
      errors.reason = "Links are not allowed";
    } else reason = rawReason.replace(HIDDEN, "").trim() || undefined;
  }

  if (
    !NOTICE_VERSION_RE.test(input.noticeVersion) ||
    !DECLINE_NOTICE_VERSIONS.includes(input.noticeVersion)
  ) {
    errors.noticeVersion = "Invalid notice version";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      firstName,
      surname,
      ...(reason !== undefined ? { reason } : {}),
      noticeVersion: input.noticeVersion,
      nameKey: declineNameKey(firstName, surname),
    },
  };
}
