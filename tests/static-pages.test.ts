import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The CSP (deploy/nginx/security-headers.inc) allows styles and scripts only
// from files on this origin. Inline code in a static page is silently blocked
// in production, while the dev and preview servers still show it.
const PUBLIC = join(__dirname, "..", "public");
const pages = readdirSync(PUBLIC).filter((file) => file.endsWith(".html"));

describe("static pages", () => {
  it("exist", () => {
    expect(pages).toEqual(
      expect.arrayContaining(["datenschutz.html", "impressum.html"]),
    );
  });

  it.each(pages)("%s contains no inline styles or scripts", (page) => {
    const html = readFileSync(join(PUBLIC, page), "utf8");
    expect(html).not.toMatch(/<style[\s>]/i);
    expect(html).not.toMatch(/\sstyle\s*=/i);
    expect(html).not.toMatch(/<script(?![^>]*\ssrc=)[^>]*>/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it.each(pages)("%s links only stylesheets that exist", (page) => {
    const html = readFileSync(join(PUBLIC, page), "utf8");
    const links = [...html.matchAll(/<link[^>]+href="\/([^"]+\.css)"/g)];
    expect(links.length).toBeGreaterThan(0);
    for (const [, file] of links)
      expect(() => readFileSync(join(PUBLIC, file))).not.toThrow();
  });
});
