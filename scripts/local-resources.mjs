import { JSDOM } from "jsdom";

export function assertLocalResources(html) {
  // Canonical URLs and JSON-LD identifiers do not fetch anything. Inspect
  // fetch-bearing attributes so metadata can use absolute URLs without CDNs.
  const document = new JSDOM(html).window.document;
  for (const element of document.querySelectorAll("[src], link[href]")) {
    if (element.matches('link[rel="canonical"], link[rel="alternate"], link[rel="describedby"]')) continue;
    const url = element.getAttribute("src") ?? element.getAttribute("href");
    if (!url?.startsWith("/") || url.startsWith("//"))
      throw new Error("Non-local resource in HTML: " + url);
  }
}
