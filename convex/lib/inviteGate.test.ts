import { describe, expect, it } from "vitest";
import { checkInviteKey, MAX_INVITE_KEY_LENGTH } from "./inviteGate";

const KEY = "right-key";
const PEPPER = "pep";

describe("checkInviteKey", () => {
  it("ok on a matching key", async () => {
    expect(await checkInviteKey(KEY, KEY, PEPPER)).toBe("ok");
  });
  it("fails closed when the env key or pepper is unset/empty", async () => {
    for (const [k, p] of [[undefined, PEPPER], ["", PEPPER], [KEY, undefined], [KEY, ""]] as const) {
      expect(await checkInviteKey(KEY, k, p)).toBe("service_unavailable");
      expect(await checkInviteKey("", k, p)).toBe("service_unavailable");
    }
  });
  it("invalid_link on wrong, empty or overlong keys", async () => {
    expect(await checkInviteKey("wrong", KEY, PEPPER)).toBe("invalid_link");
    expect(await checkInviteKey("", KEY, PEPPER)).toBe("invalid_link");
    expect(await checkInviteKey("x".repeat(MAX_INVITE_KEY_LENGTH + 1), KEY, PEPPER)).toBe("invalid_link");
    expect(await checkInviteKey(KEY + "x".repeat(MAX_INVITE_KEY_LENGTH), KEY, PEPPER)).toBe("invalid_link");
  });
  it("accepts a matching key of exactly the max length", async () => {
    const long = "k".repeat(MAX_INVITE_KEY_LENGTH);
    expect(await checkInviteKey(long, long, PEPPER)).toBe("ok");
  });
});
