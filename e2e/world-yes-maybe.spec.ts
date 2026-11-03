import { test, expect } from "@playwright/test";
import { fetchCode, resetLimits } from "./mail-code";
import { MOBILE, openWorld, chooseJustReply, fillFastLane, submitFastLane, enterCode, waitForCodeSent, uniqueEmail } from "./helpers";

test.use(MOBILE);
test.describe.configure({ mode: "serial", timeout: 60_000 });

// Specs 1 and 2 share one guest: the second spec asserts the seat is kept.
const email = uniqueEmail("yes");
let seat = "";

test.afterAll(async () => {
  await resetLimits(email);
});

test("new YES via the fast lane is signed with a seat, a poster and a calendar file", async ({ page }) => {
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "yes", first: "Ada", surname: "Lovelace", email, team: "Neutral" });
  await submitFastLane(page);
  await waitForCodeSent(page);
  await enterCode(page, await fetchCode(email));

  await expect(page.getByRole("heading", { name: "You're in, Ada" })).toBeVisible();
  await expect(page.locator("#card p.kicker")).toHaveText(/^signed$/i);
  const seatLine = page.locator("p.seat");
  await expect(seatLine).toHaveText(/^Seat \d{3} · Shirt \d+$/);
  seat = (await seatLine.textContent())!.match(/Seat (\d{3})/)![1];

  // poster: native <dialog> with a rendered image
  await page.getByRole("button", { name: "View your poster" }).click();
  const dialog = page.locator("dialog.poster");
  await expect(dialog).toBeVisible();
  const img = dialog.locator("img.poster-img");
  await expect(img).toHaveAttribute("src", /^data:image\//);
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);

  // calendar: .ics download for the day, Google link present
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Add to calendar" }).click()]);
  expect(download.suggestedFilename()).toBe("thirty-united.ics");
  const stream = await download.createReadStream();
  let ics = "";
  for await (const chunk of stream) ics += chunk.toString();
  expect(ics).toContain("DTSTART;VALUE=DATE:20261221");
  expect(ics).toContain("SUMMARY:Makes turns 30");
  await expect(page.getByRole("link", { name: "Google Calendar" })).toHaveAttribute("href", /calendar\.google\.com/);
});

test("same email answering MAYBE is welcomed back and keeps the same seat", async ({ page }) => {
  test.skip(!seat, "needs the seat from the previous spec");
  await resetLimits(email); // the first spec's code put the email on the 60 s resend cooldown
  const used = await fetchCode(email);
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "maybe", first: "Ada", surname: "Lovelace", email, team: "Neutral" });
  await submitFastLane(page);
  await waitForCodeSent(page);
  await enterCode(page, await fetchCode(email, { exclude: [used] }));

  await expect(page.getByRole("heading", { name: "Welcome back, Ada" })).toBeVisible();
  await expect(page.locator("#card p.kicker")).toHaveText(/^pencilled in$/i);
  await expect(page.locator("p.seat")).toHaveText(new RegExp(`^Seat ${seat} · Shirt `));
});
