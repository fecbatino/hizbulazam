import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";
const meta = JSON.parse(
  fs.readFileSync(
    new URL("../public/data/collections.json", import.meta.url),
    "utf8",
  ),
).collections as { day: string; count: number }[];
async function expectDay(page: Page) {
  await expect(page).toHaveURL(/#\/day\//);
  const day = new URL(page.url()).hash.slice("#/day/".length);
  await expect(page.locator("[data-dua-id]")).toHaveCount(
    meta.find((item) => item.day === day)!.count,
  );
}
async function pressNavigation(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  await expect(button).toBeVisible();
  const rect = await button.boundingBox();
  if (!rect) throw new Error("Navigation missing");
  // Direct input avoids locator.click auto-scrolling a sticky ancestor before
  // the click. This matches a reader tapping an already visible control.
  if (test.info().project.name === "mobile")
    await page.touchscreen.tap(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
  else
    await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
}
test.beforeEach(async ({ page }) => {
  await page.goto("/#/day/friday");
  await expectDay(page);
  await page.evaluate(() => document.fonts.ready);
});
test("30 diagonal and multi-touch gestures keep the selected day", async ({
  page,
}) => {
  await page.screenshot({ path: test.info().outputPath("reading.png") });
  const url = page.url();
  const area = page.locator("main");
  for (let i = 0; i < 30; i++) {
    const touches = [{ identifier: 1, clientX: 270, clientY: 650 }];
    await area.dispatchEvent("touchstart", { touches, targetTouches: touches });
    const moved = [{ identifier: 1, clientX: 170, clientY: 200 }];
    await area.dispatchEvent("touchmove", {
      touches: moved,
      targetTouches: moved,
    });
    await area.dispatchEvent("touchend", {
      touches: [],
      changedTouches: moved,
    });
  }
  await area.dispatchEvent("touchstart", {
    touches: [
      { identifier: 1, clientX: 100, clientY: 400 },
      { identifier: 2, clientX: 200, clientY: 400 },
    ],
  });
  await area.dispatchEvent("touchcancel", { touches: [] });
  await page.mouse.wheel(0, 1600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
  expect(page.url()).toBe(url);
  await expectDay(page);
});
test("settings locks scrolling, keeps slider focus and restores the reading anchor", async ({
  page,
}) => {
  await page.locator("[data-dua-id]").nth(5).scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("hzaReadingPositions")),
    )
    .not.toBeNull();
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("hzaReadingPositions")!).friday as {
        id: string;
        offset: number;
      },
  );
  const opener = page.getByRole("button", {
    name: "Einstellungen",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Einstellungen" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("position", "fixed");
  const before = await page.locator("#dua-" + saved.id).boundingBox();
  await page.mouse.move(2, 120);
  await page.mouse.wheel(0, 1200);
  await expect
    .poll(async () =>
      Math.abs(
        (await page.locator("#dua-" + saved.id).boundingBox())!.y - before!.y,
      ),
    )
    .toBeLessThan(2);
  const slider = dialog.getByLabel("Arabische Schriftgröße");
  await slider.focus();
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  await expect(slider).toBeFocused();
  await slider.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect
    .poll(async () =>
      Math.abs(
        (await page.locator("#dua-" + saved.id).boundingBox())!.y -
          saved.offset,
      ),
    )
    .toBeLessThan(3);
});
test("explicit day navigation, favorites and reload retain the reading position", async ({
  page,
}) => {
  await page.locator("[data-dua-id]").nth(6).scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("hzaReadingPositions")),
    )
    .not.toBeNull();
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("hzaReadingPositions")!).friday as {
        id: string;
        offset: number;
      },
  );
  await pressNavigation(page, "Nächster Tag");
  await expect(page).toHaveURL(/day\/saturday$/);
  await expectDay(page);
  await pressNavigation(page, "Vorheriger Tag");
  await expect(page).toHaveURL(/day\/friday$/);
  await expect
    .poll(async () =>
      Math.abs(
        (await page.locator("#dua-" + saved.id).boundingBox())!.y -
          saved.offset,
      ),
    )
    .toBeLessThan(3);
  await pressNavigation(page, "Favoriten");
  await expect(page.getByRole("heading", { name: "Favoriten" })).toBeVisible();
  await pressNavigation(page, "Duas");
  await expect
    .poll(async () =>
      Math.abs(
        (await page.locator("#dua-" + saved.id).boundingBox())!.y -
          saved.offset,
      ),
    )
    .toBeLessThan(3);
  await page.reload();
  await expect
    .poll(async () =>
      Math.abs(
        ((await page.locator("#dua-" + saved.id).boundingBox())?.y ?? 99999) -
          saved.offset,
      ),
    )
    .toBeLessThan(3);
});
test("language persists and search can revisit the same dua", async ({
  page,
}) => {
  await page.getByRole("combobox", { name: "Sprache" }).selectOption("fr");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Langue" })).toHaveValue(
    "fr",
  );
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Recherche", exact: true }).click();
    await page
      .getByRole("searchbox", { name: "Recherche" })
      .fill("miséricordieux");
    const first = page.locator(".search-result").first();
    await expect(first).toBeVisible();
    await first.click();
    await expect(page).toHaveURL(/#\/dua\//);
    const id = decodeURIComponent(
      new URL(page.url()).hash.slice("#/dua/".length),
    );
    await expect
      .poll(
        async () =>
          (await page.locator("#dua-" + id).boundingBox())?.y ?? -9999,
      )
      .toBeGreaterThan(80);
    await expect
      .poll(
        async () => (await page.locator("#dua-" + id).boundingBox())?.y ?? 9999,
      )
      .toBeLessThan(280);
    await page
      .getByRole("button", { name: "Jour suivant", exact: true })
      .click();
    await expectDay(page);
  }
});
test("downloaded week, search and reload work without a network connection", async ({
  page,
  context,
}) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ganze Woche offline speichern", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Die ganze Woche ist offline verfügbar",
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await context.setOffline(true);
  for (let i = 0; i < 7; i++) {
    const before = page.url();
    await pressNavigation(page, "Nächster Tag");
    await expect.poll(() => page.url()).not.toBe(before);
    await expectDay(page);
    await expect(
      page.getByText("Der Inhalt konnte nicht geladen werden.", {
        exact: false,
      }),
    ).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Suche", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Suche", exact: true })
    .fill("Allah");
  await expect(page.locator(".search-result").first()).toBeVisible();
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await page.reload();
  await expectDay(page);
});
