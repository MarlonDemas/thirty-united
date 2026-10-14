import { checkInviteKey, MAX_INVITE_KEY_LENGTH } from "./inviteGate";
import { hmacCode, isValidEmail, limiterKey, normalizeEmail } from "./otp";

export { MAX_INVITE_KEY_LENGTH };

export type RequestCodeResult =
  | { status: "sent" }
  | { status: "rate_limited"; retryAfterMs?: number }
  | { status: "invalid_email" }
  | { status: "invalid_link" }
  | { status: "service_unavailable" };

export type CreateChallengeResult =
  | { ok: true }
  | { ok: false; reason: string; retryAfter?: number };

export interface RequestCodeDeps {
  pepper: string | undefined;
  /** INVITE_KEY env value. Unset/empty fails closed. */
  inviteKey: string | undefined;
  generateCode: () => string;
  /** Stores the hash only. Must never receive the raw code. */
  createChallenge: (
    email: string,
    codeHash: string,
    rateKey: string,
  ) => Promise<CreateChallengeResult>;
  /** Returns false when the provider is unavailable or sending failed. */
  sendMail: (to: string, code: string) => Promise<boolean>;
}

/** requestCode orchestration with injected side effects (unit-testable). */
export async function requestCodeFlow(
  rawEmail: string,
  submittedKey: string,
  deps: RequestCodeDeps,
): Promise<RequestCodeResult> {
  // Invite gate FIRST: before email handling, rate limiting and mail, so keyless
  // requests can't drain the global cap or a guest's per-email budget.
  const gate = await checkInviteKey(submittedKey, deps.inviteKey, deps.pepper);
  if (gate !== "ok") return { status: gate };
  // Gate passed, so the pepper is set.
  const pepper = deps.pepper as string;

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return { status: "invalid_email" };

  try {
    const code = deps.generateCode();
    const codeHash = await hmacCode(code, pepper);
    const rateKey = await limiterKey(email, pepper);
    const created = await deps.createChallenge(email, codeHash, rateKey);
    if (!created.ok) {
      return created.retryAfter !== undefined
        ? { status: "rate_limited", retryAfterMs: created.retryAfter }
        : { status: "rate_limited" };
    }
    const sent = await deps.sendMail(email, code);
    return { status: sent ? "sent" : "service_unavailable" };
  } catch (err) {
    // Never log the message: it could echo the code or provider credentials.
    console.error("requestCode failed:", err instanceof Error ? err.name : "unknown");
    return { status: "service_unavailable" };
  }
}
