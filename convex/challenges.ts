import { v } from "convex/values";
import { internal } from "./_generated/api";
import { rateLimiter } from "./lib/limits";
import { internalMutation } from "./_generated/server";

export const CODE_TTL_MS = 10 * 60_000;

/**
 * Rate-limits, supersedes earlier unconsumed codes for the email, stores the new hash.
 * Receives only the HMAC of the code, never the code itself.
 */
export const create = internalMutation({
  // rateKey: HMAC-derived per-email limiter key (never the plaintext email).
  args: { email: v.string(), codeHash: v.string(), rateKey: v.string() },
  returns: v.union(
    v.object({ ok: v.literal(true) }),
    v.object({ ok: v.literal(false), reason: v.literal("cooldown"), retryAfter: v.number() }),
    v.object({ ok: v.literal(false), reason: v.literal("daily_cap") }),
    v.object({ ok: v.literal(false), reason: v.literal("global_cap") }),
  ),
  handler: async (ctx, args) => {
    // Check every bucket first (non-consuming), global first, so a drained global bucket
    // never burns a guest's per-email tokens. Only when all pass do we consume.
    const global = await rateLimiter.check(ctx, "otpDailyGlobal");
    if (!global.ok) return { ok: false as const, reason: "global_cap" as const };
    const cooldown = await rateLimiter.check(ctx, "otpCooldown", { key: args.rateKey });
    if (!cooldown.ok) {
      return { ok: false as const, reason: "cooldown" as const, retryAfter: cooldown.retryAfter };
    }
    const daily = await rateLimiter.check(ctx, "otpDailyPerEmail", { key: args.rateKey });
    if (!daily.ok) return { ok: false as const, reason: "daily_cap" as const };

    await rateLimiter.limit(ctx, "otpCooldown", { key: args.rateKey });
    await rateLimiter.limit(ctx, "otpDailyPerEmail", { key: args.rateKey });
    await rateLimiter.limit(ctx, "otpDailyGlobal");

    // At most a handful per email (cooldown + daily cap), so collecting is bounded.
    const prior = await ctx.db
      .query("challenges")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    for (const row of prior) {
      if (!row.consumed) await ctx.db.delete(row._id);
    }

    await ctx.db.insert("challenges", {
      email: args.email,
      codeHash: args.codeHash,
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
      consumed: false,
    });
    return { ok: true as const };
  },
});

const PURGE_BATCH = 200;

/** Deletes expired challenges in batches; reschedules itself while more remain. */
export const purgeExpired = internalMutation({
  args: { batchSize: v.optional(v.number()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const size = Math.min(Math.max(Math.floor(args.batchSize ?? PURGE_BATCH), 1), 500);
    const expired = await ctx.db
      .query("challenges")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", Date.now()))
      .take(size);
    for (const row of expired) await ctx.db.delete(row._id);
    if (expired.length === size) {
      await ctx.scheduler.runAfter(0, internal.challenges.purgeExpired, { batchSize: size });
    }
    return expired.length;
  },
});
