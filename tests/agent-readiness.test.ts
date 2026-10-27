import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { negotiationConfig } from "../scripts/generate-negotiation.mjs";
import { assertLocalResources } from "../scripts/local-resources.mjs";

const origin = "https://hza.fechal-batakpale.com";
const read = (file: string) => readFileSync(resolve(file), "utf8");
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

describe("agent discovery and no-script content", () => {
  it.each(["index.html", "public/about.html", "public/contact.html", "public/datenschutz.html"])("%s has useful content and sequential headings", (file) => {
    const doc = parse(read(file));
    expect(doc.querySelector("main")!.textContent!.trim().length).toBeGreaterThanOrEqual(500);
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    let previous = 0;
    for (const heading of doc.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
      const level = Number(heading.tagName.slice(1));
      expect(level).toBeLessThanOrEqual(previous + 1);
      previous = level;
    }
    expect(doc.documentElement.lang).toBe("de");
    expect(doc.querySelector('link[rel="canonical"]')!.getAttribute("href")).toMatch(new RegExp("^" + origin));
  });

  it("identifies the application and the actual individual publisher", () => {
    const doc = parse(read("index.html"));
    expect(doc.title).toContain("Duas der Woche");
    expect(doc.querySelector('meta[property="og:type"]')!.getAttribute("content")).toBe("website");
    expect(doc.querySelector('meta[property="og:image"]')!.getAttribute("content")).toBe(origin + "/icon-512.png");
    const data = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(data["@context"]).toBe("https://schema.org");
    const app = data["@graph"].find((item: Record<string, unknown>) => item["@type"] === "SoftwareApplication");
    const publisher = data["@graph"].find((item: Record<string, unknown>) => item["@id"] === app.publisher["@id"]);
    expect(app).toMatchObject({ name: "Hizbul Azam", url: origin + "/", offers: { price: "0" } });
    expect(publisher).toMatchObject({ "@type": "Person", name: "Fechal Batakpale", contactPoint: { email: "fecbatino@gmail.com", contactType: "application support" }, address: { "@type": "PostalAddress", streetAddress: "Siegelsdorfer Str. 34", postalCode: "90431", addressCountry: "DE" } });
    expect(doc.querySelector('link[rel="alternate"][type="text/markdown"]')!.getAttribute("href")).toBe("/index.md");
  });

  it("publishes llms.txt in the specified H1/summary/details/H2 file-list format", () => {
    const text = read("public/llms.txt");
    expect(text).toMatch(/^# Hizbul Azam\r?\n\r?\n> /);
    expect(text).toContain("## When to use this");
    for (const section of text.split(/^## .+$/m).slice(1)) {
      for (const line of section.trim().split(/\r?\n/)) {
        if (line) expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/hza\.fechal-batakpale\.com\/[^)]+\)(?:: .+)?$/);
      }
    }
    expect(text).toContain("Accept: text/markdown");
  });

  it("publishes a valid sitemap with real canonical pages and modification dates", () => {
    const doc = new DOMParser().parseFromString(read("public/sitemap.xml"), "application/xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.documentElement.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
    expect([...doc.querySelectorAll("loc")].map((node) => node.textContent)).toEqual(["/", "/about", "/contact", "/privacy", "/impressum.html"].map((path) => origin + path));
    for (const date of doc.querySelectorAll("lastmod")) expect(date.textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(read("public/robots.txt")).toContain("Sitemap: " + origin + "/sitemap.xml");
  });

  it.each(["index", "about", "contact", "404"])("%s has a nonempty Markdown equivalent", (name) => {
    const text = read(`public/${name}.md`);
    expect(text).toMatch(/^# /);
    expect(text.length).toBeGreaterThan(100);
    expect(text).not.toMatch(/<(?:html|script|style)[\s>]/i);
  });

  it("keeps generated nginx negotiation maps reproducible", () => {
    expect(read("deploy/nginx/negotiation.conf").replaceAll("\r\n", "\n")).toBe(negotiationConfig());
  });

  it("allows identity URLs while requiring fetched resources to stay local", () => {
    expect(() => assertLocalResources(read("index.html"))).not.toThrow();
    for (const resource of [
      '<script src="https://cdn.example/app.js"></script>',
      '<link rel="stylesheet" href="//cdn.example/style.css">',
      '<link rel="preload" as="font" href="https://cdn.example/font.woff2">',
      '<img src="https://cdn.example/image.png">',
    ]) expect(() => assertLocalResources(resource)).toThrow("Non-local resource");
  });
});
