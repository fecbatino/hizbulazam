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

  // Legal pages are published as they are; an unfilled template field such
  // as "[PLZ]" would make the imprint incomplete (§ 5 DDG).
  it.each(pages)("%s has no unfilled placeholders", (page) => {
    const html = readFileSync(join(PUBLIC, page), "utf8");
    expect(html).not.toMatch(/\[[A-Za-zÄÖÜäöüß][^\]<]{0,40}\]/);
  });

  // The address on the legal pages exactly as the owner confirmed it.
  it.each(["datenschutz.html", "impressum.html"])(
    "%s names the confirmed address",
    (page) => {
      const html = readFileSync(join(PUBLIC, page), "utf8");
      expect(html).toContain("Siegelsdorfer Str. 34");
      expect(html).toContain("90431");
      expect(html).not.toContain("Siegellsdorfer");
    },
  );

  it.each(pages)("%s links only stylesheets that exist", (page) => {
    const html = readFileSync(join(PUBLIC, page), "utf8");
    const links = [...html.matchAll(/<link[^>]+href="\/([^"]+\.css)"/g)];
    expect(links.length).toBeGreaterThan(0);
    for (const [, file] of links)
      expect(() => readFileSync(join(PUBLIC, file))).not.toThrow();
  });
});
