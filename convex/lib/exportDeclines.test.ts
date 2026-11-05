import { describe, expect, it } from "vitest";
import { toCsv } from "../../scripts/export-declines.mjs";

const row = (reason: string) => ({
  firstName: "Ada",
  surname: "Lovelace",
  reason,
  noticeVersion: "popia-2026-11-v2",
  createdAt: 0,
  updatedAt: 0,
});
// The first cell is the quoted "self-reported, unverified" marker; drop it before splitting.
const reasonCell = (v: string) =>
  (toCsv([row(v)]) as string).trim().split("\n")[1].replace(/^"[^"]*",/, "").split(",")[2];

describe("export-declines", () => {
  it("marks every row as self-reported and unverified", () => {
    const lines = (toCsv([row("x")]) as string).trim().split("\n");
    expect(lines[0].split(",")[0]).toBe("source");
    expect(lines[1]).toMatch(/^"self-reported, unverified",Ada,Lovelace,/);
  });
  it.each(["=1+1", "+1+1", "-1-1", "@SUM(A1)"])("neutralises a reason starting %j", (v) => {
    expect(reasonCell(v)).toBe(`'${v}`);
  });
});
