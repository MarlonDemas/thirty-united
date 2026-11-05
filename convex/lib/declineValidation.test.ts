import { describe, expect, it } from "vitest";
import {
  DECLINE_NOTICE_VERSIONS,
  declineNameKey,
  validateDecline,
} from "./declineValidation";

const base = { firstName: "Ada", surname: "Lovelace", noticeVersion: "popia-2026-11-v2" };
const errorsOf = (over: Record<string, unknown>) => {
  const r = validateDecline({ ...base, ...over } as never);
  return r.ok ? null : r.errors;
};

describe("validateDecline", () => {
  it("accepts a clean decline and returns the nameKey", () => {
    const r = validateDecline({ ...base, reason: "  Out of town " });
    expect(r).toEqual({
      ok: true,
      value: { ...base, reason: "Out of town", nameKey: "ada|lovelace" },
    });
  });
  it("treats an empty or whitespace reason as absent", () => {
    const r = validateDecline({ ...base, reason: " \n " });
    expect(r.ok && "reason" in r.value).toBe(false);
  });
  it.each(["Ada1", "a@b", "a/b", "a:b", "---", "..."])("rejects name %j", (n) => {
    expect(errorsOf({ firstName: n })).toHaveProperty("firstName");
  });
  it.each(["Zoë", "O'Brien", "O’Brien", "Anne-Marie", "J. R.", "José María"])(
    "accepts name %j",
    (n) => {
      expect(errorsOf({ surname: n })).toBeNull();
    },
  );
  it("requires both names and caps them at 100", () => {
    expect(errorsOf({ firstName: "  ", surname: "" })).toMatchObject({
      firstName: "Required",
      surname: "Required",
    });
    expect(errorsOf({ firstName: "a".repeat(101) })).toHaveProperty("firstName");
    expect(errorsOf({ firstName: "a".repeat(100) })).toBeNull();
  });
  it("caps the reason at 140", () => {
    expect(errorsOf({ reason: "x".repeat(141) })).toHaveProperty("reason");
    expect(errorsOf({ reason: "x".repeat(140) })).toBeNull();
  });
  it.each(["see https://x.io", "HTTP://x.io", "go to www.x.io", "WWW.X.IO", "ｈｔｔｐｓ：／／x.io"])(
    "rejects a reason with a URL: %j",
    (reason) => {
      expect(errorsOf({ reason })).toHaveProperty("reason");
    },
  );
  it("rejects notice versions outside the allow-list or the format", () => {
    expect(DECLINE_NOTICE_VERSIONS).toEqual(["popia-2026-11-v2"]);
    expect(errorsOf({ noticeVersion: "popia-2026-11-v1" })).toHaveProperty("noticeVersion");
    expect(errorsOf({ noticeVersion: " popia-2026-11-v2" })).toHaveProperty("noticeVersion");
    expect(errorsOf({ noticeVersion: "" })).toHaveProperty("noticeVersion");
  });
});

describe("declineNameKey", () => {
  it("folds case, width, spacing and invisible characters", () => {
    const k = "ada|lovelace";
    expect(declineNameKey("ADA", "Lovelace")).toBe(k);
    expect(declineNameKey("  Ａda ", "Love​lace")).toBe(k);
    expect(declineNameKey("Ada", "Love­lace")).toBe(k);
  });
  it("collapses inner whitespace and composes accents", () => {
    expect(declineNameKey("Anne   Marie", "Zoë")).toBe("anne marie|zoë");
  });
});
