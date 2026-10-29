import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * The browsers Playwright downloads are unavailable on this network, so the suite drives the
 * Chrome or Edge that is already installed on the machine via "channel". That also makes the run
 * closer to what a visitor actually uses.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    channel: process.env.E2E_CHANNEL ?? "chrome",
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: process.env.E2E_CHANNEL ?? "chrome", viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: process.env.E2E_CHANNEL ?? "chrome" },
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        // invoked through node directly: the npm .bin shims break on this repository's path
        command: "node node_modules/next/dist/bin/next start -p 3000",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
