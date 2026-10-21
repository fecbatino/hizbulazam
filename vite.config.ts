import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Hizbul Azam — Dua der Woche',
        short_name: 'Hizbul Azam',
        description: 'Die Duas der Woche, arabisch mit Übersetzung — offline verfügbar.',
        lang: 'de',
        dir: 'ltr',
        theme_color: '#1B4332',
        background_color: '#F7F5F0',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Nur Code und Icons vorladen - Daten und Schriften kommen beim ersten
        // Gebrauch in den Cache und bleiben dort (siehe runtimeCaching).
        globPatterns: ['**/*.{js,css,html}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Tagesdaten: sofort aus dem Cache, im Hintergrund aktualisieren
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'hza-data',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Schriften ändern sich nie
            urlPattern: /\/fonts\/.*\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hza-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          return undefined;
        },
      },
    },
  },
});
