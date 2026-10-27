import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

export async function checkAgentHttp(baseURL) {
  let count = 0;
  const origin = "https://hza.fechal-batakpale.com";
  async function get(path, accept, status = 200, type) {
    const response = await fetch(new URL(path, baseURL), { headers: accept ? { Accept: accept } : {}, signal: AbortSignal.timeout(10000), redirect: "error" });
    count++;
    assert.equal(response.status, status, `${path} Accept: ${accept}`);
    if (type) assert.ok(response.headers.get("content-type")?.startsWith(type), `${path} Accept: ${accept}: ${response.headers.get("content-type")} != ${type}`);
    assert.ok(response.headers.get("content-security-policy"), `CSP missing on ${path}`);
    return { response, text: await response.text() };
  }
  const cases = [
    ["text/markdown", "md"], ["text/html", "html"], ["*/*", "html"], ["text/*", "html"],
    ["application/json", "none"], ["text/markdown;q=0", "none"],
    ["text/markdown;q=0, text/html", "html"],
    ["text/html;q=0, text/markdown", "md"],
    ["text/html, text/markdown;q=0.1", "html"],
    ["text/markdown;q=0.9, text/html;q=0.8", "md"],
    ["text/html;q=0, */*;q=1", "md"],
    ["text/markdown;q=0, */*;q=1", "html"],
    ["text/*;q=0.5, text/markdown;q=0.1", "html"],
    ["text/*;q=0.5, text/html;q=0.1", "md"],
    ['TEXT/MARKDOWN; CHARSET="UTF-8"; Q=1.000', "md"],
    ["text/markdown;charset=iso-8859-1", "none"],
    ["text/markdown;q=1, text/markdown;charset=utf-8;q=0.5, text/html;q=0.6", "html"],
    ["text/markdown;charset=utf-8;q=0.5, text/markdown;q=1, text/html;q=0.6", "html"],
    ["application/x-text/markdown", "none"],
    ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "html"],
  ];
  // Exercise decimal precision, all comparison positions, equal preferences,
  // header ordering, and explicit exclusions against an independent numeric oracle.
  for (const [md, html] of [[0, 0], [1, 0.999], [0.001, 0], [0.01, 0.009], [0.5, 0.501], [0.42, 0.42], [0.101, 0.1], [0.9, 1], [0.099, 0.1]]) {
    for (const reverse of [false, true]) {
      const values = [`text/markdown;q=${md}`, `text/html;q=${html}`];
      cases.push([(reverse ? values.reverse() : values).join(", "), md === 0 && html === 0 ? "none" : md > html ? "md" : "html"]);
    }
  }
  for (const path of ["/", "/index.html", "/about", "/contact"]) {
    for (const [accept, format] of cases) {
      const { response, text } = await get(path, accept, format === "none" ? 406 : 200, format === "md" ? "text/markdown" : "text/html");
      assert.match(response.headers.get("vary") ?? "", /(?:^|,\s*)Accept(?:,|$)/i);
      if (format === "md") { assert.match(text, /^# /); assert.ok(text.length > 500); }
      if (format === "html") assert.match(text, /<h1>/);
    }
  }
  for (const path of ["/agent-test-missing", "/nested/unknown", "/unknown.html", "/unknown.md", "/assets/missing.js", "/data/missing.json", "/.well-known/missing.json", "/assets/", "/404.md", "/404.html"]) {
    for (const accept of ["text/markdown", "text/html"]) {
      const { response, text } = await get(path, accept, 404, accept);
      assert.match(response.headers.get("vary") ?? "", /Accept/i);
      assert.ok(text.length > 20);
      assert.ok(text.includes("/llms.txt") && text.includes("/sitemap.xml"));
      if (accept === "text/markdown") { assert.match(text, /^# 404/); assert.ok(!text.includes("<html")); }
    }
  }
  const html = (await get("/", "text/html", 200, "text/html")).text;
  const document = new JSDOM(html).window.document;
  assert.ok(document.querySelector("main").textContent.trim().length >= 500);
  assert.equal(document.querySelector('link[rel="canonical"]').href, origin + "/");
  assert.equal(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)["@context"], "https://schema.org");
  const sitemap = (await get("/sitemap.xml", "application/xml", 200, "text/xml")).text;
  const xml = new JSDOM(sitemap, { contentType: "application/xml" }).window.document;
  assert.equal(xml.documentElement.namespaceURI, "http://www.sitemaps.org/schemas/sitemap/0.9");
  for (const loc of xml.querySelectorAll("loc")) {
    const path = new URL(loc.textContent).pathname;
    const page = new JSDOM((await get(path, "text/html", 200, "text/html")).text).window.document;
    assert.equal(page.querySelectorAll("h1").length, 1);
    assert.equal(page.querySelector('link[rel="canonical"]').href, loc.textContent);
    if (path !== "/impressum.html") assert.ok(page.querySelector("main").textContent.trim().length >= 500);
  }
  for (const path of ["/index.md", "/about.md", "/contact.md"]) await get(path, "text/markdown", 200, "text/markdown");
  const llms = (await get("/llms.txt", "text/plain", 200, "text/plain")).text;
  assert.match(llms, /^# Hizbul Azam\r?\n\r?\n> /);
  assert.ok(llms.includes("## When to use this"));
  for (const [, url] of llms.matchAll(/\]\((https:\/\/hza\.fechal-batakpale\.com[^)]+)\)/g)) await get(new URL(url).pathname);
  assert.ok((await get("/robots.txt", "text/plain", 200, "text/plain")).text.includes(origin + "/sitemap.xml"));
  assert.ok((await get("/manifest.webmanifest")).text.includes("Hizbul Azam"));
  assert.ok(Array.isArray(JSON.parse((await get("/.well-known/assetlinks.json", "application/json", 200, "application/json")).text)));
  await get("/icon-512.png", "image/png", 200, "image/png");
  const head = await fetch(new URL("/", baseURL), { method: "HEAD", headers: { Accept: "text/markdown" } });
  assert.equal(head.status, 200);
  assert.ok(head.headers.get("content-type").startsWith("text/markdown"));
  console.log(`Agent HTTP verification passed: ${count + 1} requests (negotiation, 404s, canonical pages, discovery, JSON-LD, PWA resources).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.ok(process.argv[2], "Usage: node scripts/check-agent-http.mjs <base-url>");
  await checkAgentHttp(process.argv[2]);
}
