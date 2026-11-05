import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { declineLimiterKey, declineNameKey } from "./lib/declineValidation";
import { rateLimiter, MAX_DECLINES } from "./lib/limits";
import { PURGE_FLOOR_MS } from "./admin";
import { newTest, PEPPER } from "./test.setup";

const KEY = "invite-key-for-tests";
const NOTICE = "popia-2026-11-v2";
type T = ReturnType<typeof newTest>;

const args = (over: Record<string, unknown> = {}) => ({
  firstName: "Ada",
  surname: "Lovelace",
  noticeVersion: NOTICE,
  inviteKey: KEY,
  ...over,
});
const submit = (t: T, over: Record<string, unknown> = {}) =>
  t.action(api.declines.submitDecline, args(over) as never);
const rows = (t: T) => t.run((ctx) => ctx.db.query("declines").collect());

async function seedDecline(t: T, first: string, surname: string, createdAt = 1) {
  await t.run((ctx) =>
    ctx.db.insert("declines", {
      firstName: first,
      surname,
      nameKey: declineNameKey(first, surname),
      noticeVersion: NOTICE,
      createdAt,
      updatedAt: createdAt,
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("OTP_PEPPER", PEPPER);
  vi.stubEnv("INVITE_KEY", KEY);
  vi.stubEnv("DECLINES_OPEN", "true");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("declines.submitDecline", () => {
  it("saves a decline and stores the cleaned fields", async () => {
    const t = newTest();
    expect(await submit(t, { reason: " Away that week " })).toEqual({ status: "saved" });
    const [row] = await rows(t);
    expect(row).toMatchObject({
      firstName: "Ada",
      surname: "Lovelace",
      nameKey: "ada|lovelace",
      reason: "Away that week",
      noticeVersion: NOTICE,
    });
  });

  it("rejects an unknown arg key", async () => {
    const t = newTest();
    await expect(submit(t, { email: "a@x.com" })).rejects.toThrow();
    expect(await rows(t)).toHaveLength(0);
  });

  it("returns invalid_link for a wrong or missing invite key", async () => {
    const t = newTest();
    expect(await submit(t, { inviteKey: "nope" })).toEqual({ status: "invalid_link" });
    expect(await submit(t, { inviteKey: "" })).toEqual({ status: "invalid_link" });
    expect(await rows(t)).toHaveLength(0);
  });

  it("returns service_unavailable when INVITE_KEY is unset", async () => {
    vi.stubEnv("INVITE_KEY", "");
    expect(await submit(newTest())).toEqual({ status: "service_unavailable" });
  });

  it("returns service_unavailable when DECLINES_OPEN is unset", async () => {
    const t = newTest();
    delete process.env.DECLINES_OPEN;
    expect(await submit(t)).toEqual({ status: "service_unavailable" });
    vi.stubEnv("DECLINES_OPEN", "yes");
    expect(await submit(t)).toEqual({ status: "service_unavailable" });
    expect(await rows(t)).toHaveLength(0);
  });

  it("checks the invite key before DECLINES_OPEN", async () => {
    vi.stubEnv("DECLINES_OPEN", "");
    expect(await submit(newTest(), { inviteKey: "nope" })).toEqual({ status: "invalid_link" });
  });

  it("rejects a noticeVersion outside the allow-list with invalid_payload", async () => {
    const t = newTest();
    const res = await submit(t, { noticeVersion: "popia-2026-11-v1" });
    expect(res).toMatchObject({ status: "invalid_payload", errors: { noticeVersion: expect.any(String) } });
    expect(await rows(t)).toHaveLength(0);
  });

  it("rejects a reason containing a URL with invalid_payload", async () => {
    const t = newTest();
    for (const reason of ["see https://x.io", "visit WWW.x.io"]) {
      expect(await submit(t, { reason })).toMatchObject({
        status: "invalid_payload",
        errors: { reason: expect.any(String) },
      });
    }
    expect(await rows(t)).toHaveLength(0);
  });

  it("rejects a reason over 140 characters with invalid_payload", async () => {
    const t = newTest();
    expect(await submit(t, { reason: "x".repeat(141) })).toMatchObject({
      status: "invalid_payload",
      errors: { reason: expect.any(String) },
    });
  });

  it("rejects bad names with invalid_payload", async () => {
    expect(await submit(newTest(), { firstName: "a@b.com" })).toMatchObject({
      status: "invalid_payload",
      errors: { firstName: expect.any(String) },
    });
  });

  it("does not touch guests, challenges or counters", async () => {
    const t = newTest();
    await t.run((ctx) =>
      ctx.db.insert("guests", {
        email: "ada@example.com",
        firstName: "Ada",
        surname: "Lovelace",
        attending: "yes",
        ticketNo: 1,
        createdAt: 1,
        updatedAt: 1,
      }),
    );
    await submit(t);
    await submit(t, { firstName: "Grace", surname: "Hopper" });
    const counts = await t.run(async (ctx) => ({
      guests: (await ctx.db.query("guests").collect()).length,
      challenges: (await ctx.db.query("challenges").collect()).length,
      counters: (await ctx.db.query("counters").collect()).length,
    }));
    expect(counts).toEqual({ guests: 1, challenges: 0, counters: 0 });
    expect(await rows(t)).toHaveLength(2);
  });
});

describe("declines.record", () => {
  const rec = (t: T, over: Record<string, unknown> = {}) =>
    t.mutation(internal.declines.record, {
      firstName: "Ada",
      surname: "Lovelace",
      noticeVersion: NOTICE,
      nameKey: "ada|lovelace",
      rateKey: "rk-ada",
      ...over,
    } as never);

  it("declinePerName exhausted returns saved and writes nothing", async () => {
    const t = newTest();
    await t.run(async (ctx) => {
      await rateLimiter.limit(ctx, "declinePerName", { key: "rk-ada" });
      await rateLimiter.limit(ctx, "declinePerName", { key: "rk-ada" });
    });
    const globalBefore = await t.run((ctx) => rateLimiter.check(ctx, "declineDailyGlobal"));
    expect(await rec(t, { reason: "late" })).toEqual({ status: "saved" });
    expect(await rows(t)).toHaveLength(0);
    // Global bucket untouched too.
    const globalAfter = await t.run((ctx) => rateLimiter.check(ctx, "declineDailyGlobal"));
    expect(globalAfter.ok).toBe(globalBefore.ok);
  });

  it("an existing row is left unchanged when declinePerName is exhausted", async () => {
    const t = newTest();
    await rec(t, { reason: "first" });
    await rec(t, { reason: "second" });
    expect(await rec(t, { reason: "third" })).toEqual({ status: "saved" });
    const [row] = await rows(t);
    expect(row.reason).toBe("second");
  });

  it("declineDailyGlobal exhausted returns rate_limited", async () => {
    const t = newTest();
    await t.run(async (ctx) => {
      for (let i = 0; i < 50; i++) await rateLimiter.limit(ctx, "declineDailyGlobal");
    });
    expect(await rec(t)).toEqual({ status: "rate_limited" });
    expect(await rows(t)).toHaveLength(0);
    // A drained global bucket must not burn the name's tokens.
    expect((await t.run((ctx) => rateLimiter.check(ctx, "declinePerName", { key: "rk-ada" }))).ok).toBe(true);
  });

  it("never touches the otp buckets", async () => {
    const t = newTest();
    await rec(t);
    expect((await t.run((ctx) => rateLimiter.check(ctx, "otpDailyGlobal"))).ok).toBe(true);
    const status = await t.run((ctx) => rateLimiter.check(ctx, "otpCooldown", { key: "rk-ada" }));
    expect(status.ok).toBe(true);
  });

  it("MAX_DECLINES cap: rate_limited for a new name, an existing name still upserts", async () => {
    const t = newTest();
    await t.run(async (ctx) => {
      for (let i = 0; i < MAX_DECLINES; i++) {
        await ctx.db.insert("declines", {
          firstName: "N",
          surname: `S${i}`,
          nameKey: `n|s${i}`,
          noticeVersion: NOTICE,
          createdAt: 1,
          updatedAt: 1,
        });
      }
    });
    expect(await rec(t, { nameKey: "new|person", rateKey: "rk-new" })).toEqual({
      status: "rate_limited",
    });
    expect(await rows(t)).toHaveLength(MAX_DECLINES);
    expect(await rec(t, { nameKey: "n|s7", rateKey: "rk-s7", reason: "updated" })).toEqual({
      status: "saved",
    });
    const all = await rows(t);
    expect(all).toHaveLength(MAX_DECLINES);
    expect(all.find((r) => r.nameKey === "n|s7")?.reason).toBe("updated");
  });

  it("upsert preserves createdAt and updates updatedAt (and drops a removed reason)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
    const t = newTest();
    await rec(t, { reason: "first" });
    const [a] = await rows(t);
    vi.setSystemTime(new Date("2026-11-02T12:00:00Z"));
    await rec(t, { firstName: "ADA" });
    const all = await rows(t);
    expect(all).toHaveLength(1);
    expect(all[0].createdAt).toBe(a.createdAt);
    expect(all[0].updatedAt).toBeGreaterThan(a.updatedAt);
    expect(all[0].firstName).toBe("ADA");
    expect(all[0].reason).toBeUndefined();
  });
});

describe("admin declines", () => {
  it("summary counts declines separately from no and headcount", async () => {
    const t = newTest();
    await seedDecline(t, "Ada", "Lovelace");
    await seedDecline(t, "Grace", "Hopper");
    expect(await t.query(internal.admin.summary, {})).toMatchObject({
      total: 0,
      no: 0,
      expectedHeadcount: 0,
      declinesUnverified: 2,
    });
  });

  it("listDeclines returns every row", async () => {
    const t = newTest();
    await seedDecline(t, "Ada", "Lovelace");
    const list = await t.query(internal.admin.listDeclines, {});
    expect(list.map((d) => d.nameKey)).toEqual(["ada|lovelace"]);
  });

  it("getDecline normalises the name and returns the row or null", async () => {
    const t = newTest();
    await seedDecline(t, "Ada", "Lovelace");
    const hit = await t.query(internal.admin.getDecline, { firstName: " ADA ", surname: "lovelace" });
    expect(hit?.firstName).toBe("Ada");
    expect(await t.query(internal.admin.getDecline, { firstName: "No", surname: "Body" })).toBeNull();
  });

  it("deleteDecline deletes the row and resets the limiter, leaving others alone", async () => {
    const t = newTest();
    const keyA = await declineLimiterKey("ada|lovelace", PEPPER);
    const keyG = await declineLimiterKey("grace|hopper", PEPPER);
    await t.run(async (ctx) => {
      for (const k of [keyA, keyG]) {
        await rateLimiter.limit(ctx, "declinePerName", { key: k });
        await rateLimiter.limit(ctx, "declinePerName", { key: k });
      }
    });
    await seedDecline(t, "Ada", "Lovelace");
    await seedDecline(t, "Grace", "Hopper");
    const res = await t.mutation(internal.admin.deleteDecline, {
      firstName: " ada",
      surname: "LOVELACE ",
    });
    expect(res).toEqual({ declines: 1, limitersReset: true });
    expect((await rows(t)).map((r) => r.nameKey)).toEqual(["grace|hopper"]);
    expect((await t.run((ctx) => rateLimiter.check(ctx, "declinePerName", { key: keyA }))).ok).toBe(true);
    expect((await t.run((ctx) => rateLimiter.check(ctx, "declinePerName", { key: keyG }))).ok).toBe(false);
  });

  it("deleteDecline throws without OTP_PEPPER and deletes nothing", async () => {
    const t = newTest();
    await seedDecline(t, "Ada", "Lovelace");
    vi.stubEnv("OTP_PEPPER", "");
    await expect(
      t.mutation(internal.admin.deleteDecline, { firstName: "Ada", surname: "Lovelace" }),
    ).rejects.toThrow(/OTP_PEPPER/);
    expect(await rows(t)).toHaveLength(1);
  });

  it("resetDeclineLimits resets the global decline bucket only", async () => {
    const t = newTest();
    await t.run(async (ctx) => {
      for (let i = 0; i < 50; i++) await rateLimiter.limit(ctx, "declineDailyGlobal");
      await rateLimiter.limit(ctx, "otpDailyGlobal");
    });
    expect((await t.run((ctx) => rateLimiter.check(ctx, "declineDailyGlobal"))).ok).toBe(false);
    expect(await t.mutation(internal.admin.resetDeclineLimits, {})).toEqual({ global: true });
    expect((await t.run((ctx) => rateLimiter.check(ctx, "declineDailyGlobal"))).ok).toBe(true);
  });
});

describe("admin.purgeGuests with declines", () => {
  const confirm = "PURGE-GUESTS" as const;

  it("dry run counts declines and respects PURGE_FLOOR_MS", async () => {
    vi.useFakeTimers();
    const t = newTest();
    await seedDecline(t, "Ada", "Lovelace");
    await seedDecline(t, "Grace", "Hopper");

    vi.setSystemTime(PURGE_FLOOR_MS - 1000);
    expect(await t.mutation(internal.admin.purgeGuests, { confirm, dryRun: false })).toMatchObject({
      status: "before_floor",
      declines: 2,
    });
    expect(await rows(t)).toHaveLength(2);

    vi.setSystemTime(PURGE_FLOOR_MS + 1000);
    expect(await t.mutation(internal.admin.purgeGuests, { confirm })).toMatchObject({
      status: "dry_run",
      declines: 2,
    });
    expect(await rows(t)).toHaveLength(2);
  });

  it("deletes declines (and their buckets) after the floor, once guests are done", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(PURGE_FLOOR_MS + 1000);
    const t = newTest();
    const key = await declineLimiterKey("ada|lovelace", PEPPER);
    await seedDecline(t, "Ada", "Lovelace");
    await t.run(async (ctx) => {
      await rateLimiter.limit(ctx, "declinePerName", { key });
      await rateLimiter.limit(ctx, "declinePerName", { key });
    });
    const res = await t.mutation(internal.admin.purgeGuests, { confirm, dryRun: false });
    expect(res).toMatchObject({ status: "purged", guests: 0, declines: 1 });
    expect(await rows(t)).toHaveLength(0);
    expect((await t.run((ctx) => rateLimiter.check(ctx, "declinePerName", { key }))).ok).toBe(true);
  });
});
