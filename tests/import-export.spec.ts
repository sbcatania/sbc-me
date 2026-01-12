import { test, expect } from "@playwright/test";
import {
  importFixture,
  exportDiagram,
  getFixtureJson,
  waitForCanvas,
  getNodeCount,
  getEdgeCount,
  clearIndexedDB,
} from "./helpers";

test.describe("Import/Export", () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB to ensure clean test state
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await waitForCanvas(page);
  });

  test("should import an empty diagram", async ({ page }) => {
    await importFixture(page, "empty-diagram");

    const nodeCount = await getNodeCount(page);
    const edgeCount = await getEdgeCount(page);

    expect(nodeCount).toBe(0);
    expect(edgeCount).toBe(0);
  });

  test("should import a single stock diagram", async ({ page }) => {
    await importFixture(page, "single-stock");

    const nodeCount = await getNodeCount(page);
    expect(nodeCount).toBe(1);

    // Verify the node label
    await expect(page.locator("[data-node-id]")).toContainText("Inventory");
  });

  test("should import a simple flow diagram", async ({ page }) => {
    await importFixture(page, "simple-flow");

    const nodeCount = await getNodeCount(page);
    const edgeCount = await getEdgeCount(page);

    expect(nodeCount).toBe(2);
    expect(edgeCount).toBe(1);
  });

  test("should import a linear chain diagram", async ({ page }) => {
    await importFixture(page, "linear-chain");

    const nodeCount = await getNodeCount(page);
    const edgeCount = await getEdgeCount(page);

    expect(nodeCount).toBe(4);
    expect(edgeCount).toBe(3);
  });

  test("should import a cycle diagram", async ({ page }) => {
    await importFixture(page, "cycle");

    const nodeCount = await getNodeCount(page);
    const edgeCount = await getEdgeCount(page);

    expect(nodeCount).toBe(3);
    expect(edgeCount).toBe(3);
  });

  test("should import a complex system diagram", async ({ page }) => {
    await importFixture(page, "complex-system");

    const nodeCount = await getNodeCount(page);
    const edgeCount = await getEdgeCount(page);

    expect(nodeCount).toBe(6);
    expect(edgeCount).toBe(7);
  });

  test("should import a hub node diagram", async ({ page }) => {
    await importFixture(page, "hub-node");

    const nodeCount = await getNodeCount(page);
    const edgeCount = await getEdgeCount(page);

    expect(nodeCount).toBe(6);
    expect(edgeCount).toBe(5);
  });

  test("should export a diagram and match structure", async ({ page }) => {
    await importFixture(page, "simple-flow");

    const exportedJson = await exportDiagram(page);
    const exported = JSON.parse(exportedJson);

    // Verify basic structure
    expect(exported).toHaveProperty("nodes");
    expect(exported).toHaveProperty("edges");
    expect(exported).toHaveProperty("title");
    expect(exported.title).toBe("Simple Flow");

    // Verify node count
    expect(Object.keys(exported.nodes).length).toBe(2);
    expect(Object.keys(exported.edges).length).toBe(1);
  });

  test("should show error for invalid JSON", async ({ page }) => {
    // Open import modal
    await page.click('[data-testid="import-button"]');
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible();

    // Switch to paste mode
    await page.click('[data-testid="import-paste-button"]');

    // Paste invalid JSON
    await page.fill('[data-testid="import-paste-textarea"]', "{ invalid json }");

    // Try to import
    await page.click('[data-testid="import-confirm-paste"]');

    // Should show error
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
  });
});
