import { test, expect } from "@playwright/test";
import { MOBILE, openWorld, chooseJustReply, fillFastLane, submitFastLane, uniqueEmail } from "./helpers";

test.use(MOBILE);
test.describe.configure({ timeout: 60_000 });

for (const c of [
  { name: "team", answers: { surname: "Lovelace", team: "" }, message: "Add your team. Neutral is fine." },
  { name: "surname", answers: { surname: "", team: "Neutral" }, message: "Add your surname." },
]) {
  test(`YES without ${c.name} shows the inline message and calls no backend`, async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (r) => {
      if (/\/api\/(action|mutation|query)/.test(r.url())) calls.push(r.url());
    });
    await openWorld(page);
    await chooseJustReply(page);
    await fillFastLane(page, { attending: "yes", first: "Ada", email: uniqueEmail("val"), ...c.answers });
    await submitFastLane(page);

    await expect(page.locator("#fast-form").getByText(c.message)).toBeVisible();
    // still on the form: no code card, nothing sent
    await expect(page.getByLabel("Your code")).toHaveCount(0);
    await expect(page.locator("#fast-form")).toBeVisible();
    expect(calls).toEqual([]);
  });
}
