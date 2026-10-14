import { describe, expect, it } from "vitest";
import {
  constantTimeEqual,
  generateCode,
  hmacCode,
  isValidEmail,
  normalizeEmail,
} from "./otp";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Makes@Example.COM ")).toBe("makes@example.com");
  });
});

describe("isValidEmail", () => {
  it.each(["a@b.co", "first.last+tag@sub.example.com", "x_y@ex-ample.org"])(
    "accepts %s",
    (e) => expect(isValidEmail(e)).toBe(true),
  );
  it.each([
    "",
    "plain",
    "a@b",
    "a b@c.com",
    "@c.com",
    "a@.com",
    "a..b@c.com",
    ".a@c.com",
    "a@c..com",
    "a@@c.com",
  ])("rejects %j", (e) => expect(isValidEmail(e)).toBe(false));
  it("rejects over 254 chars", () => {
    const long = `${"a".repeat(60)}@${"b".repeat(60)}.${"c".repeat(60)}.${"d".repeat(60)}.${"e".repeat(20)}.com`;
    expect(long.length).toBeGreaterThan(254);
    expect(isValidEmail(long)).toBe(false);
  });
  it("rejects local part over 64 chars", () => {
    expect(isValidEmail(`${"a".repeat(65)}@example.com`)).toBe(false);
  });
});

describe("hmacCode", () => {
  it("is deterministic 64-char hex", async () => {
    const a = await hmacCode("123456", "pepper");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hmacCode("123456", "pepper")).toBe(a);
  });
  it("changes with code and pepper", async () => {
    const a = await hmacCode("123456", "pepper");
    expect(await hmacCode("123457", "pepper")).not.toBe(a);
    expect(await hmacCode("123456", "other")).not.toBe(a);
  });
  it("matches the known HMAC-SHA256 vector", async () => {
    // RFC 4231-style check computed independently: HMAC("key", "The quick brown fox...")
    expect(
      await hmacCode("The quick brown fox jumps over the lazy dog", "key"),
    ).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });
});

describe("constantTimeEqual", () => {
  it("compares equal and unequal strings", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
    expect(constantTimeEqual("", "")).toBe(true);
  });
});

describe("generateCode", () => {
  const rng = (values: number[]) => (arr: Uint32Array) => {
    arr[0] = values.shift()!;
    return arr;
  };
  it("pads to 6 digits", () => {
    expect(generateCode(rng([42]))).toBe("000042");
  });
  it("rejects biased values (modulo bias) and redraws", () => {
    expect(generateCode(rng([4_294_000_000, 4_294_967_295, 123_456]))).toBe(
      "123456",
    );
  });
  it("produces 6 digits with the real RNG", () => {
    for (let i = 0; i < 50; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });
});
