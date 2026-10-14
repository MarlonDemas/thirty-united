import { v, type Infer } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  constantTimeEqual,
  hmacCode,
  isValidEmail,
  isWellFormedCode,
  normalizeEmail,
} from "./lib/otp";
import { checkInviteKey } from "./lib/inviteGate";
import { rsvpPayloadValidator, validateRsvp } from "./lib/validation";

export const MAX_ATTEMPTS = 5;

const errorsValidator = v.record(v.string(), v.string());

const mutationResultValidator = v.union(
  v.object({
    status: v.union(v.literal("saved"), v.literal("updated")),
    ticketNo: v.number(),
    firstName: v.string(),
    surname: v.string(),
    team: v.optional(v.string()),
    attending: v.union(v.literal("yes"), v.literal("maybe"), v.literal("no")),
  }),
  v.object({ status: v.literal("invalid_code"), attemptsLeft: v.number() }),
  v.object({ status: v.literal("code_expired") }),
  v.object({ status: v.literal("too_many_attempts") }),
  v.object({ status: v.literal("no_code") }),
  v.object({ status: v.literal("invalid_payload"), errors: errorsValidator }),
);

const actionResultValidator = v.union(
  mutationResultValidator,
  v.object({ status: v.literal("service_unavailable") }),
  v.object({ status: v.literal("invalid_link") }),
);

/**
 * Consumes the latest challenge for the email if the code hash matches, then upserts
 * the guest by email. Everything runs in one transaction, so ticketNo assignment is atomic.
 */
export const consumeAndUpsert = internalMutation({
  args: { email: v.string(), codeHash: v.string(), payload: rsvpPayloadValidator },
  returns: mutationResultValidator,
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    if (!isValidEmail(email)) {
      return { status: "invalid_payload" as const, errors: { email: "Enter a valid email" } };
    }
    // Validate before touching the challenge so a bad form never burns a code.
    const validated = validateRsvp(args.payload);
    if (!validated.ok) {
      return { status: "invalid_payload" as const, errors: validated.errors };
    }

    const challenge = await ctx.db
      .query("challenges")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .first();
    if (!challenge) return { status: "no_code" as const };
    const now = Date.now();
    if (challenge.expiresAt <= now) {
      // Expired and consumed stays no_code (as before); expired and unconsumed is code_expired.
      return { status: challenge.consumed ? ("no_code" as const) : ("code_expired" as const) };
    }
    if (challenge.attempts >= MAX_ATTEMPTS) return { status: "too_many_attempts" as const };

    const codeMatches = constantTimeEqual(challenge.codeHash, args.codeHash);
    if (!codeMatches) {
      // Wrong code counts against the same lockout whether or not the challenge is consumed,
      // so a consumed challenge is never an unlimited oracle.
      const attempts = challenge.attempts + 1;
      await ctx.db.patch(challenge._id, { attempts });
      return {
        status: "invalid_code" as const,
        attemptsLeft: Math.max(MAX_ATTEMPTS - attempts, 0),
      };
    }

    if (challenge.consumed) {
      // Idempotent replay (e.g. the client re-sent a queued submit): the correct code was
      // already used and the RSVP saved. Report the stored row; write nothing.
      const saved = await ctx.db
        .query("guests")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      if (!saved) return { status: "no_code" as const };
      return {
        status: "saved" as const,
        ticketNo: saved.ticketNo,
        firstName: saved.firstName,
        surname: saved.surname,
        ...(saved.team ? { team: saved.team } : {}),
        attending: saved.attending,
      };
    }
    await ctx.db.patch(challenge._id, { consumed: true });

    const value = validated.value;
    const existing = await ctx.db
      .query("guests")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    let ticketNo: number;
    let status: "saved" | "updated";
    if (existing) {
      ticketNo = existing.ticketNo;
      status = "updated";
      // replace (not patch) so fields from an earlier RSVP that no longer apply disappear.
      await ctx.db.replace(existing._id, {
        ...value,
        email,
        ticketNo,
        createdAt: existing.createdAt,
        updatedAt: now,
      });
    } else {
      const counter = await ctx.db
        .query("counters")
        .withIndex("by_name", (q) => q.eq("name", "ticketNo"))
        .unique();
      if (counter) {
        ticketNo = counter.value + 1;
        await ctx.db.patch(counter._id, { value: ticketNo });
      } else {
        ticketNo = 1;
        await ctx.db.insert("counters", { name: "ticketNo", value: 1 });
      }
      status = "saved";
      await ctx.db.insert("guests", {
        ...value,
        email,
        ticketNo,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      status,
      ticketNo,
      firstName: value.firstName,
      surname: value.surname,
      ...(value.team ? { team: value.team } : {}),
      attending: value.attending,
    };
  },
});

/** Public: verifies the emailed code and saves the RSVP. Default runtime. */
export const verifyAndSave = action({
  args: {
    email: v.string(),
    code: v.string(),
    payload: rsvpPayloadValidator,
    inviteKey: v.string(),
  },
  returns: actionResultValidator,
  handler: async (ctx, args): Promise<Infer<typeof actionResultValidator>> => {
    // Invite gate FIRST: before validation, hashing and the consumeAndUpsert call, so a keyless
    // caller can't burn a guest's attempts or tell no_code from invalid_code.
    const pepper = process.env.OTP_PEPPER;
    const gate = await checkInviteKey(args.inviteKey, process.env.INVITE_KEY, pepper);
    if (gate !== "ok") return { status: gate };
    if (!pepper) return { status: "service_unavailable" as const };

    const email = normalizeEmail(args.email);
    if (!isValidEmail(email)) {
      return { status: "invalid_payload" as const, errors: { email: "Enter a valid email" } };
    }
    const validated = validateRsvp(args.payload);
    if (!validated.ok) {
      return { status: "invalid_payload" as const, errors: validated.errors };
    }
    const code = args.code.trim();
    if (!isWellFormedCode(code)) {
      return { status: "invalid_payload" as const, errors: { code: "Enter the 6-digit code" } };
    }

    return await ctx.runMutation(internal.rsvp.consumeAndUpsert, {
      email,
      codeHash: await hmacCode(code, pepper),
      payload: validated.value,
    });
  },
});
