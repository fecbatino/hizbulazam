import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    // Die UI startet jetzt in der Geraetesprache; die Tests sind deutsch
    // geschrieben und brauchen deshalb eine feste Locale.
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    locale: "de-DE",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 5"] } },
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
  ],
});
