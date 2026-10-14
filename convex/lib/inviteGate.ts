import { constantTimeEqual, hmacCode } from "./otp";

/** Upper bound on the submitted invite key, checked before any hashing. */
export const MAX_INVITE_KEY_LENGTH = 256;

export type InviteGateResult = "ok" | "service_unavailable" | "invalid_link";

/**
 * Shared invite-key gate for every public entry point (otp.requestCode, rsvp.verifyAndSave).
 * Unset/empty INVITE_KEY or OTP_PEPPER fails closed; overlong keys are rejected before hashing;
 * both sides are HMAC'd with the pepper and compared in constant time.
 */
export async function checkInviteKey(
  submitted: string,
  envKey: string | undefined,
  pepper: string | undefined,
): Promise<InviteGateResult> {
  if (!envKey || !pepper) return "service_unavailable";
  if (submitted.length > MAX_INVITE_KEY_LENGTH) return "invalid_link";
  const [a, b] = await Promise.all([hmacCode(submitted, pepper), hmacCode(envKey, pepper)]);
  return constantTimeEqual(a, b) ? "ok" : "invalid_link";
}
