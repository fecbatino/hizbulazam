# Agent readiness — 27 October 2026

Baseline: commit `3a7bc66`, https://hza.fechal-batakpale.com. Live `curl` checks before implementation confirmed that both `/` and an unknown path returned HTTP 200 and HTML for `Accept: text/markdown`. The homepage root was empty before JavaScript ran. The supplied audit score was 38/100; no new audit score is claimed.

## Changes against the supplied audit

| Priority | Audit item | Implementation / remaining action |
| --- | --- | --- |
| 1 | Content without JavaScript | Homepage introduction exceeds 500 visible characters, with one H1 and sequential H2s. React replaces it when the reader mounts. |
| 2 | Agent-friendly 404s | Unknown paths, missing assets, JSON, HTML and Markdown return actual 404s. Negotiated Markdown errors link to the app, llms.txt and sitemap; HTML remains available. |
| 3 | Markdown negotiation | `/`, `/index.html`, `/about` and `/contact` negotiate HTML/Markdown, set `Vary: Accept`, respect media-range specificity, q-values and wildcards, and return 406 when neither representation is acceptable. HTML wins equal preferences. Explicit sibling `.md` files also work. |
| 4 | Brand discovery | Homepage title, description and H1 identify “Hizbul Azam — Duas der Woche” and its translation/offline features. Ranking cannot be guaranteed by code. Indexing and external mentions remain owner actions. |
| 5 | Structured data | Inline JSON-LD identifies the SoftwareApplication, free offer, languages, product URL and publisher. No ratings, endorsements or affiliations are invented. |
| 6 | Agent guidance | llms.txt includes concrete when-to-use cases and retrieval instructions, following the H1/blockquote/details/H2 file-list format. |
| 7 | Sitemap | XML sitemap lists canonical, indexable pages with actual modification dates. robots.txt advertises it. Hash routes, Markdown alternates and the offline/error documents are excluded. |
| 8 | Organization completeness | The existing imprint identifies an individual, Fechal Batakpale. Publisher schema therefore uses Person with the published ContactPoint and PostalAddress. An Organization should only be added after its actual name and relationship to the project are confirmed. An audit demanding Organization specifically may still flag this. |
| 9 | Trust pages | `/about` and `/contact` contain substantial factual content. `/privacy` serves the existing multilingual privacy policy. Each exceeds 500 visible characters without JavaScript; existing legal URLs keep working. |
| 10 | Metadata | Canonical URL, document language, og:image, og:type, title, description and alternate/discovery links are present. The existing app icon is used as the social image. |

## Product preservation

No application component or prayer-data file changed. Day/dua links continue to use fragments. Fonts, translations, favorites, language choice and reader layout are preserved. The JavaScript entry remains 32.62 kB, below the existing 40 kB limit; no dependency was added.

The PWA precaches a build-generated `/offline.html` copy rather than the negotiated `/index.html`: Workbox's cache key cannot safely distinguish Accept variants. Only root/index navigations use that fallback, so unknown paths and informational pages stay real resources. The offline document is marked noindex by nginx. The error document is excluded from precaching because it deliberately returns 404.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- `npm run test:production`: disposable container using the Compose-pinned nginx image; 186 HTTP contract checks, byte-for-byte HTTP checks of all 51 build files, and the full mobile/desktop Playwright suite.
- HTTP checks cover q-values through three decimal places, explicit exclusions, wildcards, unsupported types, uppercase media types, UTF-8 parameters, HEAD, both error representations, all canonical pages, llms.txt links, robots.txt, XML, JSON-LD, manifest and Digital Asset Links.
- Browser checks cover no-JavaScript content, React replacement, active-service-worker Markdown/406 responses, real 404 navigation, existing reading/navigation/preferences, offline week/search/reload and update behavior.
- Build verification compares every prayer-data file with its original bytes and checks all offline resource digests, local resource origins and bundle size.

CI now runs the HTTP and browser suite against production nginx rather than relying on Vite preview for deployment behavior. For a deployed site, run `node scripts/check-agent-http.mjs https://hza.fechal-batakpale.com` from an installed checkout. Deployment is pending PR review/merge; these results describe the local production container, not a changed live site.

## Owner actions after deployment

1. Verify the live host through the public Cloudflare/proxy path with the command above, then rerun the original readiness audit. If an edge cache is enabled later, ensure it preserves Accept variation and does not rewrite errors into the app shell.
2. Submit the sitemap and request homepage indexing using the owner's search-console account. Search-engine credentials and genuine external coverage are outside this change.
3. Confirm an organization identity only if there is a real organization operating the app; otherwise retain the accurate individual publisher. A custom social card is optional; the current image is the existing app icon.
4. Update sitemap lastmod dates and both HTML/Markdown texts together when information changes. Existing installed clients receive the routing changes when they accept the app update.

## Format references

- [Markdown negotiation requirements](https://acceptmarkdown.com/) and [nginx recipe / q-value caveat](https://acceptmarkdown.com/recipes/nginx).
- [HTTP semantics and media-range precedence](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1).
- [llms.txt format](https://llmstxt.org/).
- [Sitemap XML protocol](https://www.sitemaps.org/protocol.html).
- [SoftwareApplication](https://schema.org/SoftwareApplication), [Person](https://schema.org/Person), [ContactPoint](https://schema.org/ContactPoint), [PostalAddress](https://schema.org/PostalAddress).
