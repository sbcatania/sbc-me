import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for System Builder tests.
 * @see https://playwright.dev/docs/test-configuration
 */

// Use CONDUCTOR_PORT if running in Conductor, otherwise fall back to 4000
const port = process.env.CONDUCTOR_PORT || "4000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL,
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
    command: `npm run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
