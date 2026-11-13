import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DECLINE_NOTICE_VERSIONS,
  REASON_MAX,
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
  it.each([
    "ht\u00ADtps://evil",
    "https\u2061://evil",
    "ht\u200Etps://evil",
    [..."https://evil.example"].map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0))).join(""),
  ])("rejects a hidden-character URL: %j", (reason) => {
    expect(errorsOf({ reason })).toHaveProperty("reason");
  });
  it("stores a reason and names without hidden characters", () => {
    const r = validateDecline({
      ...base,
      firstName: "Ad\u3164a",
      reason: "Out\u200E of\u2061 town\u{E0041}",
    });
    expect(r.ok && r.value).toMatchObject({ firstName: "Ada", reason: "Out of town" });
  });
  it("drops a reason that is only hidden characters", () => {
    const r = validateDecline({ ...base, reason: "\u200E\u00AD" });
    expect(r.ok && "reason" in r.value).toBe(false);
  });
  it.each(["\u3164", "\u115F", "\u1160", "\uFFA0", "\u2800", "\u3164\u3164"])(
    "rejects invisible name %j",
    (n) => {
      expect(errorsOf({ firstName: n })).toMatchObject({ firstName: "Use letters only" });
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
  it("folds apostrophe variants so a smart-quote name matches a straight one", () => {
    const k = declineNameKey("Ada", "O'Brien");
    for (const q of ["’", "‘", "ʼ", "`", "´"]) expect(declineNameKey("Ada", `O${q}Brien`)).toBe(k);
  });
  it("collapses inner whitespace and composes accents", () => {
    expect(declineNameKey("Anne   Marie", "Zoë")).toBe("anne marie|zoë");
  });
});

describe("notice version lockstep", () => {
  it("the client's NOTICE_VERSION is allowed by the server", () => {
    // Read as text: src/ is outside the convex tsconfig, and this avoids a cross-project import.
    const src = readFileSync(new URL("../../src/matchday/config.js", import.meta.url), "utf8");
    const m = /export const NOTICE_VERSION\s*=\s*['"]([^'"]+)['"]/.exec(src);
    expect(m).not.toBeNull();
    expect(DECLINE_NOTICE_VERSIONS).toContain(m![1]);
  });

  it("the client's reason limit matches the server's", () => {
    const src = readFileSync(new URL("../../src/matchday/fields.js", import.meta.url), "utf8");
    // `export const REASON_MAX = 140`; fall back to the reason field's own `maxlength: 140`.
    const m =
      /\bREASON_MAX\s*=\s*(\d+)/.exec(src) ??
      /reason:\s*\{[^}]*?max(?:length)?:\s*(\d+)/.exec(src);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBe(REASON_MAX);
  });
});
