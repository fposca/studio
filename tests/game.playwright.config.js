import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./game",
  timeout: 120_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ["--enable-webgl", "--ignore-gpu-blocklist"] }
  },
  webServer: {
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort --configLoader runner",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true
  }
});
