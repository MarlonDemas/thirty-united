import { test, expect } from "@playwright/test";
import { fetchCode, resetLimits } from "./mail-code";
import { MOBILE, openWorld, fillFastLane, submitFastLane, enterCode, waitForCodeSent, uniqueEmail } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 60_000 });

const email = uniqueEmail("fb");
test.afterAll(async () => {
  await resetLimits(email);
});

test("with WebGL blocked the plain fallback page completes a YES end to end", async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof orig;
  });
  await openWorld(page);
  expect(await page.evaluate(() => (window as unknown as { __fallback: boolean }).__fallback)).toBe(true);
  await expect(page.locator("body")).toHaveAttribute("data-fallback", "no-webgl");
  await expect(page.locator("canvas")).toHaveCount(0);

  await fillFastLane(page, { attending: "yes", first: "Edith", surname: "Clarke", email, team: "Neutral" });
  await submitFastLane(page);
  await waitForCodeSent(page);
  await enterCode(page, await fetchCode(email));

  await expect(page.getByRole("heading", { name: "You're in, Edith" })).toBeVisible();
  await expect(page.locator("p.seat")).toHaveText(/^Seat \d{3} · Shirt \d+$/);
});
