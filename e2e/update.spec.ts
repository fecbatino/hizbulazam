import { test, expect } from "@playwright/test";
import { appServer } from "./server";
test("an update waits for the reader and retains the saved position on reload", async ({
  page,
}) => {
  const app = await appServer();
  try {
    await page.goto(app.url + "/#/day/friday");
    await expect(page.locator("[data-dua-id]")).toHaveCount(19);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.evaluate(() => document.fonts.ready);
    await page.locator("[data-dua-id]").nth(5).scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("hzaReadingPositions")),
      )
      .not.toBeNull();
    const before = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("hzaReadingPositions")!).friday as {
          id: string;
          offset: number;
        },
    );
    app.update();
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update();
    });
    const notice = page.locator(".update-notice");
    await expect(notice).toBeVisible();
    await expect
      .poll(async () =>
        Math.abs(
          (await page.locator("#dua-" + before.id).boundingBox())!.y -
            before.offset,
        ),
      )
      .toBeLessThan(3);
    const navigation = page.waitForEvent("framenavigated");
    await page
      .getByRole("button", { name: "Jetzt aktualisieren", exact: true })
      .click();
    await navigation;
    await expect(page.locator("[data-dua-id]")).toHaveCount(19);
    await expect(notice).toHaveCount(0);
    await expect
      .poll(async () =>
        Math.abs(
          ((await page.locator("#dua-" + before.id).boundingBox())?.y ??
            99999) - before.offset,
        ),
      )
      .toBeLessThan(3);
  } finally {
    await app.close();
  }
});
test("a failed offline download never confirms a complete week and can be retried", async ({
  page,
}) => {
  const app = await appServer();
  try {
    await page.goto(app.url + "/#/day/friday");
    await expect(page.locator("[data-dua-id]")).toHaveCount(19);
    await page.evaluate(() => navigator.serviceWorker.ready);
    const manifestPath = await page.evaluate(
      () =>
        performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .find((url) => url.endsWith("/collections.json"))!,
    );
    const versionBase = new URL(manifestPath).pathname.replace(
      "collections.json",
      "",
    );
    app.fail(versionBase + "day-saturday.json");
    await page
      .getByRole("button", { name: "Einstellungen", exact: true })
      .click();
    const download = page.getByRole("button", {
      name: "Ganze Woche offline speichern",
      exact: true,
    });
    await download.click();
    await expect(
      page.getByText("Download unterbrochen.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Die ganze Woche ist offline verfügbar",
        exact: true,
      }),
    ).toHaveCount(0);
    app.fail("");
    await download.click();
    await expect(
      page.getByRole("button", {
        name: "Die ganze Woche ist offline verfügbar",
        exact: true,
      }),
    ).toBeVisible({ timeout: 30000 });
  } finally {
    await app.close();
  }
});
