import { test, expect } from "@playwright/test";
import { MOBILE, MISSING_KEY_TEXT, openWorld, chooseJustReply, fillFastLane, submitFastLane, uniqueEmail } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 60_000 });

test("missing ?k= shows a closed intro with no way to reply", async ({ page }) => {
  await openWorld(page, null);
  const card = page.locator("#card");
  await expect(card.getByRole("heading", { name: "You've been called up" })).toBeVisible();
  await expect(card.getByText(MISSING_KEY_TEXT)).toBeVisible();
  await expect(page.getByRole("button", { name: /JUST REPLY/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /HOME END/ })).toHaveCount(0);
});

test("wrong ?k= is refused by the server and the page closes with the invite-link message", async ({ page }) => {
  await openWorld(page, "not-the-invite-key");
  // the key is only checked server-side, so the intro is open until the code request
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "yes", email: uniqueEmail("badkey"), team: "Neutral" });
  const requestCode = page.waitForResponse((r) => r.url().includes("/api/action") && r.request().method() === "POST");
  await submitFastLane(page);
  await requestCode;

  const card = page.locator("#card");
  await expect(card.getByText(MISSING_KEY_TEXT)).toBeVisible();
  await expect(card.locator("p.kicker")).not.toHaveText("VAR check");
  await expect(page.getByLabel("Your code")).toHaveCount(0);
});
