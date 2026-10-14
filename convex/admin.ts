import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { limiterKey, normalizeEmail } from "./lib/otp";
import { rateLimiter } from "./lib/limits";
import { guestFields } from "./schema";

// Host-only tools, run with `npx convex run admin:summary` / `admin:listRsvps`.
// The guest list is small (bounded by the OTP rate limits), so reading all rows is fine.

export const summary = internalQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    yes: v.number(),
    maybe: v.number(),
    no: v.number(),
    plusOnes: v.number(),
    expectedHeadcount: v.number(),
    teams: v.array(v.object({ team: v.string(), count: v.number() })),
  }),
  handler: async (ctx) => {
    const guests = await ctx.db.query("guests").collect();
    let yes = 0;
    let maybe = 0;
    let no = 0;
    let plusOnes = 0;
    let yesWithPlusOne = 0;
    const teams = new Map<string, { team: string; count: number }>();

    for (const g of guests) {
      if (g.attending === "yes") yes++;
      else if (g.attending === "maybe") maybe++;
      else no++;
      if (g.plusOne) plusOnes++;
      if (g.attending === "yes" && g.plusOne) yesWithPlusOne++;
      if (g.attending !== "no" && g.team) {
        const key = g.team.trim().toLowerCase();
        const entry = teams.get(key);
        if (entry) entry.count++;
        else teams.set(key, { team: g.team.trim(), count: 1 });
      }
    }

    return {
      total: guests.length,
      yes,
      maybe,
      no,
      plusOnes,
      expectedHeadcount: yes + yesWithPlusOne,
      teams: [...teams.values()].sort(
        (a, b) => b.count - a.count || a.team.localeCompare(b.team),
      ),
    };
  },
});

export const listRsvps = internalQuery({
  args: {},
  returns: v.array(
    v.object({ ...guestFields, _id: v.id("guests"), _creationTime: v.number() }),
  ),
  handler: async (ctx) => {
    const guests = await ctx.db.query("guests").collect();
    return guests.sort((a, b) => a.ticketNo - b.ticketNo);
  },
});

/**
 * Host-only: resets the global code bucket, and one guest's buckets when `email` is given.
 * `npx convex run admin:resetCodeLimits` or `... '{"email":"a@x.com"}'`.
 */
export const resetCodeLimits = internalMutation({
  args: { email: v.optional(v.string()) },
  returns: v.object({ global: v.literal(true), email: v.boolean() }),
  handler: async (ctx, args) => {
    await rateLimiter.reset(ctx, "otpDailyGlobal");
    if (args.email === undefined) return { global: true as const, email: false };
    const pepper = process.env.OTP_PEPPER;
    if (!pepper) throw new Error("OTP_PEPPER is not set; cannot derive the per-email key");
    const key = await limiterKey(normalizeEmail(args.email), pepper);
    await rateLimiter.reset(ctx, "otpCooldown", { key });
    await rateLimiter.reset(ctx, "otpDailyPerEmail", { key });
    return { global: true as const, email: true };
  },
});
