import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for System Builder tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:4000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run the dev server before tests */
  webServer: {
    command: "npm run dev -- -p 4000",
    url: "http://localhost:4000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
