import { describe, expect, it } from "vitest";
import { buildMessage, FROM_NAME } from "./message";

describe("buildMessage", () => {
  const m = buildMessage("123456");
  it("includes the code and the 10-minute note in text and html", () => {
    expect(m.text).toContain("123456");
    expect(m.text).toContain("10 minutes");
    expect(m.html).toContain("123456");
    expect(m.html).toContain("10 minutes");
  });
  it("has a subject without the code and the host name", () => {
    expect(m.subject).not.toContain("123456");
    expect(FROM_NAME).toBe("Makes' 30th");
  });
});
