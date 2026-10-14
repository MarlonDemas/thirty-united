import { describe, expect, it } from "vitest";
import { toCsv } from "../../scripts/export-rsvps.mjs";

const csvFor = (field: string, value: string): string => {
  const lines = (toCsv([{ ticketNo: 1, [field]: value }]) as string).trim().split("\n");
  return lines[1];
};
const funFact = (v: string) => csvFor("funFact", v).split(",")[11];

describe("export-rsvps cell escaping", () => {
  it.each(["=1+1", "@SUM(A1)", "-1-1", "+1+1", "-1+cmd", "+27 82 (123) 4567", "1-1"])(
    "neutralises %j unless it is a single plain number",
    (v) => {
      const out = funFact(v);
      if (/^-?\d+(\.\d+)?$/.test(v)) expect(out).toBe(v);
      else if (/^[=@+-]/.test(v)) expect(out).toBe(`'${v}`);
    },
  );
  it("leaves single plain numbers alone", () => {
    expect(funFact("-5")).toBe("-5");
    expect(funFact("-5.25")).toBe("-5.25");
    expect(funFact("42")).toBe("42");
  });
  it("prefixes signed numbers with extra operators", () => {
    expect(funFact("-1-1")).toBe("'-1-1");
    expect(funFact("+1")).toBe("'+1");
    expect(funFact("-1.")).toBe("'-1.");
  });
  it("prefixes tab/cr leading values", () => {
    expect(funFact("\tx")).toBe("'\tx");
  });
});
