import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { hmacCode } from "./lib/otp";
import { newTest, PEPPER } from "./test.setup";

const MIN = 60_000;
const EMAIL = "ada@example.com";
const CODE = "123456";

const yesPayload = {
  firstName: "Ada",
  surname: "Lovelace",
  attending: "yes" as const,
  sport: "football" as const,
  team: "Arsenal",
  inviteChannel: "email" as const,
};

type T = ReturnType<typeof newTest>;

async function seedChallenge(
  t: T,
  opts: { email?: string; code?: string; expiresAt?: number; attempts?: number; consumed?: boolean } = {},
) {
  const codeHash = await hmacCode(opts.code ?? CODE, PEPPER);
  await t.run((ctx) =>
    ctx.db.insert("challenges", {
      email: opts.email ?? EMAIL,
      codeHash,
      expiresAt: opts.expiresAt ?? Date.now() + 10 * MIN,
      attempts: opts.attempts ?? 0,
      consumed: opts.consumed ?? false,
    }),
  );
}

async function submit(
  t: T,
  opts: { email?: string; code?: string; payload?: Record<string, unknown> } = {},
) {
  return t.mutation(internal.rsvp.consumeAndUpsert, {
    email: opts.email ?? EMAIL,
    codeHash: await hmacCode(opts.code ?? CODE, PEPPER),
    payload: (opts.payload ?? yesPayload) as never,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("rsvp.consumeAndUpsert", () => {
  it("saves a new guest and consumes the code", async () => {
    const t = newTest();
    await seedChallenge(t);
    const res = await submit(t);
    expect(res).toEqual({
      status: "saved",
      ticketNo: 1,
      firstName: "Ada",
      surname: "Lovelace",
      team: "Arsenal",
      attending: "yes",
    });
    const guests = await t.run((ctx) => ctx.db.query("guests").collect());
    expect(guests).toHaveLength(1);
    expect(guests[0]).toMatchObject({
      email: EMAIL,
      ticketNo: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const ch = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(ch[0].consumed).toBe(true);
  });

  it("replay of a consumed correct code is idempotent: same ticket, nothing written", async () => {
    const t = newTest();
    await seedChallenge(t);
    const first = await submit(t);
    const snapshot = async () => ({
      guests: await t.run((ctx) => ctx.db.query("guests").collect()),
      counters: await t.run((ctx) => ctx.db.query("counters").collect()),
      challenges: await t.run((ctx) => ctx.db.query("challenges").collect()),
    });
    const before = await snapshot();
    vi.advanceTimersByTime(MIN);
    // a different payload on the replay must NOT be applied
    const replay = await submit(t, {
      payload: { ...yesPayload, attending: "maybe", team: "Spurs", firstName: "Eve", surname: "Byron" },
    });
    expect(replay).toEqual(first);
    expect(replay).toEqual({
      status: "saved",
      ticketNo: 1,
      firstName: "Ada",
      surname: "Lovelace",
      team: "Arsenal",
      attending: "yes",
    });
    expect(await snapshot()).toEqual(before);
  });

  it("replay for a stored 'no' RSVP returns the no shape", async () => {
    const t = newTest();
    await seedChallenge(t);
    const first = await submit(t, { payload: { ...yesPayload, attending: "no" } });
    expect(first).toEqual({ status: "saved", ticketNo: 1, firstName: "Ada", surname: "Lovelace", attending: "no" });
    expect(await submit(t, { payload: { ...yesPayload, attending: "no" } })).toEqual(first);
  });

  it("consumed challenge + wrong code is an invalid_code and locks out after 5", async () => {
    const t = newTest();
    await seedChallenge(t);
    await submit(t);
    for (let i = 0; i < 5; i++) {
      expect(await submit(t, { code: "999999" })).toEqual({
        status: "invalid_code",
        attemptsLeft: 4 - i,
      });
    }
    expect(await submit(t, { code: "999999" })).toEqual({ status: "too_many_attempts" });
    // locked out even with the right code
    expect(await submit(t)).toEqual({ status: "too_many_attempts" });
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(1);
  });

  it("consumed + expired returns no_code (consumed wins over expiry, as before)", async () => {
    const t = newTest();
    await seedChallenge(t);
    await submit(t);
    vi.advanceTimersByTime(11 * MIN);
    expect(await submit(t)).toEqual({ status: "no_code" });
    expect(await submit(t, { code: "000000" })).toEqual({ status: "no_code" });
  });

  it("returns no_code when there is no challenge", async () => {
    const t = newTest();
    expect(await submit(t)).toEqual({ status: "no_code" });
  });

  it("returns code_expired for an expired challenge", async () => {
    const t = newTest();
    await seedChallenge(t, { expiresAt: Date.now() - 1 });
    expect(await submit(t)).toEqual({ status: "code_expired" });
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(0);
  });

  it("wrong code decrements attemptsLeft and saves nothing", async () => {
    const t = newTest();
    await seedChallenge(t);
    expect(await submit(t, { code: "000000" })).toEqual({
      status: "invalid_code",
      attemptsLeft: 4,
    });
    expect(await submit(t, { code: "000001" })).toEqual({
      status: "invalid_code",
      attemptsLeft: 3,
    });
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(0);
    // the right code still works afterwards
    expect((await submit(t)).status).toBe("saved");
  });

  it("locks out after 5 wrong attempts, even with the right code", async () => {
    const t = newTest();
    await seedChallenge(t);
    for (let i = 0; i < 5; i++) {
      const r = await submit(t, { code: "999999" });
      expect(r).toEqual({ status: "invalid_code", attemptsLeft: 4 - i });
    }
    expect(await submit(t, { code: "999999" })).toEqual({ status: "too_many_attempts" });
    expect(await submit(t)).toEqual({ status: "too_many_attempts" });
    expect(await t.run((ctx) => ctx.db.query("guests").collect())).toHaveLength(0);
  });

  it("only considers the latest challenge for the email", async () => {
    const t = newTest();
    await seedChallenge(t, { code: "111111" });
    await seedChallenge(t, { code: "222222" });
    expect((await submit(t, { code: "111111" })).status).toBe("invalid_code");
    expect((await submit(t, { code: "222222" })).status).toBe("saved");
  });

  it("assigns sequential ticket numbers 1, 2, 3", async () => {
    const t = newTest();
    const tickets: unknown[] = [];
    for (const email of ["a@x.com", "b@x.com", "c@x.com"]) {
      await seedChallenge(t, { email });
      const r = await submit(t, { email });
      tickets.push(r.status === "saved" ? r.ticketNo : r);
    }
    expect(tickets).toEqual([1, 2, 3]);
  });

  it("updates an existing guest, keeping ticketNo and createdAt", async () => {
    const t = newTest();
    await seedChallenge(t);
    await submit(t);
    const created = Date.now();
    vi.advanceTimersByTime(5 * MIN);
    await seedChallenge(t);
    const res = await submit(t, {
      payload: { ...yesPayload, attending: "maybe", team: "Spurs", funFact: "hi" },
    });
    expect(res).toEqual({
      status: "updated",
      ticketNo: 1,
      firstName: "Ada",
      surname: "Lovelace",
      team: "Spurs",
      attending: "maybe",
    });
    const guests = await t.run((ctx) => ctx.db.query("guests").collect());
    expect(guests).toHaveLength(1);
    expect(guests[0]).toMatchObject({
      ticketNo: 1,
      createdAt: created,
      updatedAt: Date.now(),
      team: "Spurs",
      funFact: "hi",
    });
    // a new guest after an update still gets the next number
    await seedChallenge(t, { email: "b@x.com" });
    const b = await submit(t, { email: "b@x.com" });
    expect(b.status === "saved" && b.ticketNo).toBe(2);
  });

  it("update replaces the row so stale fields are removed", async () => {
    const t = newTest();
    await seedChallenge(t);
    await submit(t, { payload: { ...yesPayload, funFact: "old", plusOne: true, plusOneName: "Bob" } });
    await seedChallenge(t);
    await submit(t, { payload: { ...yesPayload } });
    const g = (await t.run((ctx) => ctx.db.query("guests").collect()))[0];
    expect(g.funFact).toBeUndefined();
    expect(g.plusOne).toBeUndefined();
    expect(g.plusOneName).toBeUndefined();
  });

  it("'no' keeps only names, email and attending", async () => {
    const t = newTest();
    await seedChallenge(t);
    const res = await submit(t, {
      payload: {
        ...yesPayload,
        attending: "no",
        preferredName: "Ad",
        plusOne: true,
        funFact: "x",
        whatsapp: "garbage",
      },
    });
    expect(res).toEqual({ status: "saved", ticketNo: 1, firstName: "Ada", surname: "Lovelace", attending: "no" });
    const g = (await t.run((ctx) => ctx.db.query("guests").collect()))[0];
    expect(Object.keys(g).sort()).toEqual(
      [
        "_creationTime",
        "_id",
        "attending",
        "createdAt",
        "email",
        "firstName",
        "surname",
        "ticketNo",
        "updatedAt",
      ].sort(),
    );
  });

  it("invalid payload returns errors and does not burn the code", async () => {
    const t = newTest();
    await seedChallenge(t);
    const bad = await submit(t, {
      payload: { firstName: "Ada", surname: "L", attending: "yes" },
    });
    expect(bad.status).toBe("invalid_payload");
    if (bad.status === "invalid_payload") {
      expect(bad.errors).toHaveProperty("sport");
      expect(bad.errors).toHaveProperty("team");
      expect(bad.errors).toHaveProperty("inviteChannel");
    }
    const ch = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(ch[0]).toMatchObject({ consumed: false, attempts: 0 });
    expect((await submit(t)).status).toBe("saved");
  });

  it("rejects an invalid email argument", async () => {
    const t = newTest();
    const res = await submit(t, { email: "nope" });
    expect(res.status).toBe("invalid_payload");
  });
});
