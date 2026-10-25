import { test, expect } from "@playwright/test";
import fs from "node:fs";

test.describe("start language", () => {
  test.use({ locale: "fr-FR", timezoneId: "Europe/Paris" });
  test("follows the device until the reader picks a language", async ({
    page,
  }) => {
    await page.goto("/#/day/friday");
    await expect(page.getByRole("combobox", { name: "Langue" })).toHaveValue(
      "fr",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    // Nothing is stored for an automatic choice.
    expect(
      await page.evaluate(() => localStorage.getItem("hzaLanguageChoice")),
    ).toBeNull();
    await page.getByRole("combobox", { name: "Langue" }).selectOption("en");
    await page.reload();
    await expect(
      page.getByRole("combobox", { name: "Language" }),
    ).toHaveValue("en");
  });

  test("the automatic \"de\" of older releases no longer pins German", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) {
        sessionStorage.setItem("seeded", "1");
        localStorage.setItem("hzaLanguage", JSON.stringify("de"));
      }
    });
    await page.goto("/#/day/friday");
    await expect(page.getByRole("combobox", { name: "Langue" })).toHaveValue(
      "fr",
    );
    expect(
      await page.evaluate(() => localStorage.getItem("hzaLanguage")),
    ).toBeNull();
  });
});

test.describe("country decides when the device language is not offered", () => {
  test.use({ locale: "ar-MA", timezoneId: "Africa/Casablanca" });
  test("Arabic in Morocco starts in French", async ({ page }) => {
    await page.goto("/#/day/friday");
    await expect(page.getByRole("combobox", { name: "Langue" })).toHaveValue(
      "fr",
    );
  });

  test("…also when Chrome appends en-US to the language list", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "languages", {
        get: () => ["ar-MA", "ar", "en-US", "en"],
      }),
    );
    await page.goto("/#/day/friday");
    await expect(page.getByRole("combobox", { name: "Langue" })).toHaveValue(
      "fr",
    );
  });
});

test("a link to a hidden dua shows it", async ({ page }) => {
  await page.goto("/#/day/friday");
  const first = page.locator("[data-dua-id]").first();
  const id = (await first.getAttribute("data-dua-id"))!;
  await first.getByRole("button", { name: "Diese Dua ausblenden" }).click();
  await expect(page.locator("#dua-" + id)).toHaveClass(/is-hidden/);
  // Hiding moves focus to the "Einblenden" button of the same dua.
  await expect(
    page.locator("#dua-" + id).getByRole("button", { name: /^Einblenden/ }),
  ).toBeFocused();
  await page.goto("/#/day/monday");
  await page.goto("/#/dua/" + encodeURIComponent(id));
  await expect(page.locator("#dua-" + id + " .arabic-text")).toBeVisible();
  // Still hidden in storage; only the jump target is shown.
  await page.goto("/#/day/monday");
  await page.goto("/#/day/friday");
  await expect(page.locator("#dua-" + id)).toHaveClass(/is-hidden/);
});

test("hidden duas stay hidden, keep their place and can be shown again", async ({
  page,
}) => {
  await page.goto("/#/day/friday");
  const cards = page.locator("[data-dua-id]");
  await expect(cards.first()).toBeVisible();
  const total = await cards.count();
  const first = cards.first();
  const id = await first.getAttribute("data-dua-id");

  await first.getByRole("button", { name: "Diese Dua ausblenden" }).click();
  const placeholder = page.locator("#dua-" + id);
  await expect(placeholder).toHaveClass(/is-hidden/);
  await expect(placeholder.locator(".arabic-text")).toHaveCount(0);
  await expect(cards).toHaveCount(total);

  await page.reload();
  await expect(page.locator("#dua-" + id)).toHaveClass(/is-hidden/);
  await page
    .locator("#dua-" + id)
    .getByRole("button", { name: /^Einblenden/ })
    .click();
  await expect(page.locator("#dua-" + id + " .arabic-text")).toBeVisible();
});

test("a source type can be hidden in the settings and restored at once", async ({
  page,
}) => {
  const friday = JSON.parse(
    fs.readFileSync(
      new URL("../public/data/day-friday.json", import.meta.url),
      "utf8",
    ),
  ) as { duas: { source_type: string }[] };
  const before = friday.duas.filter(
    (dua) => dua.source_type === "later_supplication",
  ).length;
  expect(before).toBeGreaterThan(0);
  await page.goto("/#/day/friday");
  await expect(page.locator("[data-dua-id]").first()).toBeVisible();

  await page.getByRole("button", { name: "Einstellungen" }).last().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: "Späteres Gebet" }).check();
  await dialog.getByRole("button", { name: "Schließen" }).click();
  await expect(page.locator(".dua-card.is-hidden")).toHaveCount(before);

  await page.reload();
  await expect(page.locator(".dua-card.is-hidden")).toHaveCount(before);
  await page.getByRole("button", { name: "Einstellungen" }).last().click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Alle wieder einblenden" })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "Schließen" }).click();
  await expect(page.locator(".dua-card.is-hidden")).toHaveCount(0);
});
