import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const root = path.dirname(fileURLToPath(import.meta.url));
const data = fs
  .readdirSync(path.join(root, "public/data"))
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => ({
    file,
    source: fs.readFileSync(path.join(root, "public/data", file)),
  }));
const fonts = fs
  .readdirSync(path.join(root, "public/fonts"))
  .filter((file) => file.endsWith(".woff2"))
  .sort()
  .map((file) => ({
    file: "fonts/" + file,
    source: fs.readFileSync(path.join(root, "public/fonts", file)),
  }));
const rawFontCss = fs.readFileSync(
  path.join(root, "public/fonts/fonts.css"),
  "utf8",
);
const version = createHash("sha256")
  .update(
    Buffer.concat(
      [...data, ...fonts].flatMap((item) => [
        Buffer.from(item.file),
        item.source,
      ]),
    ),
  )
  .update(rawFontCss)
  .digest("hex")
  .slice(0, 16);
const prefix = "assets/content/" + version + "/";
const fontCss = rawFontCss.replaceAll("/fonts/", "/" + prefix + "fonts/");
const resources = [
  ...data,
  ...fonts,
  { file: "fonts/fonts.css", source: Buffer.from(fontCss) },
];
export default defineConfig({
  server: { port: 3000, host: "0.0.0.0" },
  define: { "import.meta.env.VITE_CONTENT_VERSION": JSON.stringify(version) },
  plugins: [
    react(),
    {
      name: "immutable-content",
      apply: "build",
      transformIndexHtml(html) {
        return html.replaceAll("/fonts/", "/" + prefix + "fonts/");
      },
      closeBundle() {
        // Vite copies public/ verbatim; the app only reads the versioned copies.
        const links = path.join(root, "dist/.well-known/assetlinks.json");
        fs.mkdirSync(path.dirname(links), { recursive: true });
        fs.copyFileSync(path.join(root, "public/.well-known/assetlinks.json"), links);
        // A fixed HTML document for offline navigation: negotiating index.html
        // varies by Accept and therefore cannot safely share a Workbox cache key.
        fs.copyFileSync(path.join(root, "dist/index.html"), path.join(root, "dist/offline.html"));
        for (const dir of ["data", "fonts"])
          fs.rmSync(path.join(root, "dist", dir), {
            recursive: true,
            force: true,
          });
      },
      generateBundle() {
        for (const item of resources)
          this.emitFile({
            type: "asset",
            fileName: prefix + item.file,
            source: item.source,
          });
        this.emitFile({
          type: "asset",
          fileName: prefix + "offline-manifest.json",
          source: JSON.stringify({
            version,
            resources: resources.map((item) => ({
              url: "/" + prefix + item.file,
              sha256: createHash("sha256").update(item.source).digest("hex"),
            })),
          }),
        });
      },
    },
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      manifest: {
        name: "Hizbul Azam — Dua der Woche",
        short_name: "Hizbul Azam",
        description:
          "Die Duas der Woche, arabisch mit Übersetzung — offline verfügbar.",
        lang: "de",
        dir: "ltr",
        theme_color: "#1B4332",
        background_color: "#F7F5F0",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html}"],
        // Errors return 404; index varies by Accept. Cache the fixed offline
        // HTML document instead so Cache.match cannot mix representations.
        globIgnores: ["**/404.html", "**/index.html"],
        clientsClaim: true,
        navigateFallback: "/offline.html",
        // Only the root is an app route (day/dua navigation uses fragments).
        // Do not turn unknown paths or informational pages into the app shell.
        navigateFallbackAllowlist: [/^\/(?:index\.html)?(?:\?|$)/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/assets\/content\/[a-f0-9]+\//,
            handler: "CacheFirst",
            options: {
              cacheName: "hza-content-v1",
              expiration: {
                maxEntries: 160,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(root, ".") } },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
});
