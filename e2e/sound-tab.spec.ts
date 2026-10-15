import { expect, test } from "@playwright/test";

// Read-only: loads the sealed ticket with the local dev invite key. Never submits the RSVP form.
const URL = "/?k=local-dev-invite-key";

test("forced-colors hides the world and its chips; the heading and panel carry the page", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(URL);
  await expect(page.getByRole("heading", { name: "You've been called up" })).toBeVisible();
  await expect(page.getByRole("button", { name: /sound/i })).toHaveCount(0);
  await expect(page.getByTestId("world-stage")).toBeHidden();
});

test("390px viewport: the Sound and Still chips sit top right, clear of the panel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(URL);
  const sound = page.getByRole("button", { name: /^sound/i });
  const still = page.getByRole("button", { name: /^still/i });
  await expect(sound).toBeVisible();
  await expect(still).toBeVisible();
  const panel = (await page.getByRole("main").boundingBox())!;
  for (const chip of [sound, still]) {
    const b = (await chip.boundingBox())!;
    expect(b.y).toBeGreaterThanOrEqual(12);
    expect(b.y + b.height).toBeLessThan(panel.y);
    expect(b.x + b.width).toBeLessThanOrEqual(390 - 12 + 0.5);
  }
});
