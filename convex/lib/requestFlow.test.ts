import { describe, expect, it, vi } from "vitest";
import { hmacCode, limiterKey } from "./otp";
import { MAX_INVITE_KEY_LENGTH, requestCodeFlow, type RequestCodeDeps } from "./requestFlow";

function deps(over: Partial<RequestCodeDeps> = {}) {
  const created: { email: string; codeHash: string; rateKey: string }[] = [];
  const sent: { to: string; code: string }[] = [];
  const d: RequestCodeDeps = {
    pepper: "pep",
    inviteKey: "invite-key",
    generateCode: () => "654321",
    createChallenge: async (email, codeHash, rateKey) => {
      created.push({ email, codeHash, rateKey });
      return { ok: true };
    },
    sendMail: async (to, code) => {
      sent.push({ to, code });
      return true;
    },
    ...over,
  };
  return { d, created, sent };
}

const KEY = "invite-key";

describe("requestCodeFlow", () => {
  it("sends the code and stores only its hash", async () => {
    const { d, created, sent } = deps();
    expect(await requestCodeFlow("  Ada@X.com ", KEY, d)).toEqual({ status: "sent" });
    expect(sent).toEqual([{ to: "ada@x.com", code: "654321" }]);
    expect(created).toEqual([
      {
        email: "ada@x.com",
        codeHash: await hmacCode("654321", "pep"),
        rateKey: await limiterKey("ada@x.com", "pep"),
      },
    ]);
    expect(JSON.stringify(created)).not.toContain("654321");
  });

  it("keys rate limits by a prefixed HMAC, never the plaintext email or a code hash", async () => {
    const { d, created } = deps();
    await requestCodeFlow("ada@x.com", KEY, d);
    const key = created[0].rateKey;
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("ada");
    expect(key).not.toBe(await hmacCode("ada@x.com", "pep"));
    expect(key).not.toBe(created[0].codeHash);
  });

  it("rejects invalid email without touching anything", async () => {
    const { d, created, sent } = deps();
    expect(await requestCodeFlow("nope", KEY, d)).toEqual({ status: "invalid_email" });
    expect(created).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("is service_unavailable when the pepper is missing", async () => {
    const { d, created } = deps({ pepper: undefined });
    expect(await requestCodeFlow("a@x.com", KEY, d)).toEqual({ status: "service_unavailable" });
    expect(created).toHaveLength(0);
  });

  it("maps a rate-limited challenge to rate_limited without sending", async () => {
    const { d, sent } = deps({
      createChallenge: async () => ({ ok: false, reason: "cooldown", retryAfter: 30_000 }),
    });
    expect(await requestCodeFlow("a@x.com", KEY, d)).toEqual({
      status: "rate_limited",
      retryAfterMs: 30_000,
    });
    expect(sent).toHaveLength(0);
  });

  it("is service_unavailable when sending fails or throws", async () => {
    const a = deps({ sendMail: async () => false });
    expect(await requestCodeFlow("a@x.com", KEY, a.d)).toEqual({ status: "service_unavailable" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const b = deps({
      sendMail: async () => {
        throw new Error("smtp down 654321");
      },
    });
    expect(await requestCodeFlow("a@x.com", KEY, b.d)).toEqual({ status: "service_unavailable" });
    expect(spy.mock.calls.flat().join(" ")).not.toContain("654321");
    spy.mockRestore();
  });

  it("is service_unavailable when INVITE_KEY is unset or empty (fail closed)", async () => {
    for (const inviteKey of [undefined, ""]) {
      const { d, created, sent } = deps({ inviteKey });
      expect(await requestCodeFlow("a@x.com", "", d)).toEqual({ status: "service_unavailable" });
      expect(await requestCodeFlow("a@x.com", KEY, d)).toEqual({ status: "service_unavailable" });
      expect(created).toHaveLength(0);
      expect(sent).toHaveLength(0);
    }
  });

  it("returns invalid_link for a wrong key before any side effect, even with a bad email", async () => {
    const { d, created, sent } = deps();
    const gen = vi.fn(() => "654321");
    d.generateCode = gen;
    expect(await requestCodeFlow("a@x.com", "wrong", d)).toEqual({ status: "invalid_link" });
    expect(await requestCodeFlow("a@x.com", "", d)).toEqual({ status: "invalid_link" });
    expect(await requestCodeFlow("nope", "wrong", d)).toEqual({ status: "invalid_link" });
    expect(created).toHaveLength(0);
    expect(sent).toHaveLength(0);
    expect(gen).not.toHaveBeenCalled();
  });

  it("returns invalid_link for an overlong key, even if it starts with the real key", async () => {
    const { d, created } = deps();
    expect(await requestCodeFlow("a@x.com", "x".repeat(MAX_INVITE_KEY_LENGTH + 1), d)).toEqual({
      status: "invalid_link",
    });
    expect(await requestCodeFlow("a@x.com", KEY + "x".repeat(MAX_INVITE_KEY_LENGTH), d)).toEqual({
      status: "invalid_link",
    });
    expect(created).toHaveLength(0);
  });

  it("accepts a key of exactly the maximum length when it matches", async () => {
    const long = "k".repeat(MAX_INVITE_KEY_LENGTH);
    const { d } = deps({ inviteKey: long });
    expect(await requestCodeFlow("a@x.com", long, d)).toEqual({ status: "sent" });
  });
});
