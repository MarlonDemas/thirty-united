import { MINUTE, HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

/** Global daily cap on code emails. Gmail blocks personal accounts above ~500/day. */
export const GLOBAL_DAILY_CAP = 450;

/** Global daily cap on name-only declines (sized for ~100 invitees). */
export const DECLINE_DAILY_CAP = 50;
/** Hard cap on stored declines; a new name past this is rate_limited. */
export const MAX_DECLINES = 200;

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // 1 request per 60 s per email.
  otpCooldown: { kind: "token bucket", rate: 1, period: MINUTE, capacity: 1 },
  // 5 per 24 h per email.
  otpDailyPerEmail: { kind: "token bucket", rate: 5, period: 24 * HOUR, capacity: 5 },
  // Across everyone (caps mail spend / abuse).
  otpDailyGlobal: {
    kind: "token bucket",
    rate: GLOBAL_DAILY_CAP,
    period: 24 * HOUR,
    capacity: GLOBAL_DAILY_CAP,
  },
  // Name-only declines. Never share a bucket with the otp* ones.
  declineDailyGlobal: {
    kind: "token bucket",
    rate: DECLINE_DAILY_CAP,
    period: 24 * HOUR,
    capacity: DECLINE_DAILY_CAP,
  },
  // 2 per 24 h per name (keyed by HMAC, never the plaintext name).
  declinePerName: { kind: "token bucket", rate: 2, period: 24 * HOUR, capacity: 2 },
});
