import { expect, test } from "@playwright/test";

// Read-only: loads the sealed ticket with the local dev invite key. Never submits the RSVP form.
const URL = "/?k=local-dev-invite-key";

test("forced-colors hides the Sound tab (CSS .stage-tab rule)", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(URL);
  await expect(page.getByRole("heading", { name: "Thirty United" })).toBeVisible();
  await expect(page.getByRole("button", { name: /sound/i })).toHaveCount(0);
});

test("390px viewport: the Sound tab does not overlap the ticket", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(URL);
  const tab = page.getByRole("button", { name: /sound/i });
  await expect(tab).toBeVisible();
  const ticket = page.locator(".ticket").first();
  await expect(ticket).toBeAttached();
  // The tab moves when the lazy 3D stage takes over (DOM ticket fades out, canvas mounts). Measure after that
  // hand-off; without WebGL the stage never mounts and the DOM layout is final.
  const webgl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
  if (webgl) {
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
    await expect(ticket.locator("xpath=..")).toHaveCSS("opacity", "0");
  }
  const a = (await tab.boundingBox())!;
  const b = (await ticket.boundingBox())!;
  const overlap = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  expect(overlap, `tab ${JSON.stringify(a)} vs ticket ${JSON.stringify(b)}`).toBe(false);
});
