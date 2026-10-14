import { expect, test, type Page } from "@playwright/test";
import { fetchCode, resetLimits } from "./mail-code";

// Needs the local stack running: `npx convex dev` (local deployment with MAIL_PROVIDER=mock and
// MAIL_ALLOW_MOCK=true) and `pnpm vite` (Playwright starts it if it is not already up).
// Run with `pnpm test:e2e`. Deliberately not part of `pnpm test`.

test.describe.configure({ mode: "serial" });

const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

/** Tears the sealed ticket. Retries the click so a Vite dev-server reload on a cold start can't swallow it. */
async function tearOpen(page: Page) {
  const heading = page.getByRole("heading", { name: "Are you coming?" });
  await expect(async () => {
    if (!(await heading.isVisible())) await page.getByRole("button", { name: /tear open/i }).click({ timeout: 1000 });
    await expect(heading).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
}

async function openAttendance(page: Page) {
  // Requires INVITE_KEY=local-dev-invite-key on the local Convex deployment (npx convex env set INVITE_KEY local-dev-invite-key); otherwise requestCode returns invalid_link and the specs time out.
  await page.goto("/?k=local-dev-invite-key");
  await tearOpen(page);
}

async function chooseAndContinue(page: Page, answer: "Yes" | "Maybe" | "No") {
  await page.getByRole("radio", { name: answer, exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

async function fillDetails(page: Page, email: string) {
  await page.getByLabel("First name").fill("Ada");
  await page.getByLabel("Surname").fill("Lovelace");
  await page.getByRole("radio", { name: "Football", exact: true }).click();
  await page.getByLabel("Football team").fill("Arsenal");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("radio", { name: "Email", exact: true }).click();
  await page.getByRole("button", { name: "Send my code" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
}

async function enterCode(page: Page, code: string) {
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "Confirm code" }).click();
}

async function seatOnStub(page: Page): Promise<string> {
  const seat = page.locator("dt", { hasText: "SEAT" }).locator("xpath=following-sibling::dd[1]");
  await expect(seat).toHaveText(/^\d{3}$/);
  return (await seat.textContent())!.trim();
}

test("happy path: Yes -> code -> stub with a seat number", async ({ page }) => {
  const email = unique();
  await openAttendance(page);
  expect(page.url()).toContain("k=");
  await chooseAndContinue(page, "Yes");
  await fillDetails(page, email);

  await enterCode(page, await fetchCode(email));

  await expect(page.getByRole("heading", { name: "You're on the list" })).toBeVisible();
  await seatOnStub(page);
  await expect(page.getByTestId("guest-name")).toHaveText("Ada Lovelace");
  await expect(page.getByTestId("team")).toHaveText("ARSENAL");
});

test("update path: same email re-RSVPs as Maybe and keeps the same seat", async ({ page }) => {
  const email = unique();
  await openAttendance(page);
  await chooseAndContinue(page, "Yes");
  await fillDetails(page, email);
  const firstCode = await fetchCode(email);
  await enterCode(page, firstCode);
  await expect(page.getByRole("heading", { name: "You're on the list" })).toBeVisible();
  const seat = await seatOnStub(page);

  // Skip the 60 s resend cooldown with the existing host-only admin mutation.
  await resetLimits(email);

  await openAttendance(page);
  await chooseAndContinue(page, "Maybe");
  await fillDetails(page, email);
  await enterCode(page, await fetchCode(email, { exclude: [firstCode] }));

  await expect(page.getByRole("heading", { name: "Your answer is updated" })).toBeVisible();
  expect(await seatOnStub(page)).toBe(seat);
  await expect(page.locator("dt", { hasText: "REPLY" }).locator("xpath=following-sibling::dd[1]")).toHaveText("MAYBE");
});

test("no invite key: the sealed ticket shows the missing-key line and no Tear open", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Thirty United" })).toBeVisible();
  await expect(page.getByText("This link is missing its invite key. Ask Makes to send you the full link.")).toBeVisible();
  await expect(page.getByRole("button", { name: /tear open/i })).toHaveCount(0);
});
