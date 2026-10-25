import { test, expect } from "@playwright/test";
import fs from "node:fs";

// The preview server sends no headers; production sends this CSP from nginx.
const headers = fs.readFileSync(
  new URL("../deploy/nginx/security-headers.inc", import.meta.url),
  "utf8",
);
const csp = /add_header Content-Security-Policy "([^"]+)"/.exec(headers)![1];

test.beforeEach(async ({ page }) => {
  await page.route(/\.(html|css)(\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), "content-security-policy": csp },
    });
  });
  await page.addInitScript(() => {
    (window as unknown as { violations: string[] }).violations = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      (window as unknown as { violations: string[] }).violations.push(
        event.violatedDirective + " " + event.blockedURI,
      ),
    );
  });
});

for (const [path, h1Gap] of [
  ["/datenschutz.html", "5.6px"],
  ["/impressum.html", "22.4px"],
] as const) {
  test(`${path} is styled under the production CSP`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.headers()["content-security-policy"]).toBe(csp);
    await expect(page.locator("h1")).toBeVisible();
    const style = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const main = getComputedStyle(document.querySelector("main")!);
      const h1 = getComputedStyle(document.querySelector("h1")!);
      return {
        font: body.fontFamily,
        margin: body.margin,
        maxWidth: main.maxWidth,
        h1Color: h1.color,
        h1Gap: h1.marginBottom,
      };
    });
    expect(style.font).toContain("system-ui");
    expect(style.margin).toBe("0px");
    expect(style.maxWidth).toBe("704px");
    expect(style.h1Color).toBe("rgb(27, 67, 50)");
    expect(style.h1Gap).toBe(h1Gap);
    expect(
      await page.evaluate(
        () => (window as unknown as { violations: string[] }).violations,
      ),
    ).toEqual([]);
  });
}
