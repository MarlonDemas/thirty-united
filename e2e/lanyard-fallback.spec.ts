import { expect, test } from "@playwright/test";

// Read-only: loads the sealed ticket with the local dev invite key. Never submits the RSVP form.
const URL = "/?k=local-dev-invite-key";

test("a failed 3D chunk steps down silently to the DOM ticket", async ({ page }) => {
  const aborted = page.waitForEvent("requestfailed", (r) => /LanyardTicket/.test(r.url()), { timeout: 15_000 });
  await page.route(/LanyardTicket/, (route) => route.abort());
  await page.goto(URL);
  // The chunk is requested once the view is idle (only with WebGL); let that attempt fail, then check the step-down held.
  const webgl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
  if (webgl) await aborted;
  else aborted.catch(() => {});
  const tear = page.getByRole("button", { name: /tear open/i });
  await expect(tear).toBeVisible();
  await expect(tear).toBeEnabled();
  await expect(page.getByText("Something slipped")).toHaveCount(0);
  await expect(page.locator(".ticket").first()).toBeVisible();
  await tear.click();
  await expect(page.getByRole("heading", { name: "Are you coming?" })).toBeVisible();
});
