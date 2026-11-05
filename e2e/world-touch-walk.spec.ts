import { test, expect, type Page, type CDPSession } from "@playwright/test";
import { MOBILE, openWorld } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 90_000 });

type Dbg = { __dbg: { flow: { state(): { stage: string; open: string | null; roam: { x: number; z: number; yaw: number } }; teleport(k: string): void } } };
const state = (page: Page) => page.evaluate(() => (window as unknown as Dbg).__dbg.flow.state());

// Real touch events through CDP: the browser turns them into pointer events with pointerType "touch", as a phone does.
const touch = (cdp: CDPSession, type: "touchStart" | "touchMove" | "touchEnd", x?: number, y?: number) =>
  cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: x!, y: y!, id: 1 }] });

test("a left-thumb joystick walks the guest from the start to station 1's card", async ({ page }) => {
  await openWorld(page);
  const cdp = await page.context().newCDPSession(page);
  const start = (await state(page)).roam;
  const goal = [-2.35, 112.5]; // the HOME END kiosk, where its card opens
  const ORIGIN = [70, 240]; // left half, above the intro card
  const R = 40; // px of push: a brisk walk

  await expect
    .poll(
      async () => {
        const s = await state(page);
        if (s.open) return s.open;
        // like a guest: put the thumb down, push towards the kiosk as it looks on screen, walk a moment, lift, look again
        const dx = goal[0] - s.roam.x;
        const dz = goal[1] - s.roam.z;
        const d = Math.hypot(dx, dz);
        const fwd = (-dx * Math.sin(s.roam.yaw) - dz * Math.cos(s.roam.yaw)) / d; // forward = (-sin yaw, -cos yaw)
        const right = (dx * Math.cos(s.roam.yaw) - dz * Math.sin(s.roam.yaw)) / d; // right = (cos yaw, -sin yaw)
        await touch(cdp, "touchStart", ORIGIN[0], ORIGIN[1]);
        await touch(cdp, "touchMove", ORIGIN[0] + right * R, ORIGIN[1] - fwd * R);
        await page.waitForTimeout(400);
        await touch(cdp, "touchEnd");
        return null;
      },
      { message: "station 1 card opens", intervals: [20], timeout: 70_000 },
    )
    .toMatch(/^1:/);

  const end = await state(page);
  expect(Math.hypot(end.roam.x - start.x, end.roam.z - start.z)).toBeGreaterThan(15);
  expect(end.stage).toBe("roam");
  await expect(page.locator("#card")).toBeVisible();
});

test("dragging on the right side looks around without moving the guest", async ({ page }) => {
  await openWorld(page);
  await page.getByRole("button", { name: /HOME END/ }).click();
  await page.evaluate(() => (window as unknown as Dbg).__dbg.flow.teleport("start"));
  const cdp = await page.context().newCDPSession(page);
  const before = (await state(page)).roam;
  await touch(cdp, "touchStart", 300, 420);
  for (let i = 1; i <= 8; i++) await touch(cdp, "touchMove", 300 + i * 6, 420);
  await page.waitForTimeout(500);
  await touch(cdp, "touchEnd");
  const after = (await state(page)).roam;
  expect(Math.abs(after.yaw - before.yaw)).toBeGreaterThan(0.05);
  expect(after.x).toBeCloseTo(before.x, 2);
  expect(after.z).toBeCloseTo(before.z, 2);
});

test("a tap with a thumb wobble, and a tap above the horizon, still walk there", async ({ page }) => {
  await openWorld(page);
  await page.getByRole("button", { name: /HOME END/ }).click();
  const cdp = await page.context().newCDPSession(page);
  for (const [x, y, wobble] of [[300, 520, 7], [100, 520, 7], [195, 250, 0]]) {
    await page.evaluate(() => (window as unknown as Dbg).__dbg.flow.teleport("start"));
    const before = (await state(page)).roam;
    await touch(cdp, "touchStart", x, y);
    if (wobble) await touch(cdp, "touchMove", x + wobble, y + wobble);
    await touch(cdp, "touchEnd");
    await expect.poll(async () => Math.hypot((await state(page)).roam.x - before.x, (await state(page)).roam.z - before.z), { intervals: [100], timeout: 5000 }).toBeGreaterThan(1);
  }
});
