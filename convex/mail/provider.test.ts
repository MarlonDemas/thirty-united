import { describe, expect, it } from "vitest";
import { PRODUCTION_CLOUD_URL, resolveProvider } from "./provider";

describe("resolveProvider", () => {
  it("accepts gmail regardless of the mock flag", () => {
    expect(resolveProvider("gmail")).toBe("gmail");
    expect(resolveProvider(" Gmail ", "true")).toBe("gmail");
  });
  it("accepts mock only with MAIL_ALLOW_MOCK=true", () => {
    expect(resolveProvider(" Mock ", "true")).toBe("mock");
    expect(resolveProvider("mock", " TRUE ")).toBe("mock");
  });
  it.each([undefined, "", "false", "1", "yes"])("refuses mock when the flag is %j", (flag) => {
    expect(resolveProvider("mock", flag)).toBeNull();
  });
  it.each([undefined, "", "sendgrid", "GMAIL2"])("treats %j as unavailable", (v) => {
    expect(resolveProvider(v, "true")).toBeNull();
  });

  describe("production guard", () => {
    it.each([
      PRODUCTION_CLOUD_URL,
      PRODUCTION_CLOUD_URL + "/",
      ` ${PRODUCTION_CLOUD_URL.toUpperCase()} `,
    ])("refuses mock on %j even with the flag set", (url) => {
      expect(resolveProvider("mock", "true", url)).toBeNull();
    });
    it("still allows mock on another deployment and gmail on production", () => {
      expect(resolveProvider("mock", "true", "https://other-dev-123.convex.cloud")).toBe("mock");
      expect(resolveProvider("gmail", undefined, PRODUCTION_CLOUD_URL)).toBe("gmail");
    });
  });
});
