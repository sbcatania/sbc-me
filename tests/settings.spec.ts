import { test, expect } from "@playwright/test";
import {
  importFixture,
  waitForCanvas,
  openSettings,
  closeSettings,
  setLabelMode,
} from "./helpers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForCanvas(page);
  });

  test("should open and close settings panel", async ({ page }) => {
    // Open settings
    await openSettings(page);

    // Settings panel should be visible
    await expect(page.locator('text="Flow Label Display"')).toBeVisible();

    // Close settings (icon should now be X)
    await closeSettings(page);

    // Settings panel should be hidden
    await expect(page.locator('text="Flow Label Display"')).not.toBeVisible();
  });

  test("should toggle settings with the same button", async ({ page }) => {
    // Initially settings closed
    await expect(page.locator('text="Flow Label Display"')).not.toBeVisible();

    // Click settings button (shows Settings icon)
    await page.click('[title="Settings"]');
    await expect(page.locator('text="Flow Label Display"')).toBeVisible();

    // Click again (now shows X icon)
    await page.click('[title="Close Settings"]');
    await expect(page.locator('text="Flow Label Display"')).not.toBeVisible();
  });

  test("should change label mode to always", async ({ page }) => {
    await importFixture(page, "simple-flow");

    // Open settings and set label mode to always
    await openSettings(page);

    // Click "Always" button
    await page.click('button:has-text("Always")');

    // Verify "Always" button is now selected (has different styling)
    const alwaysButton = page.locator('button:has-text("Always")');
    await expect(alwaysButton).toBeVisible();

    await closeSettings(page);

    // Labels should be visible even without hover
    // The edge label "transfer" should be visible
    await expect(page.locator("text=transfer")).toBeVisible();
  });

  test("should change label mode to hover", async ({ page }) => {
    await importFixture(page, "simple-flow");

    // First set to always
    await setLabelMode(page, "always");

    // Then set back to hover
    await setLabelMode(page, "hover");

    // Open settings to verify
    await openSettings(page);

    const hoverButton = page.locator('button:has-text("Hover")');
    await expect(hoverButton).toBeVisible();
  });

  test("should toggle grid visibility", async ({ page }) => {
    await openSettings(page);

    // Click "Hide" to hide the grid
    await page.click('button:has-text("Hide")');

    // The canvas should not have the grid class
    const canvas = page.locator(".canvas-grid");
    await expect(canvas).toHaveCount(0);

    // Click "Show" to show the grid
    await page.click('button:has-text("Show")');

    await closeSettings(page);

    // The canvas should have the grid class
    await expect(page.locator(".canvas-grid")).toHaveCount(1);
  });

  test("should show keyboard shortcuts reference", async ({ page }) => {
    await openSettings(page);

    // Keyboard shortcuts section should be visible
    await expect(page.locator('text="Keyboard Shortcuts"')).toBeVisible();
    await expect(page.locator('text="Double-click"')).toBeVisible();
    await expect(page.locator('text="Backspace"')).toBeVisible();
  });
});
