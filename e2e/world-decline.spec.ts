import { test, expect } from "@playwright/test";
import { fetchCode, resetLimits } from "./mail-code";
import { MOBILE, openWorld, chooseJustReply, fillFastLane, submitFastLane, enterCode, waitForCodeSent, uniqueEmail } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 60_000 });

const email = uniqueEmail("away");
test.afterAll(async () => {
  await resetLimits(email);
});

test("new AWAY (decline) is noted with no seat, poster or calendar", async ({ page }) => {
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "no", first: "Grace", surname: "Hopper", email });
  await submitFastLane(page);
  await waitForCodeSent(page);
  await enterCode(page, await fetchCode(email));

  const card = page.locator("#card");
  await expect(card.getByRole("heading", { name: "Noted, Grace" })).toBeVisible();
  await expect(card.locator("p.kicker")).toHaveText(/^reply saved$/i);
  await expect(card.locator("p.seat")).toHaveCount(0);
  await expect(card.getByText(/Seat \d{3}/)).toHaveCount(0);
  await expect(card.getByRole("button", { name: "View your poster" })).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Add to calendar" })).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Google Calendar" })).toHaveCount(0);
});
