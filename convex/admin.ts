import { v } from "convex/values";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
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

const guestDocValidator = v.object({
  ...guestFields,
  _id: v.id("guests"),
  _creationTime: v.number(),
});

/** Host-only: one guest row by email, or null. `npx convex run admin:getGuest '{"email":"a@x.com"}'`. */
export const getGuest = internalQuery({
  args: { email: v.string() },
  returns: v.union(guestDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guests")
      .withIndex("by_email", (q) => q.eq("email", normalizeEmail(args.email)))
      .unique();
  },
});

/** Deletes one email's challenges and resets its limiter buckets. Returns challenges deleted. */
async function wipeEmailTraces(ctx: MutationCtx, email: string, pepper: string): Promise<number> {
  // At most a handful per email (cooldown + daily cap), so collecting is bounded.
  const challenges = await ctx.db
    .query("challenges")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();
  for (const row of challenges) await ctx.db.delete(row._id);
  const key = await limiterKey(email, pepper);
  await rateLimiter.reset(ctx, "otpCooldown", { key });
  await rateLimiter.reset(ctx, "otpDailyPerEmail", { key });
  return challenges.length;
}

/**
 * Host-only erasure of one guest (POPIA request): the guests row, every challenge for the
 * email, and the email's limiter buckets. Returns counts only. The ticketNo counter is
 * deliberately left alone so ticket numbers are never reused.
 * `npx convex run admin:deleteGuest '{"email":"a@x.com"}'`.
 */
export const deleteGuest = internalMutation({
  args: { email: v.string() },
  returns: v.object({ guests: v.number(), challenges: v.number(), limitersReset: v.boolean() }),
  handler: async (ctx, args) => {
    const pepper = process.env.OTP_PEPPER;
    if (!pepper) throw new Error("OTP_PEPPER is not set; cannot derive the per-email key");
    const email = normalizeEmail(args.email);
    const rows = await ctx.db
      .query("guests")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const row of rows) await ctx.db.delete(row._id);
    const challenges = await wipeEmailTraces(ctx, email, pepper);
    return { guests: rows.length, challenges, limitersReset: true };
  },
});

/** Event date: Mon 21 Dec 2026 (UTC midnight). */
export const EVENT_DATE_MS = Date.UTC(2026, 11, 21);
// ✎ set to the POPIA retention period
export const RETENTION_DAYS = 90;
/** Guests are not purgeable before this instant. Hard-coded on purpose: never an argument. */
export const PURGE_FLOOR_MS = EVENT_DATE_MS + RETENTION_DAYS * 24 * 60 * 60 * 1000;

const PURGE_BATCH = 200;

const purgeResultValidator = v.object({
  status: v.union(
    v.literal("dry_run"),
    v.literal("before_floor"),
    v.literal("purged"),
    v.literal("continuing"),
  ),
  guests: v.number(),
  challenges: v.number(),
  floor: v.number(),
});

/**
 * Host-only, manual only (no cron). Deletes ALL guests plus their challenges and limiter
 * buckets once the retention floor has passed. `dryRun` defaults to true and only counts.
 * Before the floor nothing is deleted (status "before_floor"; counts shown are what a later
 * run would cover). Deletion runs in self-rescheduling batches of 200.
 * `npx convex run admin:purgeGuests '{"confirm":"PURGE-GUESTS","dryRun":false}'`.
 */
export const purgeGuests = internalMutation({
  args: { confirm: v.literal("PURGE-GUESTS"), dryRun: v.optional(v.boolean()) },
  returns: purgeResultValidator,
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const floor = PURGE_FLOOR_MS;
    const beforeFloor = Date.now() < floor;

    if (dryRun || beforeFloor) {
      const guests = await ctx.db.query("guests").collect();
      let challenges = 0;
      for (const g of guests) {
        const rows = await ctx.db
          .query("challenges")
          .withIndex("by_email", (q) => q.eq("email", g.email))
          .collect();
        challenges += rows.length;
      }
      return {
        status: beforeFloor ? ("before_floor" as const) : ("dry_run" as const),
        guests: guests.length,
        challenges,
        floor,
      };
    }

    const pepper = process.env.OTP_PEPPER;
    if (!pepper) throw new Error("OTP_PEPPER is not set; cannot derive the per-email key");
    const batch = await ctx.db.query("guests").take(PURGE_BATCH);
    let challenges = 0;
    for (const g of batch) {
      challenges += await wipeEmailTraces(ctx, g.email, pepper);
      await ctx.db.delete(g._id);
    }
    const more = batch.length === PURGE_BATCH;
    if (more) {
      await ctx.scheduler.runAfter(0, internal.admin.purgeGuests, {
        confirm: "PURGE-GUESTS",
        dryRun: false,
      });
    }
    return {
      status: more ? ("continuing" as const) : ("purged" as const),
      guests: batch.length,
      challenges,
      floor,
    };
  },
});
