import { expect, type Page } from "@playwright/test";

/** Invite key the local Convex deployment is configured with (`npx convex env set INVITE_KEY ...`). Never a production key. */
export const INVITE_KEY = process.env.E2E_INVITE_KEY ?? "e2e-local-invite-key";

/** Same GPU flags as scripts/capture.mjs: on macOS they put WebGL on Metal (software GL renders the world at ~1 fps and starves clicks); elsewhere Chromium falls back to SwiftShader. */
export const GL_ARGS = ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"];

export const MOBILE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, launchOptions: { args: GL_ARGS } } as const;

export const MISSING_KEY_TEXT = "This link is missing its invite key. Ask Makes to send you the full link.";

let counter = 0;
/** A fresh, valid address per call: unique across runs (timestamp), workers (pid) and tests (counter). */
export function uniqueEmail(tag = "t"): string {
  counter += 1;
  return `e2e+${Date.now()}-${process.pid}-${counter}-${tag}@example.com`;
}

let nameCounter = 0;
/** A fresh surname per call, letters only (decline names reject digits): the digits of timestamp + pid + counter mapped to a-j. Unique per test, so the 2-per-name-per-day limit never bites. */
export function uniqueSurname(): string {
  nameCounter += 1;
  const letters = `${Date.now()}${process.pid}${nameCounter}`.replace(/\d/g, (d) => "abcdefghij"[Number(d)]);
  return `Zz${letters}`;
}

export const worldUrl = (key: string | null = INVITE_KEY) => (key === null ? "/" : `/?k=${encodeURIComponent(key)}`);

/** Opens the world and waits for the world contract's `__ready` flag (game or fallback page). */
export async function openWorld(page: Page, key: string | null = INVITE_KEY) {
  await page.goto(worldUrl(key));
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
}

export type Answers = {
  attending?: "yes" | "maybe" | "no";
  first?: string;
  surname?: string;
  /** Required except for a name-only decline (`attending: "no", repliedBefore: "no"`), which has no email field. */
  email?: string;
  /** Only for `attending: "no"`: the "Have you replied before?" answer. Defaults to "yes" (the email + code path). */
  repliedBefore?: "yes" | "no";
  /** Only for a name-only decline. */
  reason?: string;
  team?: string;
  preferred?: string;
  sport?: "football" | "other";
};

/** Fills the fast-lane form (the same markup in the game's "JUST REPLY" card and in the no-WebGL page). Does not submit. */
export async function fillFastLane(page: Page, a: Answers) {
  const form = page.locator("#fast-form");
  await expect(form).toBeVisible();
  const label = { yes: "Yes", maybe: "Not sure yet", no: "Can't make it" }[a.attending ?? "yes"];
  await form.getByRole("radiogroup", { name: "Can you make it?" }).getByRole("radio", { name: label, exact: true }).click();
  await form.getByLabel("First name").fill(a.first ?? "Ada");
  if (a.surname !== undefined || a.attending !== undefined) await form.getByLabel("Surname").fill(a.surname ?? "Lovelace");
  if (a.attending === "no") {
    // The fast lane has two radiogroups with a "Yes" button: scope by the group's accessible name.
    const replied = form.getByRole("radiogroup", { name: "Have you replied before?" });
    const nameOnly = a.repliedBefore === "no";
    await replied.getByRole("radio", { name: nameOnly ? "No, first time" : "Yes, use my email", exact: true }).click();
    if (nameOnly) {
      await expect(form.getByLabel("Email", { exact: true })).toBeHidden(); // hidden fields stay in the DOM
      if (a.reason !== undefined) await form.getByLabel("Reason (optional)").fill(a.reason);
      return;
    }
  }
  if (a.email === undefined) throw new Error("fillFastLane: email is required unless this is a name-only decline");
  await form.getByLabel("Email", { exact: true }).fill(a.email);
  if (a.attending === "no") return;
  if (a.preferred) await form.getByLabel("Name on your shirt (optional)").fill(a.preferred);
  await form.getByRole("radio", { name: a.sport === "other" ? "Another sport" : "Football", exact: true }).click();
  if (a.team !== undefined) await form.getByLabel("Your team").fill(a.team);
}

export async function submitFastLane(page: Page) {
  await page.locator("#fast-form").getByRole("button", { name: "Continue" }).click();
}

/** On the game's intro card: take the centred "JUST REPLY" fast lane. */
export async function chooseJustReply(page: Page) {
  await page.getByRole("button", { name: /JUST REPLY/ }).click();
}

/** The code card ("VAR check"): enters `code` and presses Confirm. */
export async function enterCode(page: Page, code: string) {
  await page.getByLabel("Your code").fill(code);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
}

/** Waits until the code card says the code went out (so a mock-mail line exists). */
export async function waitForCodeSent(page: Page) {
  await expect(page.getByText(/^Code sent to /)).toBeVisible();
}

/** Counts Convex action calls the page makes (requestCode / verifyAndSave) via the HTTP client's POST /api/action. */
export function countConvexCalls(page: Page): { count: () => number } {
  let n = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && /\/api\/(action|mutation|query)/.test(r.url())) n += 1;
  });
  return { count: () => n };
}
