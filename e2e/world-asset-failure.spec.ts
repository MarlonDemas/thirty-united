import { test, expect } from "@playwright/test";
import { MOBILE, worldUrl } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 60_000 });

test("a texture that fails to load drops to the fast-lane page instead of hanging on the loading screen", async ({ page }) => {
  let aborted = 0;
  await page.route("**/world/textures/**", (route) => {
    // Abort only the first texture request: one dead file is enough to have hung the load before.
    if (aborted++ === 0) return route.abort("failed");
    return route.continue();
  });
  await page.goto(worldUrl());
  // The load fails fast (the request is aborted), so the fallback must come well before the 20 s overall load timeout.
  await expect(page.locator("body")).toHaveAttribute("data-fallback", "load-failed", { timeout: 10_000 });
  expect(await page.evaluate(() => (window as unknown as { __ready: boolean }).__ready)).toBe(true);
  await expect(page.locator("#fast-form")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("#boot")).toHaveCount(0);
});
