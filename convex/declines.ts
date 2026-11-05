import { v, type Infer } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkInviteKey } from "./lib/inviteGate";
import { declineLimiterKey, validateDecline } from "./lib/declineValidation";
import { MAX_DECLINES, rateLimiter } from "./lib/limits";

const recordResultValidator = v.union(
  v.object({ status: v.literal("saved") }),
  v.object({ status: v.literal("rate_limited") }),
);

const actionResultValidator = v.union(
  recordResultValidator,
  v.object({ status: v.literal("invalid_payload"), errors: v.record(v.string(), v.string()) }),
  v.object({ status: v.literal("invalid_link") }),
  v.object({ status: v.literal("service_unavailable") }),
);

/**
 * Stores a name-only decline (self-reported, unverified). Never reads or writes `guests`.
 * Always answers "saved" for an accepted or deduplicated decline and never echoes stored data.
 */
export const record = internalMutation({
  // rateKey: HMAC-derived per-name limiter key (never the plaintext name).
  args: {
    firstName: v.string(),
    surname: v.string(),
    reason: v.optional(v.string()),
    noticeVersion: v.string(),
    nameKey: v.string(),
    rateKey: v.string(),
  },
  returns: recordResultValidator,
  handler: async (ctx, args) => {
    // Check first (non-consuming), global first, so a drained global bucket never burns a name's tokens.
    const global = await rateLimiter.check(ctx, "declineDailyGlobal");
    if (!global.ok) return { status: "rate_limited" as const };
    const perName = await rateLimiter.check(ctx, "declinePerName", { key: args.rateKey });
    // Per-name exhausted looks like success and writes nothing: no enumeration, no spam.
    if (!perName.ok) return { status: "saved" as const };

    const existing = await ctx.db
      .query("declines")
      .withIndex("by_nameKey", (q) => q.eq("nameKey", args.nameKey))
      .first();
    if (!existing) {
      const rows = await ctx.db.query("declines").take(MAX_DECLINES);
      if (rows.length >= MAX_DECLINES) return { status: "rate_limited" as const };
    }

    await rateLimiter.limit(ctx, "declinePerName", { key: args.rateKey });
    await rateLimiter.limit(ctx, "declineDailyGlobal");

    const now = Date.now();
    const doc = {
      firstName: args.firstName,
      surname: args.surname,
      ...(args.reason !== undefined ? { reason: args.reason } : {}),
      nameKey: args.nameKey,
      noticeVersion: args.noticeVersion,
      updatedAt: now,
    };
    if (existing) {
      // replace (not patch) so a dropped reason disappears.
      await ctx.db.replace(existing._id, { ...doc, createdAt: existing.createdAt });
    } else {
      await ctx.db.insert("declines", { ...doc, createdAt: now });
    }
    return { status: "saved" as const };
  },
});

/** Public: name-only decline for a guest who has not replied before. Default runtime. */
export const submitDecline = action({
  args: {
    firstName: v.string(),
    surname: v.string(),
    reason: v.optional(v.string()),
    noticeVersion: v.string(),
    inviteKey: v.string(),
  },
  returns: actionResultValidator,
  handler: async (ctx, args): Promise<Infer<typeof actionResultValidator>> => {
    // Invite gate FIRST: fails closed, so a keyless caller learns nothing and burns no budget.
    const pepper = process.env.OTP_PEPPER;
    const gate = await checkInviteKey(args.inviteKey, process.env.INVITE_KEY, pepper);
    if (gate !== "ok") return { status: gate };
    if (!pepper) return { status: "service_unavailable" as const };
    if (process.env.DECLINES_OPEN !== "true") return { status: "service_unavailable" as const };

    const validated = validateDecline(args);
    if (!validated.ok) return { status: "invalid_payload" as const, errors: validated.errors };

    try {
      const { nameKey, ...clean } = validated.value;
      return await ctx.runMutation(internal.declines.record, {
        ...clean,
        nameKey,
        rateKey: await declineLimiterKey(nameKey, pepper),
      });
    } catch (err) {
      // Never log the message or payload: it could echo a guest's name or reason.
      console.error("submitDecline failed:", err instanceof Error ? err.name : "unknown");
      return { status: "service_unavailable" as const };
    }
  },
});
