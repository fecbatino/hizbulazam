import { test, expect } from "@playwright/test";

// A second hash change after the app handled the first one but before it
// rendered: the day hash written for the first must not overwrite the second.
test("rapid hash changes keep the last link", async ({ page }) => {
  await page.goto("/#/day/friday");
  await expect(page.locator("[data-dua-id]").first()).toBeVisible();
  const id = (await page.locator("[data-dua-id]").nth(2).getAttribute("data-dua-id"))!;
  for (let i = 0; i < 10; i++) {
    await page.evaluate((target) => {
      // The app's listener has already stored the Monday link when this one
      // runs; React has not rendered it yet.
      addEventListener(
        "hashchange",
        () => (location.hash = "#/dua/" + encodeURIComponent(target)),
        { once: true },
      );
      location.hash = "#/day/monday";
    }, id);
    await expect(page).toHaveURL(new RegExp("#/dua/" + id + "$"));
    await expect(page.locator(".day-title")).toContainText("Freitag");
    await expect(page.locator("#dua-" + id)).toBeVisible();
    // Back on a plain day for the next round.
    await page.evaluate(() => (location.hash = "#/day/sunday"));
    await expect(page.locator(".day-title")).toContainText("Sonntag");
  }
});

// The other order: the address already holds the new link, but its hashchange
// has not been handled when the app writes the previous day.
test("a link opened while the previous day is still rendering survives", async ({
  page,
}) => {
  await page.goto("/#/day/friday");
  await expect(page.locator("[data-dua-id]").first()).toBeVisible();
  const id = (await page.locator("[data-dua-id]").nth(2).getAttribute("data-dua-id"))!;
  for (let i = 0; i < 8; i++) {
    await page.goto("/#/day/monday");
    await page.goto("/#/dua/" + encodeURIComponent(id));
    await expect(page).toHaveURL(new RegExp("#/dua/" + id + "$"));
    await expect(page.locator(".day-title")).toContainText("Freitag");
    await page.goto("/#/day/sunday");
    await expect(page.locator(".day-title")).toContainText("Sonntag");
  }
});

test("a day link right after a dua link wins as well", async ({ page }) => {
  await page.goto("/#/day/friday");
  await expect(page.locator("[data-dua-id]").first()).toBeVisible();
  const id = (await page.locator("[data-dua-id]").nth(2).getAttribute("data-dua-id"))!;
  await page.evaluate((target) => {
    addEventListener("hashchange", () => (location.hash = "#/day/tuesday"), {
      once: true,
    });
    location.hash = "#/dua/" + encodeURIComponent(target);
  }, id);
  await expect(page).toHaveURL(/#\/day\/tuesday$/);
  await expect(page.locator(".day-title")).toContainText("Dienstag");
});
