import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { hmacCode } from "./lib/otp";
import { validateRsvp } from "./lib/validation";
import { newTest, PEPPER } from "./test.setup";

const EMAIL = "ada@example.com";
const CODE = "123456";

const yes = {
  firstName: "Ada",
  surname: "Lovelace",
  attending: "yes" as const,
  sport: "football" as const,
  team: "Arsenal",
  inviteChannel: "email" as const,
};

type T = ReturnType<typeof newTest>;

async function seedChallenge(t: T) {
  const codeHash = await hmacCode(CODE, PEPPER);
  await t.run((ctx) =>
    ctx.db.insert("challenges", {
      email: EMAIL,
      codeHash,
      expiresAt: Date.now() + 10 * 60_000,
      attempts: 0,
      consumed: false,
    }),
  );
}

async function submit(t: T, payload: Record<string, unknown>) {
  await seedChallenge(t);
  return t.mutation(internal.rsvp.consumeAndUpsert, {
    email: EMAIL,
    codeHash: await hmacCode(CODE, PEPPER),
    payload: payload as never,
  });
}

const guest = (t: T) =>
  t.run((ctx) =>
    ctx.db
      .query("guests")
      .withIndex("by_email", (q) => q.eq("email", EMAIL))
      .unique(),
  );

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("noticeVersion", () => {
  it("old payloads without it still save, with no noticeVersion field", async () => {
    const t = newTest();
    expect((await submit(t, yes)).status).toBe("saved");
    expect(await guest(t)).not.toHaveProperty("noticeVersion");
  });

  it("is stored on a yes row and on a decline", async () => {
    const t = newTest();
    expect((await submit(t, { ...yes, noticeVersion: "2026-11.1" })).status).toBe("saved");
    expect((await guest(t))?.noticeVersion).toBe("2026-11.1");

    const t2 = newTest();
    const res = await submit(t2, {
      firstName: "Ada",
      surname: "Lovelace",
      attending: "no",
      noticeVersion: "v2",
    });
    expect(res.status).toBe("saved");
    expect((await guest(t2))?.noticeVersion).toBe("v2");
  });

  it("is updated on a later reply", async () => {
    const t = newTest();
    await submit(t, { ...yes, noticeVersion: "v1" });
    expect((await submit(t, { ...yes, noticeVersion: "v2" })).status).toBe("updated");
    expect((await guest(t))?.noticeVersion).toBe("v2");
  });

  it.each(["", "V1", "has space", "a".repeat(33), "semi;colon", "v1\n", "é"])(
    "rejects %j without burning the code",
    async (bad) => {
      const t = newTest();
      const res = await submit(t, { ...yes, noticeVersion: bad });
      expect(res).toMatchObject({
        status: "invalid_payload",
        errors: { noticeVersion: expect.any(String) },
      });
      const ch = await t.run((ctx) => ctx.db.query("challenges").collect());
      expect(ch[0]).toMatchObject({ consumed: false, attempts: 0 });
      expect(await guest(t)).toBeNull();
    },
  );

  it("rejects a bad version on a decline too (check precedes the no early return)", () => {
    const r = validateRsvp({
      firstName: "A",
      surname: "B",
      attending: "no",
      noticeVersion: "BAD VALUE",
    });
    expect(r.ok).toBe(false);
  });

  it("accepts 32 chars of the allowed set", () => {
    const r = validateRsvp({
      firstName: "A",
      surname: "B",
      attending: "no",
      noticeVersion: "a1.-".repeat(8),
    });
    expect(r.ok).toBe(true);
  });
});

describe("unknown payload keys", () => {
  it.each(["notice", "mobile"])("are rejected by the arg validator (%s)", async (key) => {
    const t = newTest();
    await seedChallenge(t);
    await expect(
      t.mutation(internal.rsvp.consumeAndUpsert, {
        email: EMAIL,
        codeHash: await hmacCode(CODE, PEPPER),
        payload: { ...yes, [key]: "x" } as never,
      }),
    ).rejects.toThrow(/validator|extra field|ArgumentValidation/i);
    const ch = await t.run((ctx) => ctx.db.query("challenges").collect());
    expect(ch[0].consumed).toBe(false);
    expect(await guest(t)).toBeNull();
  });

  it("are rejected by the public action too", async () => {
    const t = newTest();
    await expect(
      t.action(api.rsvp.verifyAndSave, {
        email: EMAIL,
        code: CODE,
        inviteKey: "k",
        payload: { ...yes, notice: "x" } as never,
      }),
    ).rejects.toThrow(/validator|extra field|ArgumentValidation/i);
  });
});

describe("update preservation", () => {
  const full = { ...yes, funFact: "I juggle", howKnowMakes: "Uni", plusOne: true, plusOneName: "Bob" };

  it("keeps funFact/howKnowMakes when a yes reply omits them; plus-one and sport still clear", async () => {
    const t = newTest();
    await submit(t, full);
    const res = await submit(t, { ...yes, sport: "other", otherSport: "Padel", plusOne: false });
    expect(res.status).toBe("updated");
    const g = await guest(t);
    expect(g).toMatchObject({ funFact: "I juggle", howKnowMakes: "Uni", sport: "other", otherSport: "Padel" });
    expect(g?.plusOneName).toBeUndefined();
    expect(g?.plusOne).toBe(false);
  });

  it("keeps them on maybe, and a new value overrides", async () => {
    const t = newTest();
    await submit(t, full);
    await submit(t, { ...yes, attending: "maybe" });
    expect(await guest(t)).toMatchObject({ funFact: "I juggle", howKnowMakes: "Uni" });
    await submit(t, { ...yes, funFact: "New fact" });
    expect(await guest(t)).toMatchObject({ funFact: "New fact", howKnowMakes: "Uni" });
  });

  it("clears them on a no reply, and a later yes does not resurrect them", async () => {
    const t = newTest();
    await submit(t, full);
    await submit(t, { firstName: "Ada", surname: "Lovelace", attending: "no" });
    const g = await guest(t);
    expect(g?.funFact).toBeUndefined();
    expect(g?.howKnowMakes).toBeUndefined();
    expect(g?.plusOneName).toBeUndefined();
    await submit(t, yes);
    expect((await guest(t))?.funFact).toBeUndefined();
  });
});
