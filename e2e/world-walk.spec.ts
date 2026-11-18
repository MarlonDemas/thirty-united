import { test, expect, type Page } from "@playwright/test";
import { fetchCode, resetLimits } from "./mail-code";
import { MOBILE, openWorld, enterCode, waitForCodeSent, uniqueEmail } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 90_000 });

const email = uniqueEmail("walk");
test.afterAll(async () => {
  await resetLimits(email);
});

type FlowState = { stage: string; open: string | null; side: string | null };

// The world runs on a sim clock that the dev server exposes as window.__dbg.flow. We advance that clock instead of
// steering the avatar or waiting in real time: every step still runs the real code path (arrival, card, skip button).
const flowState = (page: Page) => page.evaluate(() => (window as unknown as { __dbg: { flow: { state(): FlowState } } }).__dbg.flow.state());
async function advanceUntil(page: Page, what: string, ready: (s: FlowState) => boolean) {
  await expect
    .poll(
      async () => {
        await page.evaluate(() => (window as unknown as { __dbg: { flow: { skip(s: number): void } } }).__dbg.flow.skip(1));
        return ready(await flowState(page));
      },
      { message: what, intervals: [50], timeout: 30_000 },
    )
    .toBe(true);
}
const teleport = (page: Page, station: number) =>
  page.evaluate((k) => (window as unknown as { __dbg: { flow: { teleport(k: number): void } } }).__dbg.flow.teleport(k), station);

test("walk the HOME END, answer each station through its skip button, and sign with the emailed code", async ({ page }) => {
  await openWorld(page);
  const card = page.locator("#card");

  // intro -> HOME END kiosk (station 1: names), then skip the ticket challenge
  await page.getByRole("button", { name: /HOME END/ }).click();
  await advanceUntil(page, "station 1 card opens at the HOME END kiosk", (s) => s.open === "1:home");
  await card.getByLabel("First name").fill("Katherine");
  await card.getByLabel("Surname").fill("Johnson");
  await card.getByRole("button", { name: "Skip the ticket" }).click();
  await advanceUntil(page, "gate and walk-out finish, roaming on the pitch", (s) => s.stage === "roam" && s.side === "home");

  // station 2: email + sport + team
  await teleport(page, 2);
  await advanceUntil(page, "station 2 card opens", (s) => s.open === "2");
  await card.getByLabel("Email", { exact: true }).fill(email);
  await card.getByRole("radio", { name: "Football", exact: true }).click();
  await card.getByLabel("Your team").fill("Neutral");
  await card.getByRole("button", { name: "Skip the dribble" }).click();
  await advanceUntil(page, "station 2 done", (s) => s.stage === "roam" && s.open === null);

  // station 3: how to reach you (email is the default channel)
  await teleport(page, 3);
  await advanceUntil(page, "station 3 card opens", (s) => s.open === "3");
  await card.getByRole("button", { name: "Skip the header" }).click();
  await advanceUntil(page, "station 3 done", (s) => s.stage === "roam" && s.open === null);

  // station 4: plus one (just me is the default); the last station leads to full time and the code card
  await teleport(page, 4);
  await advanceUntil(page, "station 4 card opens", (s) => s.open === "4");
  await card.getByRole("button", { name: "Skip the kick" }).click();
  await advanceUntil(page, "full time reaches the code card", (s) => s.stage === "code");

  await expect(card.locator("p.kicker")).toHaveText("VAR check");
  await waitForCodeSent(page);
  await enterCode(page, await fetchCode(email));
  await expect(card.getByRole("heading", { name: "You're in, Katherine" })).toBeVisible();
  await expect(card.locator("p.seat")).toHaveText(/^Seat \d{3} · Shirt \d+$/);
});
