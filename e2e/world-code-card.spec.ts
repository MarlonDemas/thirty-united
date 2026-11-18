import { test, expect } from "@playwright/test";
import { fetchCode, resetLimits } from "./mail-code";
import { MOBILE, openWorld, chooseJustReply, fillFastLane, submitFastLane, enterCode, waitForCodeSent, uniqueEmail } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 60_000 });

// One email per test, cleaned up afterwards so the 60 s resend cooldown and the daily cap never leak between runs.
let email = "";
test.beforeEach(() => {
  email = uniqueEmail("code");
});
test.afterEach(async () => {
  await resetLimits(email);
});

async function reachCodeCard(page: import("@playwright/test").Page) {
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "yes", first: "Alan", surname: "Turing", email, team: "Neutral" });
  await submitFastLane(page);
  await waitForCodeSent(page);
}

test("a wrong code is refused with the tries left, then the right code saves", async ({ page }) => {
  await reachCodeCard(page);
  const code = await fetchCode(email);
  const wrong = code === "000000" ? "111111" : "000000";

  await enterCode(page, wrong);
  await expect(page.getByText(/That code didn't match\. \d+ tr(y|ies) left/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /You're in/ })).toHaveCount(0);

  await enterCode(page, code);
  await expect(page.getByRole("heading", { name: "You're in, Alan" })).toBeVisible();
});

test("asking again straight away shows the resend countdown, and so does a fresh page for the same email", async ({ page }) => {
  await reachCodeCard(page);
  // client side: the resend button is locked behind a countdown right after a code went out
  const resend = page.getByRole("button", { name: /^Send a new code in \d+s$/ });
  await expect(resend).toBeDisabled();

  // server side: a new page session for the same email hits the 1-per-60 s cooldown
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "yes", first: "Alan", surname: "Turing", email, team: "Neutral" });
  await submitFastLane(page);
  await expect(page.getByText(/A code went out a moment ago/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Send a new code in \d+s$/ })).toBeDisabled();
});
