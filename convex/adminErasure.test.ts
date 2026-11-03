import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { limiterKey } from "./lib/otp";
import { rateLimiter } from "./lib/limits";
import { PURGE_FLOOR_MS, RETENTION_DAYS } from "./admin";
import { newTest, PEPPER } from "./test.setup";

type T = ReturnType<typeof newTest>;

async function seedGuest(t: T, email: string, ticketNo: number) {
  await t.run(async (ctx) => {
    await ctx.db.insert("guests", {
      email,
      firstName: "F",
      surname: "S",
      attending: "no",
      ticketNo,
      createdAt: 1,
      updatedAt: 1,
    });
    await ctx.db.insert("challenges", {
      email,
      codeHash: "h",
      expiresAt: 9e15,
      attempts: 0,
      consumed: true,
    });
    await ctx.db.insert("challenges", {
      email,
      codeHash: "h2",
      expiresAt: 9e15,
      attempts: 0,
      consumed: false,
    });
    const key = await limiterKey(email, PEPPER);
    await rateLimiter.limit(ctx, "otpCooldown", { key });
    await rateLimiter.limit(ctx, "otpDailyPerEmail", { key });
  });
}

const cooldownOk = (t: T, email: string) =>
  t.run(async (ctx) =>
    (await rateLimiter.check(ctx, "otpCooldown", { key: await limiterKey(email, PEPPER) })).ok,
  );

beforeEach(() => vi.stubEnv("OTP_PEPPER", PEPPER));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("admin.getGuest", () => {
  it("normalises the email and returns the row or null", async () => {
    const t = newTest();
    await seedGuest(t, "a@x.com", 1);
    expect((await t.query(internal.admin.getGuest, { email: " A@X.com " }))?.ticketNo).toBe(1);
    expect(await t.query(internal.admin.getGuest, { email: "nobody@x.com" })).toBeNull();
  });
});

describe("admin.deleteGuest", () => {
  it("removes row + challenges, resets buckets, keeps others and the counter, returns counts only", async () => {
    const t = newTest();
    await seedGuest(t, "a@x.com", 1);
    await seedGuest(t, "b@x.com", 2);
    await t.run((ctx) => ctx.db.insert("counters", { name: "ticketNo", value: 2 }));
    expect(await cooldownOk(t, "a@x.com")).toBe(false);

    const res = await t.mutation(internal.admin.deleteGuest, { email: " A@x.com " });
    expect(res).toEqual({ guests: 1, challenges: 2, limitersReset: true });

    const left = await t.run(async (ctx) => ({
      guests: (await ctx.db.query("guests").collect()).map((g) => g.email),
      challenges: (await ctx.db.query("challenges").collect()).map((c) => c.email),
      counter: (await ctx.db.query("counters").collect())[0].value,
    }));
    expect(left.guests).toEqual(["b@x.com"]);
    expect(left.challenges).toEqual(["b@x.com", "b@x.com"]);
    expect(left.counter).toBe(2);
    expect(await cooldownOk(t, "a@x.com")).toBe(true);
    expect(await cooldownOk(t, "b@x.com")).toBe(false);
  });

  it("is a harmless no-op for an unknown email", async () => {
    const t = newTest();
    expect(await t.mutation(internal.admin.deleteGuest, { email: "z@x.com" })).toEqual({
      guests: 0,
      challenges: 0,
      limitersReset: true,
    });
  });

  it("throws without OTP_PEPPER and deletes nothing", async () => {
    const t = newTest();
    await seedGuest(t, "a@x.com", 1);
    vi.stubEnv("OTP_PEPPER", "");
    await expect(t.mutation(internal.admin.deleteGuest, { email: "a@x.com" })).rejects.toThrow(
      /OTP_PEPPER/,
    );
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(1);
  });
});

describe("admin.purgeGuests", () => {
  const confirm = "PURGE-GUESTS" as const;

  it("floor is event date plus retention", () => {
    expect(PURGE_FLOOR_MS).toBe(Date.UTC(2026, 11, 21) + RETENTION_DAYS * 86_400_000);
  });

  it("does nothing before the floor, even with dryRun false", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(PURGE_FLOOR_MS - 1000);
    const t = newTest();
    await seedGuest(t, "a@x.com", 1);
    const res = await t.mutation(internal.admin.purgeGuests, { confirm, dryRun: false });
    expect(res).toMatchObject({ status: "before_floor", floor: PURGE_FLOOR_MS });
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.query("challenges").collect())).toHaveLength(2);
  });

  it("defaults to a dry run after the floor and only counts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(PURGE_FLOOR_MS + 1000);
    const t = newTest();
    await seedGuest(t, "a@x.com", 1);
    await seedGuest(t, "b@x.com", 2);
    const res = await t.mutation(internal.admin.purgeGuests, { confirm });
    expect(res).toMatchObject({ status: "dry_run", guests: 2, challenges: 4 });
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(2);
  });

  it("refuses a wrong or missing confirm", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(PURGE_FLOOR_MS + 1000);
    const t = newTest();
    await seedGuest(t, "a@x.com", 1);
    await expect(
      t.mutation(internal.admin.purgeGuests, { confirm: "yes", dryRun: false } as never),
    ).rejects.toThrow();
    await expect(
      t.mutation(internal.admin.purgeGuests, { dryRun: false } as never),
    ).rejects.toThrow();
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(1);
  });

  it("deletes guests, challenges and buckets after the floor, in rescheduled batches", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(PURGE_FLOOR_MS + 1000);
    const t = newTest();
    await seedGuest(t, "a@x.com", 1);
    await t.run(async (ctx) => {
      for (let i = 0; i < 200; i++) {
        await ctx.db.insert("guests", {
          email: `g${i}@x.com`,
          firstName: "F",
          surname: "S",
          attending: "no",
          ticketNo: 100 + i,
          createdAt: 1,
          updatedAt: 1,
        });
      }
      await ctx.db.insert("counters", { name: "ticketNo", value: 300 });
    });
    const first = await t.mutation(internal.admin.purgeGuests, { confirm, dryRun: false });
    expect(first).toMatchObject({ status: "continuing", guests: 200 });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(0);
    expect(await t.run((ctx) => ctx.db.query("challenges").collect())).toHaveLength(0);
    expect(await cooldownOk(t, "a@x.com")).toBe(true);
    expect((await t.run((ctx) => ctx.db.query("counters").collect()))[0].value).toBe(300);
  });
});
