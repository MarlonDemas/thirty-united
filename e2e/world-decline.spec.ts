import { test, expect, type Page } from "@playwright/test";
import { deleteDecline, fetchCode, getDecline, resetDeclineLimits, resetLimits } from "./mail-code";
import { MOBILE, openWorld, chooseJustReply, fillFastLane, submitFastLane, enterCode, waitForCodeSent, uniqueEmail, uniqueSurname } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 90_000 });

// Every test gets its own letters-only surname. afterEach erases the row and that name's per-name bucket, and resets the
// global daily bucket, so repeated runs never hit 2/name/24h, 50/day or the 200-row cap.
const created: { firstName: string; surname: string }[] = [];
const emails: string[] = [];
function guest(firstName: string) {
  const g = { firstName, surname: uniqueSurname() };
  created.push(g);
  return g;
}
test.afterEach(async () => {
  for (const g of created.splice(0)) await deleteDecline(g);
  for (const e of emails.splice(0)) await resetLimits(e);
  await resetDeclineLimits();
});

const SUBMIT = "declines:submitDecline";
const NAME_ONLY_NOTICE = "uses your first name, surname and, if you give one, a short reason only to manage RSVPs for this event.";

/** Counts POST /api/action calls that name `declines:submitDecline`. */
function countDeclineCalls(page: Page) {
  let n = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && /\/api\/action/.test(r.url()) && (r.postData() ?? "").includes(SUBMIT)) n += 1;
  });
  return () => n;
}

/** Asserts the name-only confirmation: no seat, poster or calendar. */
async function expectDeclineConfirmation(page: Page, first: string) {
  const card = page.locator("#card");
  await expect(card.getByRole("heading", { name: `Noted, ${first}` })).toBeVisible();
  await expect(card.locator("p.kicker")).toHaveText(/^reply saved$/i);
  await expect(card.getByText("You'll be missed. If plans change, open your invite link again.")).toBeVisible();
  await expectNoKeepsake(page);
}
async function expectNoKeepsake(page: Page) {
  const card = page.locator("#card");
  await expect(card.locator("p.seat")).toHaveCount(0);
  await expect(card.getByText(/Seat \d{3}/)).toHaveCount(0);
  await expect(card.getByRole("button", { name: "View your poster" })).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Add to calendar" })).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Google Calendar" })).toHaveCount(0);
}

type FlowDbg = { __dbg: { flow: { state(): { stage: string; open: string | null; lights: number; crowd: { hush: number }; squad: { drooped: boolean }; avatar: { pose: string | null; kit: string }; }; skip(s: number): void; goto(w: string): unknown } } };
const flowState = (page: Page) => page.evaluate(() => (window as unknown as FlowDbg).__dbg.flow.state());

/** Same sim-clock stepping as world-walk.spec.ts: never real-time sleeps. */
async function advanceUntil(page: Page, what: string, ready: (s: Awaited<ReturnType<typeof flowState>>) => boolean) {
  await expect
    .poll(
      async () => {
        await page.evaluate(() => (window as unknown as FlowDbg).__dbg.flow.skip(1));
        return ready(await flowState(page));
      },
      { message: what, intervals: [50], timeout: 30_000 },
    )
    .toBe(true);
}

test("fast lane, replied before = No: name-only notice, no email, saved row, no seat/poster/calendar", async ({ page }) => {
  const g = guest("Grace");
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "no", repliedBefore: "no", first: g.firstName, surname: g.surname, reason: "Away that weekend" });

  const form = page.locator("#fast-form");
  await expect(form.getByText(NAME_ONLY_NOTICE)).toBeVisible();
  await expect(form.getByLabel("Email", { exact: true })).toBeHidden(); // hidden fields stay in the DOM
  await submitFastLane(page);

  await expectDeclineConfirmation(page, "Grace");
  await expect(page.getByLabel("Your code")).toHaveCount(0);
  const row = await getDecline(g);
  expect(row).toMatchObject({ firstName: "Grace", surname: g.surname, reason: "Away that weekend" });
});

test("fast lane, replied before = Yes: email + code then Noted, with no seat, poster or calendar", async ({ page }) => {
  const email = uniqueEmail("away");
  emails.push(email);
  const g = guest("Grace"); // never saved on this path; the cleanup is a harmless no-op
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "no", repliedBefore: "yes", first: g.firstName, surname: g.surname, email });
  await submitFastLane(page);
  await waitForCodeSent(page);
  await enterCode(page, await fetchCode(email));

  const card = page.locator("#card");
  await expect(card.getByRole("heading", { name: "Noted, Grace" })).toBeVisible();
  await expect(card.locator("p.kicker")).toHaveText(/^reply saved$/i);
  await expect(card.getByText("You are down as not coming. Use the same email to change your answer.")).toBeVisible();
  await expectNoKeepsake(page);
  expect(await getDecline(g)).toBeNull(); // the email path writes to guests, never to declines
});

test("AWAY END kiosk, name-only: losing-out ending, then the decline confirmation", async ({ page }) => {
  const g = guest("Hedy");
  await openWorld(page);
  const card = page.locator("#card");
  await page.getByRole("button", { name: /AWAY END/ }).click();
  await advanceUntil(page, "station 1 card opens at the AWAY END kiosk", (s) => s.open === "1:away");

  await card.getByRole("radiogroup", { name: "Have you replied before?" }).getByRole("radio", { name: "No, first time", exact: true }).click();
  await expect(card.getByLabel("Email", { exact: true })).toBeHidden(); // hidden fields stay in the DOM
  await card.getByLabel("First name").fill(g.firstName);
  await card.getByLabel("Surname").fill(g.surname);
  await card.getByLabel("Reason (optional)").fill("Travelling");
  await card.getByRole("button", { name: "Skip the ticket" }).click();

  // the dev hooks expose the stage, the light level and the avatar pose of the ending
  // read the ending in the same poll that first sees it, before any further skip, so a skipped tween can't pass for a played one
  let ending: Awaited<ReturnType<typeof flowState>> | null = null;
  await advanceUntil(page, "the losing-out ending (awayEnd) starts", (s) => {
    if (s.stage === "awayEnd") ending = s;
    return s.stage === "awayEnd";
  });
  expect(ending!.avatar.pose).toBe("dejected");
  expect(ending!.avatar.kit).toBe("away"); // the guest changed into the away strip at the AWAY END kiosk
  expect(ending!.squad.drooped).toBe(true);
  expect(ending!.lights).toBeGreaterThan(0.45 + 1e-6); // the dim is still to play
  await advanceUntil(page, "the lights have dimmed to 0.45", (s) => s.lights <= 0.45 + 1e-6);
  expect((await flowState(page)).crowd.hush).toBeGreaterThan(0.5);

  await advanceUntil(page, "the decline card replaces the ending", (s) => s.stage === "code");
  await expectDeclineConfirmation(page, g.firstName);
  expect(await getDecline(g)).toMatchObject({ firstName: g.firstName, surname: g.surname, reason: "Travelling" });

  // a replay (goto resets the flow) puts the guest back in the home kit
  await page.evaluate(() => (window as unknown as FlowDbg).__dbg.flow.goto("gates"));
  expect((await flowState(page)).avatar.kit).toBe("home");
});

test("replay after reset has no hush: crowd and squad are back to normal", async ({ page }) => {
  await openWorld(page);
  await page.getByRole("button", { name: /AWAY END/ }).click();
  await advanceUntil(page, "station 1 card opens at the AWAY END kiosk", (s) => s.open === "1:away");
  const card = page.locator("#card");
  await card.getByRole("radiogroup", { name: "Have you replied before?" }).getByRole("radio", { name: "No, first time", exact: true }).click();
  await card.getByLabel("First name").fill("Hedy");
  await card.getByLabel("Surname").fill("Lamarr");
  await card.getByRole("button", { name: "Skip the ticket" }).click();
  await advanceUntil(page, "the ending hushes the stands", (s) => s.stage === "awayEnd" && s.crowd.hush > 0.5);
  expect((await flowState(page)).squad.drooped).toBe(true);

  await page.evaluate(() => (window as unknown as FlowDbg).__dbg.flow.goto("gates")); // a clean reset
  const after = await flowState(page); // no sim step in between
  expect(after.crowd.hush).toBe(0);
  expect(after.squad.drooped).toBe(false);
  expect(after.lights).toBe(1);
  expect(after.avatar.pose).not.toBe("dejected");
});

test("a reason with a link shows an inline message and calls submitDecline zero times", async ({ page }) => {
  const g = guest("Ada");
  const calls = countDeclineCalls(page);
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "no", repliedBefore: "no", first: g.firstName, surname: g.surname, reason: "see https://example.com" });
  await submitFastLane(page);

  await expect(page.locator("#fast-form").getByText("Please leave links out.")).toBeVisible();
  await expect(page.locator("#fast-form")).toBeVisible();
  expect(calls()).toBe(0);
  expect(await getDecline(g)).toBeNull();
});

test("decline failures show plain lines and Try again retries", async ({ page }) => {
  const g = guest("Mary");
  // Mocked on purpose: the real rate limits (50/day global, 200 rows) can't be triggered safely against a shared backend.
  const replies = [{ status: "rate_limited" }, { status: "service_unavailable" }, { status: "saved" }];
  let calls = 0;
  await page.route("**/api/action", async (route) => {
    if (!(route.request().postData() ?? "").includes(SUBMIT)) return route.continue();
    const value = replies[Math.min(calls, replies.length - 1)];
    calls += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", value, logLines: [] }) });
  });
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "no", repliedBefore: "no", first: g.firstName, surname: g.surname });
  await submitFastLane(page);

  const card = page.locator("#card");
  await expect(card.getByText("A lot of replies are coming in right now. Please try again in a little while.")).toBeVisible();
  await card.getByRole("button", { name: "Try again" }).click();
  await expect(card.getByText("Replying with just your name isn't open right now. Choose Check my answers, pick Yes, use my email, and I'll send you a code instead.")).toBeVisible();
  await expect(card.getByRole("button", { name: "Check my answers" })).toBeVisible();
  await card.getByRole("button", { name: "Try again" }).click();
  await expectDeclineConfirmation(page, "Mary");
  expect(calls).toBe(3);
});

test("kill switch: Check my answers, answer Yes, and the Email field is the way out", async ({ page }) => {
  const g = guest("Mary");
  await page.route("**/api/action", async (route) => {
    if (!(route.request().postData() ?? "").includes(SUBMIT)) return route.continue();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", value: { status: "service_unavailable" }, logLines: [] }) });
  });
  await openWorld(page);
  await chooseJustReply(page);
  await fillFastLane(page, { attending: "no", repliedBefore: "no", first: g.firstName, surname: g.surname });
  await submitFastLane(page);

  const card = page.locator("#card");
  await expect(card.getByText("Replying with just your name isn't open right now. Choose Check my answers, pick Yes, use my email, and I'll send you a code instead.")).toBeVisible();
  await card.getByRole("button", { name: "Check my answers" }).click();
  const form = page.locator("#fast-form");
  await form.getByRole("radiogroup", { name: "Have you replied before?" }).getByRole("radio", { name: "Yes, use my email", exact: true }).click();
  await expect(form.getByLabel("Email", { exact: true })).toBeVisible();
});

test("fallback page (WebGL blocked): a name-only decline completes", async ({ page }) => {
  const g = guest("Edith");
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof orig;
  });
  await openWorld(page);
  await expect(page.locator("body")).toHaveAttribute("data-fallback", "no-webgl");

  await fillFastLane(page, { attending: "no", repliedBefore: "no", first: g.firstName, surname: g.surname });
  await expect(page.locator("#fast-form").getByText(NAME_ONLY_NOTICE)).toBeVisible();
  await submitFastLane(page);

  await expect(page.getByRole("heading", { name: "Noted, Edith" })).toBeVisible();
  await expect(page.getByText("You'll be missed. If plans change, open your invite link again.")).toBeVisible();
  await expect(page.locator("p.seat")).toHaveCount(0);
  expect(await getDecline(g)).toMatchObject({ firstName: "Edith", surname: g.surname });
});
