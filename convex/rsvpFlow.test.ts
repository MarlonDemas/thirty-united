import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { hmacCode, limiterKey } from "./lib/otp";
import { GLOBAL_DAILY_CAP, rateLimiter } from "./lib/limits";
import { newTest, PEPPER } from "./test.setup";

// Integration tests across challenges.create -> rsvp.consumeAndUpsert / rsvp.verifyAndSave.
// Unit-level cases (lockout, replay, cooldown, caps, ...) live in rsvp.test.ts / challenges.test.ts.

const MIN = 60_000;
const EMAIL = "ada@example.com";

const yes = {
  firstName: "Ada",
  surname: "Lovelace",
  attending: "yes" as const,
  sport: "football" as const,
  team: "Arsenal",
  inviteChannel: "email" as const,
};

type T = ReturnType<typeof newTest>;

/** Same as otp.requestCode minus the mail: store the HMAC of a known code. */
async function request(t: T, code: string, email = EMAIL) {
  const res = await t.mutation(internal.challenges.create, {
    email,
    codeHash: await hmacCode(code, PEPPER),
    rateKey: `rk:${email}`,
  });
  expect(res.ok).toBe(true);
}

async function verify(t: T, code: string, payload: Record<string, unknown> = yes, email = EMAIL) {
  return t.mutation(internal.rsvp.consumeAndUpsert, {
    email,
    codeHash: await hmacCode(code, PEPPER),
    payload: payload as never,
  });
}

const guests = (t: T) => t.run((ctx) => ctx.db.query("guests").collect());

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("code lifecycle (request then verify)", () => {
  it("a new request invalidates the previous code", async () => {
    const t = newTest();
    await request(t, "111111");
    vi.advanceTimersByTime(MIN + 1000); // past the resend cooldown
    await request(t, "222222");
    expect(await verify(t, "111111")).toEqual({ status: "invalid_code", attemptsLeft: 4 });
    expect((await verify(t, "222222")).status).toBe("saved");
  });

  it("the code is valid just before 10 minutes and expired at exactly 10", async () => {
    const t = newTest();
    await request(t, "111111");
    vi.advanceTimersByTime(10 * MIN - 1);
    expect((await verify(t, "111111", { ...yes })).status).toBe("saved");

    await request(t, "333333", "late@example.com");
    vi.advanceTimersByTime(10 * MIN);
    expect(await verify(t, "333333", yes, "late@example.com")).toEqual({ status: "code_expired" });
    expect(await guests(t)).toHaveLength(1);
  });

  it("after expiry, a fresh request issues a working new code", async () => {
    const t = newTest();
    await request(t, "111111");
    vi.advanceTimersByTime(11 * MIN);
    expect(await verify(t, "111111")).toEqual({ status: "code_expired" });
    await request(t, "444444");
    expect((await verify(t, "444444")).status).toBe("saved");
  });
});

describe("updates by the same email", () => {
  it("Yes -> No keeps ticketNo, drops sport/team/channel, keeps one row", async () => {
    const t = newTest();
    await request(t, "111111");
    const first = await verify(t, "111111", { ...yes, funFact: "hi", plusOne: true });
    expect(first).toMatchObject({ status: "saved", ticketNo: 1 });

    vi.advanceTimersByTime(MIN + 1000);
    await request(t, "222222");
    const second = await verify(t, "222222", {
      firstName: "Ada",
      surname: "Lovelace",
      attending: "no",
    });
    expect(second).toEqual({ status: "updated", ticketNo: 1, firstName: "Ada", surname: "Lovelace", attending: "no" });

    const rows = await guests(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].attending).toBe("no");
    for (const k of ["sport", "team", "inviteChannel", "funFact", "plusOne", "whatsapp"] as const) {
      expect(rows[0][k]).toBeUndefined();
    }
  });

  it("is case/whitespace-insensitive on email, so it updates rather than creating a second row", async () => {
    const t = newTest();
    await request(t, "111111");
    await verify(t, "111111");
    vi.advanceTimersByTime(MIN + 1000);
    await request(t, "222222");
    const res = await verify(t, "222222", { ...yes, attending: "maybe" }, "  ADA@Example.com ");
    expect(res).toMatchObject({ status: "updated", ticketNo: 1 });
    expect(await guests(t)).toHaveLength(1);
  });
});

describe("'no' path", () => {
  it("sport/team/channel sent with 'no' are ignored, not stored", async () => {
    const t = newTest();
    await request(t, "111111");
    const res = await verify(t, "111111", { ...yes, attending: "no" });
    expect(res).toEqual({ status: "saved", ticketNo: 1, firstName: "Ada", surname: "Lovelace", attending: "no" });
    const [g] = await guests(t);
    expect(g.sport).toBeUndefined();
    expect(g.team).toBeUndefined();
    expect(g.inviteChannel).toBeUndefined();
  });

  it("'no' needs no sport/team/channel at all", async () => {
    const t = newTest();
    await request(t, "111111");
    const res = await verify(t, "111111", { firstName: "Bo", surname: "Li", attending: "no" });
    expect(res.status).toBe("saved");
  });
});

describe("concurrency", () => {
  it("two concurrent verifies of the same email+code: both saved, one row, one ticket", async () => {
    const t = newTest();
    await request(t, "111111");
    const [a, b] = await Promise.all([verify(t, "111111"), verify(t, "111111")]);
    expect(a).toEqual(b);
    expect(a).toMatchObject({ status: "saved", ticketNo: 1 });
    const rows = await guests(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].ticketNo).toBe(1);
    const counter = await t.run((ctx) => ctx.db.query("counters").collect());
    expect(counter).toHaveLength(1);
    expect(counter[0].value).toBe(1);
  });

  it("concurrent verifies for different emails get distinct sequential tickets", async () => {
    const t = newTest();
    const emails = ["a@x.com", "b@x.com", "c@x.com", "d@x.com"];
    for (const e of emails) await request(t, "111111", e);
    const res = await Promise.all(emails.map((e) => verify(t, "111111", yes, e)));
    const tickets = res.map((r) => (r.status === "saved" ? r.ticketNo : -1)).sort();
    expect(tickets).toEqual([1, 2, 3, 4]);
    expect(await guests(t)).toHaveLength(4);
  });
});

describe("rsvp.verifyAndSave (public action)", () => {
  const KEY = "right-key";
  const call = (t: T, over: Record<string, unknown> = {}) =>
    t.action(api.rsvp.verifyAndSave, {
      email: EMAIL,
      code: "123456",
      payload: yes,
      inviteKey: KEY,
      ...over,
    } as never);
  function env() {
    vi.stubEnv("OTP_PEPPER", PEPPER);
    vi.stubEnv("INVITE_KEY", KEY);
  }

  it("hashes the code with OTP_PEPPER and saves", async () => {
    env();
    const t = newTest();
    await request(t, "123456");
    const res = await call(t, { code: " 123456 " });
    expect(res).toMatchObject({ status: "saved", ticketNo: 1 });
  });

  it("rejects a malformed code without touching the challenge", async () => {
    env();
    const t = newTest();
    await request(t, "123456");
    const res = await call(t, { code: "12ab56" });
    expect(res).toEqual({ status: "invalid_payload", errors: { code: "Enter the 6-digit code" } });
    const ch = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(ch[0]).toMatchObject({ attempts: 0, consumed: false });
  });

  it("is service_unavailable when OTP_PEPPER is missing", async () => {
    vi.stubEnv("OTP_PEPPER", "");
    vi.stubEnv("INVITE_KEY", KEY);
    const t = newTest();
    expect(await call(t)).toEqual({ status: "service_unavailable" });
  });

  it("is service_unavailable when INVITE_KEY is missing, and writes nothing", async () => {
    vi.stubEnv("OTP_PEPPER", PEPPER);
    vi.stubEnv("INVITE_KEY", "");
    const t = newTest();
    await request(t, "123456");
    expect(await call(t, { inviteKey: "" })).toEqual({ status: "service_unavailable" });
    expect(await call(t)).toEqual({ status: "service_unavailable" });
    const ch = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(ch[0]).toMatchObject({ attempts: 0, consumed: false });
    expect(await guests(t)).toHaveLength(0);
  });

  it("wrong/empty/overlong key: invalid_link, attempts untouched, no guest, even with a wrong code", async () => {
    env();
    const t = newTest();
    await request(t, "123456");
    for (const inviteKey of ["wrong-key", "", "x".repeat(300), KEY + "x".repeat(300)]) {
      // Right code, wrong code, and bad payload all look identical without the key.
      for (const over of [{}, { code: "000000" }, { payload: { ...yes, firstName: "" } }]) {
        expect(await call(t, { inviteKey, ...over })).toEqual({ status: "invalid_link" });
      }
    }
    const ch = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(ch).toHaveLength(1);
    expect(ch[0]).toMatchObject({ attempts: 0, consumed: false });
    expect(await guests(t)).toHaveLength(0);
  });

  it("keyless caller gets invalid_link whether or not a challenge exists (no no_code oracle)", async () => {
    env();
    const t = newTest();
    expect(await call(t, { inviteKey: "wrong" })).toEqual({ status: "invalid_link" });
  });

  it("right key: existing behaviour (wrong code burns an attempt, no_code without a challenge)", async () => {
    env();
    const t = newTest();
    expect(await call(t)).toEqual({ status: "no_code" });
    await request(t, "123456");
    expect(await call(t, { code: "000000" })).toEqual({ status: "invalid_code", attemptsLeft: 4 });
    expect(await call(t)).toMatchObject({ status: "saved", ticketNo: 1 });
  });
});

describe("otp.requestCode invite gate (public action)", () => {
  it("is service_unavailable when INVITE_KEY is missing", async () => {
    vi.stubEnv("OTP_PEPPER", PEPPER);
    vi.stubEnv("INVITE_KEY", "");
    const t = newTest();
    const res = await t.action(api.otp.requestCode, { email: EMAIL, inviteKey: "anything" });
    expect(res).toEqual({ status: "service_unavailable" });
  });

  it("wrong or overlong key: invalid_link, no limiter tokens consumed, no challenge row", async () => {
    vi.stubEnv("OTP_PEPPER", PEPPER);
    vi.stubEnv("INVITE_KEY", "right-key");
    const t = newTest();
    for (const inviteKey of ["wrong-key", "", "x".repeat(300)]) {
      const res = await t.action(api.otp.requestCode, { email: EMAIL, inviteKey });
      expect(res).toEqual({ status: "invalid_link" });
    }
    expect(await t.run((ctx) => ctx.db.query("challenges").collect())).toHaveLength(0);
    const rateKey = await limiterKey(EMAIL, PEPPER);
    const left = await t.run(async (ctx) => ({
      global: await rateLimiter.getValue(ctx, "otpDailyGlobal"),
      cooldown: await rateLimiter.check(ctx, "otpCooldown", { key: rateKey }),
      perEmail: await rateLimiter.getValue(ctx, "otpDailyPerEmail", { key: rateKey }),
    }));
    expect(left.global.value).toBe(GLOBAL_DAILY_CAP);
    expect(left.cooldown.ok).toBe(true);
    expect(left.perEmail.value).toBe(5);
  });
});

describe("stale consumed challenge vs newer unconsumed challenge", () => {
  it("old consumed code A is invalid and burns an attempt on B's row; B then saves/updates", async () => {
    const t = newTest();
    await request(t, "111111");
    const first = await verify(t, "111111");
    expect(first).toMatchObject({ status: "saved", ticketNo: 1 });

    // challenges.create deletes only unconsumed rows, so consumed A survives next to new B.
    vi.advanceTimersByTime(MIN + 1000);
    await request(t, "222222");
    const rows = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(rows).toHaveLength(2);

    const replayA = await verify(t, "111111", { ...yes, firstName: "Eve", surname: "Byron" });
    expect(replayA).toEqual({ status: "invalid_code", attemptsLeft: 4 });
    const after = await t.run((ctx) => ctx.db.query("challenges").collect());
    const b = after.find((r) => !r.consumed)!;
    const a = after.find((r) => r.consumed)!;
    expect(b.attempts).toBe(1);
    expect(a.attempts).toBe(0);
    const [g] = await guests(t);
    expect(g).toMatchObject({ firstName: "Ada", surname: "Lovelace", ticketNo: 1 });

    const second = await verify(t, "222222", { ...yes, surname: "King" });
    expect(second).toEqual({
      status: "updated",
      ticketNo: 1,
      firstName: "Ada",
      surname: "King",
      team: "Arsenal",
      attending: "yes",
    });
    expect(await guests(t)).toHaveLength(1);
  });
});
