"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { generateCode } from "./lib/otp";
import { requestCodeFlow, type CreateChallengeResult, type RequestCodeResult } from "./lib/requestFlow";
import { sendCodeEmail } from "./mail/send";

/**
 * Public: emails a 6-digit code. This is a "use node" action (nodemailer needs it),
 * so the raw code stays inside this one function: only its HMAC goes to the mutation.
 */
export const requestCode = action({
  args: { email: v.string(), inviteKey: v.string() },
  returns: v.union(
    v.object({ status: v.literal("sent") }),
    v.object({ status: v.literal("rate_limited"), retryAfterMs: v.optional(v.number()) }),
    v.object({ status: v.literal("invalid_email") }),
    v.object({ status: v.literal("invalid_link") }),
    v.object({ status: v.literal("service_unavailable") }),
  ),
  handler: async (ctx, args): Promise<RequestCodeResult> => {
    return await requestCodeFlow(args.email, args.inviteKey, {
      pepper: process.env.OTP_PEPPER,
      inviteKey: process.env.INVITE_KEY,
      generateCode: () => generateCode(),
      createChallenge: async (email, codeHash, rateKey): Promise<CreateChallengeResult> =>
        await ctx.runMutation(internal.challenges.create, { email, codeHash, rateKey }),
      sendMail: sendCodeEmail,
    });
  },
});
