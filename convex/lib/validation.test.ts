import { describe, expect, it } from "vitest";
import { normalizeWhatsapp, validateRsvp } from "./validation";

const base = { firstName: "Ada", surname: "Lovelace" };
const yes = {
  ...base,
  attending: "yes" as const,
  sport: "football" as const,
  team: "Arsenal",
  inviteChannel: "email" as const,
};

function errs(input: unknown) {
  const r = validateRsvp(input as never);
  return r.ok ? null : r.errors;
}

describe("validateRsvp", () => {
  it("accepts a minimal yes", () => {
    const r = validateRsvp(yes);
    expect(r.ok).toBe(true);
  });

  it("trims strings and drops empty optionals", () => {
    const r = validateRsvp({
      ...yes,
      firstName: "  Ada ",
      preferredName: "   ",
      funFact: " hi ",
    });
    expect(r.ok && r.value).toMatchObject({ firstName: "Ada", funFact: "hi" });
    expect(r.ok && "preferredName" in r.value).toBe(false);
  });

  it("enforces name lengths 1-100", () => {
    expect(errs({ ...yes, firstName: "" })).toHaveProperty("firstName");
    expect(errs({ ...yes, surname: "x".repeat(101) })).toHaveProperty("surname");
    expect(errs({ ...yes, preferredName: "x".repeat(101) })).toHaveProperty(
      "preferredName",
    );
  });

  it("enforces max lengths", () => {
    expect(errs({ ...yes, team: "x".repeat(151) })).toHaveProperty("team");
    expect(errs({ ...yes, funFact: "x".repeat(501) })).toHaveProperty("funFact");
    expect(errs({ ...yes, howKnowMakes: "x".repeat(501) })).toHaveProperty(
      "howKnowMakes",
    );
    expect(
      errs({ ...yes, sport: "other", otherSport: "x".repeat(61) }),
    ).toHaveProperty("otherSport");
  });

  it("requires sport, team and inviteChannel for yes/maybe", () => {
    for (const attending of ["yes", "maybe"] as const) {
      const e = errs({ ...base, attending });
      expect(e).toHaveProperty("sport");
      expect(e).toHaveProperty("team");
      expect(e).toHaveProperty("inviteChannel");
    }
  });

  it("requires otherSport iff sport is other", () => {
    expect(errs({ ...yes, sport: "other" })).toHaveProperty("otherSport");
    expect(errs({ ...yes, sport: "football", otherSport: "chess" })).toHaveProperty(
      "otherSport",
    );
    expect(errs({ ...yes, sport: "other", otherSport: "chess" })).toBeNull();
  });

  it("requires whatsapp iff channel is whatsapp, E.164-ish", () => {
    expect(errs({ ...yes, inviteChannel: "whatsapp" })).toHaveProperty("whatsapp");
    expect(errs({ ...yes, whatsapp: "+27821234567" })).toHaveProperty("whatsapp");
    expect(
      errs({ ...yes, inviteChannel: "whatsapp", whatsapp: "not a number" }),
    ).toHaveProperty("whatsapp");
    const ok = validateRsvp({
      ...yes,
      inviteChannel: "whatsapp",
      whatsapp: "+27 82 123 4567",
    });
    expect(ok.ok && ok.value.whatsapp).toBe("+27821234567");
    expect(
      errs({ ...yes, inviteChannel: "whatsapp", whatsapp: "+" + "1".repeat(30) }),
    ).toHaveProperty("whatsapp");
  });

  it("normalises whatsapp numbers to E.164", () => {
    const cases: [string, string][] = [
      ["082 123 4567", "+27821234567"],
      ["+27 82 123 4567", "+27821234567"],
      ["0027821234567", "+27821234567"],
      ["27821234567", "+27821234567"],
      ["+44 7700 900123", "+447700900123"],
    ];
    for (const [raw, expected] of cases) {
      expect(normalizeWhatsapp(raw)).toBe(expected);
      const r = validateRsvp({ ...yes, inviteChannel: "whatsapp", whatsapp: raw });
      expect(r.ok && r.value.whatsapp).toBe(expected);
    }
    for (const bad of ["082 123", "0000000000", "abc"]) {
      expect(normalizeWhatsapp(bad)).toBeNull();
      expect(
        errs({ ...yes, inviteChannel: "whatsapp", whatsapp: bad }),
      ).toHaveProperty("whatsapp");
    }
  });

  it("allows plusOneName only when plusOne", () => {
    expect(errs({ ...yes, plusOneName: "Bob" })).toHaveProperty("plusOneName");
    expect(errs({ ...yes, plusOne: false, plusOneName: "Bob" })).toHaveProperty(
      "plusOneName",
    );
    expect(errs({ ...yes, plusOne: true, plusOneName: "Bob" })).toBeNull();
    expect(errs({ ...yes, plusOne: true, plusOneName: "x".repeat(101) })).toHaveProperty(
      "plusOneName",
    );
  });

  it("strips everything but names for 'no'", () => {
    const r = validateRsvp({
      ...yes,
      attending: "no",
      preferredName: "Ad",
      plusOne: true,
      funFact: "x",
      whatsapp: "garbage",
    });
    expect(r.ok && r.value).toEqual({
      firstName: "Ada",
      surname: "Lovelace",
      attending: "no",
    });
  });

  it("still validates names for 'no'", () => {
    expect(errs({ firstName: "", surname: "L", attending: "no" })).toHaveProperty(
      "firstName",
    );
  });

  it("rejects an unknown attending value", () => {
    expect(errs({ ...yes, attending: "perhaps" })).toHaveProperty("attending");
  });

  it("strips control, bidi and zero-width characters before length checks", () => {
    const r = validateRsvp({
      ...yes,
      firstName: "\u202EAd\u200Ba\u0000\u2066",
      surname: "\uFEFFLove\u200Dlace\u007F",
      team: "Ars\u202Cenal\u0007",
      funFact: "line1\nline2\u200B",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.firstName).toBe("Ada");
      expect(r.value.surname).toBe("Lovelace");
      expect(r.value.team).toBe("Arsenal");
      expect(r.value.funFact).toBe("line1 line2");
    }
  });

  it("treats a field of only hostile characters as empty", () => {
    expect(errs({ ...yes, firstName: "\u200B\u202E\u2069 " })).toMatchObject({
      firstName: "Required",
    });
  });

  it("does not let hidden characters pad past the max length", () => {
    expect(errs({ ...yes, firstName: "a".repeat(100) + "\u200B".repeat(5) })).toBeNull();
    expect(errs({ ...yes, firstName: "a".repeat(101) })).toMatchObject({
      firstName: "Max 100 characters",
    });
  });
});
