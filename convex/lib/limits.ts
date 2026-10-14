import { MINUTE, HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

/** Global daily cap on code emails. Gmail blocks personal accounts above ~500/day. */
export const GLOBAL_DAILY_CAP = 450;

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
});
