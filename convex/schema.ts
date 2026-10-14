import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const attendingValidator = v.union(
  v.literal("yes"),
  v.literal("maybe"),
  v.literal("no"),
);
export const sportValidator = v.union(v.literal("football"), v.literal("other"));
export const inviteChannelValidator = v.union(
  v.literal("email"),
  v.literal("whatsapp"),
);

export const guestFields = {
    email: v.string(), // normalised: trimmed + lowercase, unique by logic
    firstName: v.string(),
    surname: v.string(),
    preferredName: v.optional(v.string()),
    attending: attendingValidator,
    plusOne: v.optional(v.boolean()),
    plusOneName: v.optional(v.string()),
    sport: v.optional(sportValidator),
    team: v.optional(v.string()),
    otherSport: v.optional(v.string()),
    funFact: v.optional(v.string()),
    howKnowMakes: v.optional(v.string()),
    inviteChannel: v.optional(inviteChannelValidator),
    whatsapp: v.optional(v.string()),
    ticketNo: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
};

export default defineSchema({
  guests: defineTable(guestFields).index("by_email", ["email"]),

  challenges: defineTable({
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    attempts: v.number(),
    consumed: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_expiresAt", ["expiresAt"]),

  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
});
