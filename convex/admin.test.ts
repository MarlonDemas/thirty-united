import { afterEach, describe, expect, it, vi } from "vitest";
import { limiterKey } from "./lib/otp";
import { rateLimiter } from "./lib/limits";
import { internal } from "./_generated/api";
import { newTest } from "./test.setup";

type Row = {
  email: string;
  attending: "yes" | "maybe" | "no";
  plusOne?: boolean;
  team?: string;
};

async function seed(rows: Row[]) {
  const t = newTest();
  await t.run(async (ctx) => {
    let n = 0;
    for (const r of rows) {
      n++;
      await ctx.db.insert("guests", {
        firstName: "F",
        surname: "S",
        ticketNo: n,
        createdAt: 1000 * n,
        updatedAt: 1000 * n,
        ...r,
        ...(r.attending === "no"
          ? {}
          : { sport: "football" as const, inviteChannel: "email" as const }),
      });
    }
  });
  return t;
}

describe("admin.summary", () => {
  it("counts rsvps, plus-ones, headcount and teams", async () => {
    const t = await seed([
      { email: "1@x.com", attending: "yes", plusOne: true, team: "Arsenal" },
      { email: "2@x.com", attending: "yes", team: "arsenal" },
      { email: "3@x.com", attending: "maybe", plusOne: true, team: "Spurs" },
      { email: "4@x.com", attending: "no" },
      { email: "5@x.com", attending: "yes", plusOne: false, team: "Spurs" },
    ]);
    const s = await t.query(internal.admin.summary, {});
    expect(s).toMatchObject({
      total: 5,
      yes: 3,
      maybe: 1,
      no: 1,
      plusOnes: 2,
      expectedHeadcount: 4, // 3 yes + 1 yes-with-plus-one
    });
    expect(s.teams).toEqual([
      { team: "Arsenal", count: 2 },
      { team: "Spurs", count: 2 },
    ]);
  });

  it("is all zeros for an empty table", async () => {
    const t = newTest();
    expect(await t.query(internal.admin.summary, {})).toEqual({
      total: 0,
      yes: 0,
      maybe: 0,
      no: 0,
      plusOnes: 0,
      expectedHeadcount: 0,
      teams: [],
    });
  });
});

describe("admin.listRsvps", () => {
  it("returns all rows ordered by ticket number", async () => {
    const t = await seed([
      { email: "1@x.com", attending: "yes", team: "A" },
      { email: "2@x.com", attending: "no" },
    ]);
    const rows = await t.query(internal.admin.listRsvps, {});
    expect(rows.map((r) => r.ticketNo)).toEqual([1, 2]);
    expect(rows[0].email).toBe("1@x.com");
  });
});

describe("admin.resetCodeLimits", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("resets the global bucket", async () => {
    const t = newTest();
    await t.run(async (ctx) => {
      for (let i = 0; i < 450; i++) await rateLimiter.limit(ctx, "otpDailyGlobal");
    });
    expect((await t.run((ctx) => rateLimiter.check(ctx, "otpDailyGlobal"))).ok).toBe(false);
    expect(await t.mutation(internal.admin.resetCodeLimits, {})).toEqual({
      global: true,
      email: false,
    });
    expect((await t.run((ctx) => rateLimiter.check(ctx, "otpDailyGlobal"))).ok).toBe(true);
  });

  it("resets one email's buckets (by HMAC key) and leaves others alone", async () => {
    vi.stubEnv("OTP_PEPPER", "pep");
    const t = newTest();
    const a = await limiterKey("a@x.com", "pep");
    const b = await limiterKey("b@x.com", "pep");
    await t.run(async (ctx) => {
      for (const k of [a, b]) {
        await rateLimiter.limit(ctx, "otpCooldown", { key: k });
        await rateLimiter.limit(ctx, "otpDailyPerEmail", { key: k });
      }
    });
    expect(await t.mutation(internal.admin.resetCodeLimits, { email: " A@x.com " })).toEqual({
      global: true,
      email: true,
    });
    const okA = await t.run((ctx) => rateLimiter.check(ctx, "otpCooldown", { key: a }));
    const okB = await t.run((ctx) => rateLimiter.check(ctx, "otpCooldown", { key: b }));
    expect(okA.ok).toBe(true);
    expect(okB.ok).toBe(false);
  });
});
