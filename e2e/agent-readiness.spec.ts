import { test, expect } from "@playwright/test";

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("homepage has a useful introduction and discovery links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Hizbul Azam — Duas der Woche");
    expect((await page.locator("main").innerText()).length).toBeGreaterThan(500);
    await expect(page.getByRole("link", { name: "Über die App", exact: true })).toHaveAttribute("href", "/about");
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  });

  for (const path of ["/about", "/contact", "/privacy"]) {
    test(`${path} is readable without scripts`, async ({ page }) => {
      test.skip(!process.env.HZA_E2E_URL, "Requires production nginx routes");
      const response = await page.goto(path);
      expect(response!.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      expect((await page.locator("main").innerText()).length).toBeGreaterThan(500);
    });
  }
});

test("React replaces the introduction with the existing reader", async ({ page }) => {
  await page.goto("/#/day/friday");
  await expect(page.locator("[data-dua-id]").first()).toBeVisible();
  await expect(page.locator(".static-intro")).toHaveCount(0);
  await expect(page.locator(".day-title")).toContainText("Freitag");
});

test("a controlling service worker preserves trust pages and unknown-path 404s", async ({ page }) => {
  test.skip(!process.env.HZA_E2E_URL, "Requires production nginx routes");
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
  });
  const negotiated = await page.evaluate(async () => {
    const markdown = await fetch("/", { headers: { Accept: "text/markdown" } });
    const unsupported = await fetch("/", { headers: { Accept: "application/json" } });
    return { status: markdown.status, type: markdown.headers.get("content-type"), body: await markdown.text(), unsupported: unsupported.status };
  });
  expect(negotiated.status).toBe(200);
  expect(negotiated.type).toContain("text/markdown");
  expect(negotiated.body).toMatch(/^# Hizbul Azam/);
  expect(negotiated.unsupported).toBe(406);
  let response = await page.goto("/about");
  expect(response!.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("Über Hizbul Azam");
  response = await page.goto("/agent-test-sw-missing");
  expect(response!.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Seite nicht gefunden");
});
