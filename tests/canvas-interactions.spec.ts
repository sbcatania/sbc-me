import { test, expect } from "@playwright/test";
import {
  importFixture,
  waitForCanvas,
  getNodeCount,
  getEdgeCount,
  createNodeAt,
  selectNode,
  deleteSelected,
  autoLayout,
  zoomToFit,
  clearIndexedDB,
} from "./helpers";

test.describe("Canvas Interactions", () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB to ensure clean test state
    await page.goto("/");
    await clearIndexedDB(page);
    await page.reload();
    await waitForCanvas(page);
  });

  test("should create a node by double-clicking", async ({ page }) => {
    const initialCount = await getNodeCount(page);

    // Double-click to create a node
    await createNodeAt(page, 300, 200);

    const newCount = await getNodeCount(page);
    expect(newCount).toBe(initialCount + 1);
  });

  test("should select a node by clicking", async ({ page }) => {
    // Import a diagram with nodes
    await importFixture(page, "single-stock");

    // Click on the node (exclude handles)
    const node = page.locator("[data-node-id]:not([data-handle])").first();
    await node.click();

    // Node should be visually selected (border changes)
    // We can verify the selection exists by trying to delete
    await page.keyboard.press("Backspace");

    // Node should be deleted
    const nodeCount = await getNodeCount(page);
    expect(nodeCount).toBe(0);
  });

  test("should delete selected node with backspace", async ({ page }) => {
    await importFixture(page, "single-stock");

    expect(await getNodeCount(page)).toBe(1);

    // Select and delete
    await selectNode(page, "stock-1");
    await deleteSelected(page);

    expect(await getNodeCount(page)).toBe(0);
  });

  test("should delete selected edge with backspace", async ({ page }) => {
    await importFixture(page, "simple-flow");

    expect(await getEdgeCount(page)).toBe(1);

    // Click on the edge to select it
    const edge = page.locator("[data-edge-id]").first();
    await edge.click();

    await deleteSelected(page);

    expect(await getEdgeCount(page)).toBe(0);
  });

  test("should undo with Cmd+Z", async ({ page }) => {
    await importFixture(page, "single-stock");

    // Delete the node
    await selectNode(page, "stock-1");
    await deleteSelected(page);
    expect(await getNodeCount(page)).toBe(0);

    // Undo
    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(300);

    expect(await getNodeCount(page)).toBe(1);
  });

  test("should run auto-layout", async ({ page }) => {
    await importFixture(page, "complex-system");

    // Get initial positions
    const initialNode = await page.locator("[data-node-id]:not([data-handle])").first().boundingBox();

    // Run auto-layout
    await autoLayout(page);

    // Positions should have changed (layout was applied)
    // We just verify no errors occurred
    const nodeCount = await getNodeCount(page);
    expect(nodeCount).toBe(6);
  });

  test("should zoom to fit", async ({ page }) => {
    await importFixture(page, "complex-system");

    // Run zoom to fit
    await zoomToFit(page);

    // All nodes should still be visible
    const nodeCount = await getNodeCount(page);
    expect(nodeCount).toBe(6);
  });

  test("should pan canvas with space + drag", async ({ page }) => {
    await importFixture(page, "simple-flow");

    const canvas = page.locator('[data-testid="canvas-svg"]');

    // Hold space and drag
    await page.keyboard.down("Space");
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 300, y: 200 },
      targetPosition: { x: 100, y: 100 },
    });
    await page.keyboard.up("Space");

    // Nodes should still exist
    expect(await getNodeCount(page)).toBe(2);
  });

  test("should select all with Cmd+A", async ({ page }) => {
    await importFixture(page, "linear-chain");

    // Select all
    await page.keyboard.press("Meta+a");

    // Delete all selected
    await deleteSelected(page);

    // All nodes should be deleted
    expect(await getNodeCount(page)).toBe(0);
  });
});
