import { expect, test } from "@playwright/test";

// Read-only: loads the sealed ticket with the local dev invite key. Never submits the RSVP form.
const URL = "/?k=local-dev-invite-key";

// The lanyard pass lives inside the world canvas (B2), so the world chunk is the 3D layer that can fail.
test("a failed world chunk steps down silently to the DOM ticket", async ({ page }) => {
  const aborted = page.waitForEvent("requestfailed", (r) => /WorldCanvas/.test(r.url()), { timeout: 15_000 });
  await page.route(/WorldCanvas/, (route) => route.abort());
  await page.goto(URL);
  // The chunk is requested on a WebGL tier only; let that attempt fail, then check the step-down held.
  const webgl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
  if (webgl) {
    await aborted;
    await expect(page.getByTestId("world-stage")).toHaveAttribute("data-tier", "T1");
  } else aborted.catch(() => {});
  const tear = page.getByRole("button", { name: /tear open/i });
  await expect(tear).toBeVisible();
  await expect(tear).toBeEnabled();
  await expect(page.getByText("Something slipped")).toHaveCount(0);
  await expect(page.locator(".ticket").first()).toBeVisible();
  await tear.click();
  await expect(page.getByRole("heading", { name: "Are you in?" })).toBeVisible();
});

test("a context lost with the pass up lands on the DOM ticket, and the tear still works", async ({ page }) => {
  await page.goto(URL);
  const webgl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
  test.skip(!webgl, "no WebGL2: the cover is the DOM ticket already");
  const world = page.getByTestId("world-stage");
  // Decide on the settled tier, not on whatever the stage shows straight after load.
  await expect(world).toHaveAttribute("data-tier", /^(T[0-3]|forced-colors)$/);
  test.skip(!/^T[23]$/.test((await world.getAttribute("data-tier")) ?? ""), "not a WebGL tier");
  // The pass is up once its hit box shows.
  await expect(page.getByTestId("lanyard-hit")).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("[data-testid=world-gl] canvas");
    canvas?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(world).toHaveAttribute("data-tier", "T1");
  await expect(page.getByTestId("lanyard-hit")).toHaveCount(0);
  const ticket = page.locator(".pass-zone .ticket").first();
  await expect(ticket).toBeVisible();
  // Not just in the DOM: every box up to the pass zone is opaque again.
  const opacity = () =>
    ticket.evaluate((el) => {
      let o = 1;
      for (let n: Element | null = el; n && !n.classList.contains("pass-zone"); n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
      return o;
    });
  await expect.poll(opacity).toBe(1);
  await page.getByRole("button", { name: /tear open/i }).click();
  await expect(page.getByRole("heading", { name: "Are you in?" })).toBeVisible();
});
