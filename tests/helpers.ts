import { Page, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Test helper functions for System Builder Playwright tests.
 * These utilities make it easy to load fixtures and interact with the app.
 */

const FIXTURES_DIR = path.join(__dirname, "fixtures");

/**
 * Get the JSON content of a test fixture file.
 */
export function getFixture(fixtureName: string): string {
  const filePath = path.join(FIXTURES_DIR, `${fixtureName}.json`);
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Get the parsed JSON of a test fixture.
 */
export function getFixtureJson(fixtureName: string): Record<string, unknown> {
  return JSON.parse(getFixture(fixtureName));
}

/**
 * List all available test fixtures.
 */
export function listFixtures(): string[] {
  return fs
    .readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

/**
 * Import a fixture diagram via the import modal by pasting JSON.
 * This is the recommended way for Playwright to load test scenarios.
 */
export async function importFixture(page: Page, fixtureName: string): Promise<void> {
  const json = getFixture(fixtureName);

  // Click import button to open modal
  await page.click('[data-testid="import-button"]');

  // Wait for modal to appear
  await expect(page.locator('[data-testid="import-modal"]')).toBeVisible();

  // Paste the fixture JSON into the textarea (now directly visible)
  await page.fill('[data-testid="import-paste-textarea"]', json);

  // Click import button
  await page.click('[data-testid="import-confirm-paste"]');

  // Wait for navigation to new diagram
  await page.waitForURL(/\/d\//);

  // Wait for canvas to be ready
  await page.waitForSelector("svg", { timeout: 5000 });
}

/**
 * Export the current diagram and return the JSON string.
 */
export async function exportDiagram(page: Page): Promise<string> {
  // Click export button to open modal
  await page.click('[data-testid="export-button"]');

  // Wait for modal to appear
  await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();

  // Get the JSON from the textarea
  const json = await page.locator('[data-testid="export-json-textarea"]').inputValue();

  // Close the modal
  await page.keyboard.press("Escape");

  return json;
}

/**
 * Wait for the canvas to be fully loaded and interactive.
 */
export async function waitForCanvas(page: Page): Promise<void> {
  await page.waitForSelector("svg", { timeout: 10000 });
  // Small delay to ensure React hydration is complete
  await page.waitForTimeout(500);
}

/**
 * Get the count of nodes visible on the canvas.
 */
export async function getNodeCount(page: Page): Promise<number> {
  return page.locator("[data-node-id]").count();
}

/**
 * Get the count of edges visible on the canvas.
 */
export async function getEdgeCount(page: Page): Promise<number> {
  return page.locator("[data-edge-id]").count();
}

/**
 * Double-click on the canvas at the specified position to create a new node.
 */
export async function createNodeAt(
  page: Page,
  x: number,
  y: number
): Promise<void> {
  const canvas = page.locator("svg");
  await canvas.dblclick({ position: { x, y } });
  // Wait for new node to appear
  await page.waitForTimeout(300);
}

/**
 * Select a node by its ID.
 */
export async function selectNode(page: Page, nodeId: string): Promise<void> {
  await page.click(`[data-node-id="${nodeId}"]`);
}

/**
 * Delete the currently selected element(s).
 */
export async function deleteSelected(page: Page): Promise<void> {
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(200);
}

/**
 * Trigger auto-layout.
 */
export async function autoLayout(page: Page): Promise<void> {
  await page.click('[title*="Auto Layout"]');
  await page.waitForTimeout(500);
}

/**
 * Trigger zoom to fit.
 */
export async function zoomToFit(page: Page): Promise<void> {
  await page.click('[title*="Zoom to Fit"]');
  await page.waitForTimeout(300);
}

/**
 * Open the settings panel.
 */
export async function openSettings(page: Page): Promise<void> {
  await page.click('[title*="Settings"]:not([title*="Close"])');
  await page.waitForTimeout(200);
}

/**
 * Close the settings panel.
 */
export async function closeSettings(page: Page): Promise<void> {
  await page.click('[title*="Close Settings"]');
  await page.waitForTimeout(200);
}

/**
 * Set the label mode setting.
 */
export async function setLabelMode(
  page: Page,
  mode: "hover" | "always"
): Promise<void> {
  await openSettings(page);
  await page.click(`button:has-text("${mode === "hover" ? "Hover" : "Always"}")`);
  await closeSettings(page);
}
