import { test, expect, type Page } from "@playwright/test";
import { MOBILE, MISSING_KEY_TEXT, openInvite } from "./helpers";
import { EVENT, DATE_LINE } from "../src/matchday/config.js";

test.use(MOBILE);
test.describe.configure({ timeout: 60_000 });

test("the invitation shows the facts from config.js and two equal real buttons", async ({ page }) => {
  await openInvite(page);
  expect(await page.evaluate(() => (window as unknown as { __ready: boolean }).__ready)).toBe(false);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(EVENT.title);
  await expect(page.getByText(DATE_LINE, { exact: true })).toBeVisible();
  const card = page.locator("#inv dl");
  for (const [label, value] of [["Who", EVENT.host], ["What", EVENT.tagline], ["When", EVENT.date], ["Where", EVENT.venue]]) {
    await expect(card.locator("dt", { hasText: label })).toBeVisible();
    await expect(card.locator("dd", { hasText: value })).toBeVisible();
  }
  const group = page.getByRole("group", { name: "Your reply" });
  const play = group.getByRole("button", { name: "Play the match" });
  const reply = group.getByRole("button", { name: "Just reply" });
  const [a, b] = [await play.boundingBox(), await reply.boundingBox()];
  expect(a && b).toBeTruthy();
  expect(Math.abs(a!.width - b!.width)).toBeLessThanOrEqual(1);
  expect(a!.height).toBe(b!.height);
  expect(a!.height).toBeGreaterThanOrEqual(56);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.getElementById("inv")!.scrollWidth <= innerWidth)).toBe(true);
});

test("no game or three request happens before Play; Play then reaches the game", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await openInvite(page);
  await page.waitForLoadState("networkidle");
  const heavy = (u: string) => /game|three|scene|stadium|\/world\/(textures|models|hdr)/i.test(new URL(u).pathname);
  expect(urls.filter(heavy)).toEqual([]);
  await page.getByRole("button", { name: "Play the match" }).click();
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  expect(urls.some((u) => /game/i.test(new URL(u).pathname))).toBe(true);
  await expect(page.locator("#inv")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(await page.evaluate(() => (window as unknown as { __fallback: boolean }).__fallback)).toBe(false);
});

test("Just reply opens the fast-lane form without loading the game", async ({ page }) => {
  await openInvite(page);
  await page.getByRole("button", { name: "Just reply" }).click();
  await expect(page.locator("#fast-form")).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-fallback", "plain");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("a link without its key: Just reply shows the closed message", async ({ page }) => {
  await openInvite(page, null);
  await page.getByRole("button", { name: "Just reply" }).click();
  await expect(page.getByText(MISSING_KEY_TEXT)).toBeVisible();
  await expect(page.locator("#fast-form")).toHaveCount(0);
});

const capsule = (page: Page) => {
  const group = page.getByRole("group", { name: "Your reply" });
  return { play: group.getByRole("button", { name: /Play the match|Opening the gates/ }), reply: group.getByRole("button", { name: "Just reply" }) };
};
const activeId = (page: Page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

test("focus lands on the card heading after Just reply and after a failed load", async ({ page }) => {
  await openInvite(page);
  await page.getByRole("button", { name: "Just reply" }).click();
  await expect(page.locator("#fast-form")).toBeVisible();
  expect(await activeId(page)).toBe("fb-h");
  await page.getByRole("heading", { level: 1 }).waitFor();
  const failed = await page.context().newPage();
  await failed.route(/\/game\.js/, (route) => route.abort());
  await openInvite(failed);
  await failed.getByRole("button", { name: "Play the match" }).click();
  await expect(failed.locator("body")).toHaveAttribute("data-fallback", "load-failed");
  expect(await activeId(failed)).toBe("fb-h");
});

test("pressing Play then Just reply while the game downloads leaves only the form behind", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(/\/matchday\/game\.js/, async (route) => { await gate; await route.continue(); });
  await openInvite(page);
  await page.getByRole("button", { name: "Play the match" }).click();
  await expect(page.getByRole("button", { name: "Opening the gates…" })).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Just reply" }).click();
  await expect(page.locator("#fast-form")).toBeVisible();
  release();
  await page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world, undefined, { timeout: 45_000 });   // game.js has finished its top level
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => [...document.querySelectorAll("#ui > *")].map((e) => e.id))).toEqual(["fb"]);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("#card")).toHaveCount(1);
  expect(await page.evaluate(() => !!document.activeElement?.closest("#fb"))).toBe(true);
});

test("both capsule halves get the same focus ring, size and a real 1px divider", async ({ page }) => {
  await openInvite(page);
  const { play, reply } = capsule(page);
  const edge = (l: typeof play) => l.evaluate((e) => { const s = getComputedStyle(e); return { shadow: s.boxShadow, left: s.borderLeftWidth, outline: s.outlineStyle + s.outlineWidth }; });
  await page.keyboard.press("Tab");
  await expect(play).toBeFocused();
  const ringLeft = await edge(play);
  await page.keyboard.press("Tab");
  await expect(reply).toBeFocused();
  const ringRight = await edge(reply);
  expect(ringRight.shadow).toBe(ringLeft.shadow);
  expect(ringRight.outline).toBe(ringLeft.outline);
  await page.locator("body").click({ position: { x: 1, y: 1 } });   // blur: the divider must not be a shadow, and must be a 1px border
  expect((await edge(reply)).left).toBe("1px");
  expect((await edge(reply)).shadow).toBe("none");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const [a, b] = [await play.boundingBox(), await reply.boundingBox()];
    if (width === 390) { expect(a!.width).toBeCloseTo(b!.width, 1); } else { expect(b!.y).toBeGreaterThan(a!.y); expect(await reply.evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe("1px"); expect(a!.width).toBeCloseTo(b!.width, 1); }
    expect(a!.height).toBeCloseTo(b!.height, 1);
  }
});

test("the start page honours reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openInvite(page);
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--dur-fast"))).toBe("0ms");
  expect(await capsule(page).play.evaluate((e) => getComputedStyle(e).transitionDuration)).toBe("0s");
});

test("the capsule stacks when 200% text wraps a label to three lines, and not at 360 with normal text", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openInvite(page);
  const { play, reply } = capsule(page);
  const [a, b] = [await play.boundingBox(), await reply.boundingBox()];
  expect(b!.x).toBeGreaterThan(a!.x);
  expect(b!.y).toBeCloseTo(a!.y, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {   // 200% text: every type token doubled (the audit's method)
    const root = document.documentElement.style;
    for (const name of [...root]) if (/^--(fs|lh)-/.test(name)) root.setProperty(name, `${parseFloat(root.getPropertyValue(name)) * 2}px`);
  });
  await page.evaluate(() => document.querySelector(".inv-half")!.textContent = "Opening the gates…");   // the longest label
  const [c, d] = [await play.boundingBox(), await reply.boundingBox()];
  expect(d!.y).toBeGreaterThan(c!.y);
  expect(c!.width).toBeCloseTo(d!.width, 1);
  expect(await reply.evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe("1px");
});
