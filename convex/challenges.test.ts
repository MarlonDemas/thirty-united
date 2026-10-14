import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { newTest } from "./test.setup";
import { rateLimiter } from "./lib/limits";

const HASH = "a".repeat(64);
const MIN = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("challenges.create", () => {
  it("inserts a fresh challenge expiring in 10 minutes", async () => {
    const t = newTest();
    const res = await t.mutation(internal.challenges.create, {
      email: "a@x.com", rateKey: "a@x.com",
      codeHash: HASH,
    });
    expect(res).toEqual({ ok: true });
    const rows = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: "a@x.com",
      codeHash: HASH,
      attempts: 0,
      consumed: false,
      expiresAt: Date.now() + 10 * MIN,
    });
  });

  it("enforces a 60s per-email cooldown with retryAfter", async () => {
    const t = newTest();
    await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "a@x.com", codeHash: HASH });
    const res = await t.mutation(internal.challenges.create, {
      email: "a@x.com", rateKey: "a@x.com",
      codeHash: HASH,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe("cooldown");
      expect(res.retryAfter).toBeGreaterThan(0);
      expect(res.retryAfter).toBeLessThanOrEqual(MIN);
    }
    // a different email is unaffected
    const other = await t.mutation(internal.challenges.create, {
      email: "b@x.com", rateKey: "b@x.com",
      codeHash: HASH,
    });
    expect(other.ok).toBe(true);
    // and after the cooldown the same email works again
    vi.advanceTimersByTime(MIN + 1000);
    const again = await t.mutation(internal.challenges.create, {
      email: "a@x.com", rateKey: "a@x.com",
      codeHash: HASH,
    });
    expect(again.ok).toBe(true);
  });

  it("caps a single email at 5 per 24h", async () => {
    const t = newTest();
    for (let i = 0; i < 5; i++) {
      const r = await t.mutation(internal.challenges.create, {
        email: "a@x.com", rateKey: "a@x.com",
        codeHash: HASH,
      });
      expect(r.ok).toBe(true);
      vi.advanceTimersByTime(MIN + 1000);
    }
    const sixth = await t.mutation(internal.challenges.create, {
      email: "a@x.com", rateKey: "a@x.com",
      codeHash: HASH,
    });
    expect(sixth).toMatchObject({ ok: false, reason: "daily_cap" });
  });

  it("caps all emails together at 450 per 24h", async () => {
    const t = newTest();
    for (let i = 0; i < 450; i++) {
      const r = await t.mutation(internal.challenges.create, {
        email: `user${i}@x.com`, rateKey: `user${i}@x.com`,
        codeHash: HASH,
      });
      expect(r.ok).toBe(true);
    }
    const over = await t.mutation(internal.challenges.create, {
      email: "late@x.com", rateKey: "late@x.com",
      codeHash: HASH,
    });
    expect(over).toMatchObject({ ok: false, reason: "global_cap" });
  }, 60_000);

  it("a drained global bucket does not burn a guest's per-email tokens", async () => {
    const t = newTest();
    await t.run(async (ctx) => {
      for (let i = 0; i < 450; i++) await rateLimiter.limit(ctx, "otpDailyGlobal");
    });
    const blocked = await t.mutation(internal.challenges.create, {
      email: "a@x.com",
      rateKey: "k-a",
      codeHash: HASH,
    });
    expect(blocked).toMatchObject({ ok: false, reason: "global_cap" });
    await t.mutation(internal.admin.resetCodeLimits, {});
    // Per-email cooldown and daily tokens were untouched: the guest goes straight through
    // and then still has 4 daily tokens left.
    const ok = await t.mutation(internal.challenges.create, {
      email: "a@x.com",
      rateKey: "k-a",
      codeHash: HASH,
    });
    expect(ok).toEqual({ ok: true });
    const left = await t.run((ctx) =>
      rateLimiter.check(ctx, "otpDailyPerEmail", { key: "k-a" }),
    );
    expect(left.ok).toBe(true);
  });

  it("a cooldown rejection does not consume daily or global tokens", async () => {
    const t = newTest();
    await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "k", codeHash: HASH });
    for (let i = 0; i < 10; i++) {
      await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "k", codeHash: HASH });
    }
    vi.advanceTimersByTime(MIN + 1000);
    // 4 more allowed (5 daily total, only 1 consumed so far)
    for (let i = 0; i < 4; i++) {
      const r = await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "k", codeHash: HASH });
      expect(r.ok).toBe(true);
      vi.advanceTimersByTime(MIN + 1000);
    }
    expect(
      await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "k", codeHash: HASH }),
    ).toMatchObject({ ok: false, reason: "daily_cap" });
  });

  it("supersedes prior unconsumed codes for the same email only", async () => {
    const t = newTest();
    await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "a@x.com", codeHash: "1".repeat(64) });
    await t.mutation(internal.challenges.create, { email: "b@x.com", rateKey: "b@x.com", codeHash: "2".repeat(64) });
    vi.advanceTimersByTime(MIN + 1000);
    await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "a@x.com", codeHash: "3".repeat(64) });
    const rows = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(rows.filter((r) => r.email === "a@x.com").map((r) => r.codeHash)).toEqual([
      "3".repeat(64),
    ]);
    expect(rows.filter((r) => r.email === "b@x.com")).toHaveLength(1);
  });

  it("does not write a challenge when rate limited", async () => {
    const t = newTest();
    await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "a@x.com", codeHash: "1".repeat(64) });
    await t.mutation(internal.challenges.create, { email: "a@x.com", rateKey: "a@x.com", codeHash: "2".repeat(64) });
    const rows = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(rows.map((r) => r.codeHash)).toEqual(["1".repeat(64)]);
  });
});

describe("challenges.purgeExpired", () => {
  it("deletes only expired challenges", async () => {
    const t = newTest();
    const now = Date.now();
    await t.run(async (ctx) => {
      for (const [email, expiresAt] of [
        ["old1@x.com", now - 1],
        ["old2@x.com", now - 5 * MIN],
        ["live@x.com", now + MIN],
      ] as const) {
        await ctx.db.insert("challenges", {
          email,
          codeHash: HASH,
          expiresAt,
          attempts: 0,
          consumed: false,
        });
      }
    });
    const n = await t.mutation(internal.challenges.purgeExpired, {});
    expect(n).toBe(2);
    const rows = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(rows.map((r) => r.email)).toEqual(["live@x.com"]);
  });

  it("works in batches and reschedules itself until done", async () => {
    const t = newTest();
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("challenges", {
          email: `o${i}@x.com`,
          codeHash: HASH,
          expiresAt: Date.now() - 1000,
          attempts: 0,
          consumed: i % 2 === 0,
        });
      }
    });
    const first = await t.mutation(internal.challenges.purgeExpired, { batchSize: 2 });
    expect(first).toBe(2);
    expect(await t.run((ctx) => ctx.db.query("challenges").collect())).toHaveLength(3);
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query("challenges").collect())).toHaveLength(0);
  });
});
