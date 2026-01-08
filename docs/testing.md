# Testing Documentation

This document describes how to run tests and create new test scenarios for System Builder.

## Quick Start

```bash
# Run all tests
bun test

# Run tests with UI (recommended for debugging)
bun run test:ui

# Run tests with browser visible
bun run test:headed

# Debug mode (step through tests)
bun run test:debug
```

## Test Architecture

### Directory Structure

```
tests/
├── fixtures/           # JSON diagram files for test scenarios
│   ├── empty-diagram.json
│   ├── single-stock.json
│   ├── simple-flow.json
│   ├── linear-chain.json
│   ├── cycle.json
│   ├── complex-system.json
│   └── hub-node.json
├── helpers.ts          # Shared test utilities
├── import-export.spec.ts
├── canvas-interactions.spec.ts
└── settings.spec.ts
```

### Test Fixtures

Test fixtures are JSON files that represent complete diagram states. They're designed to be:
- **Importable via paste**: Playwright can paste these directly into the import modal
- **Self-contained**: Each fixture represents a complete test scenario
- **Named descriptively**: The filename indicates what the fixture tests

#### Available Fixtures

| Fixture | Description | Nodes | Edges |
|---------|-------------|-------|-------|
| `empty-diagram` | Empty canvas | 0 | 0 |
| `single-stock` | One stock node | 1 | 0 |
| `simple-flow` | Two nodes with one flow | 2 | 1 |
| `linear-chain` | Four nodes in sequence (A→B→C→D) | 4 | 3 |
| `cycle` | Three nodes forming a cycle | 3 | 3 |
| `complex-system` | Software development flow | 6 | 7 |
| `hub-node` | Central node with multiple in/out edges | 6 | 5 |

### Creating New Test Fixtures

1. Create the diagram in the app manually or by editing JSON
2. Export it using the Export modal
3. Save the JSON to `tests/fixtures/your-fixture-name.json`
4. Ensure it includes:
   - `version: 1`
   - `title`: Descriptive name
   - `createdAt`/`updatedAt`: Unix timestamps
   - Proper node/edge structure

Example minimal fixture:
```json
{
  "id": "test-my-fixture",
  "version": 1,
  "title": "My Test Fixture",
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000,
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "ui": {
    "labelMode": "hover",
    "theme": "light",
    "gridSnap": false,
    "hasRunInitialAutoLayout": false
  },
  "nodes": {},
  "edges": {},
  "frames": {},
  "notes": {}
}
```

## Test Helpers

The `tests/helpers.ts` file provides utilities for common operations:

### Importing Fixtures

```typescript
import { importFixture } from "./helpers";

// In your test:
await importFixture(page, "simple-flow");
```

This will:
1. Click the import button
2. Paste the fixture JSON into the textarea
3. Click import
4. Wait for navigation to the new diagram

### Exporting Diagrams

```typescript
import { exportDiagram } from "./helpers";

const json = await exportDiagram(page);
const diagram = JSON.parse(json);
```

### Canvas Operations

```typescript
import {
  waitForCanvas,
  getNodeCount,
  getEdgeCount,
  createNodeAt,
  selectNode,
  deleteSelected,
  autoLayout,
  zoomToFit,
} from "./helpers";

// Wait for canvas to be ready
await waitForCanvas(page);

// Count elements
const nodes = await getNodeCount(page);
const edges = await getEdgeCount(page);

// Create a node at position
await createNodeAt(page, 300, 200);

// Select and delete
await selectNode(page, "stock-1");
await deleteSelected(page);

// Layout operations
await autoLayout(page);
await zoomToFit(page);
```

### Settings Operations

```typescript
import { openSettings, closeSettings, setLabelMode } from "./helpers";

await openSettings(page);
await setLabelMode(page, "always");
await closeSettings(page);
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { importFixture, waitForCanvas, getNodeCount } from "./helpers";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForCanvas(page);
  });

  test("should do something", async ({ page }) => {
    // Arrange
    await importFixture(page, "simple-flow");

    // Act
    // ... perform actions

    // Assert
    expect(await getNodeCount(page)).toBe(2);
  });
});
```

### Test IDs

The app uses `data-testid` attributes for reliable element selection:

| Element | Test ID |
|---------|---------|
| Import button | `import-button` |
| Import modal | `import-modal` |
| Import paste textarea | `import-paste-textarea` |
| Import dropzone | `import-dropzone` |
| Import file input | `import-file-input` |
| Import confirm | `import-confirm-paste` |
| Import error | `import-error` |
| Export button | `export-button` |
| Export modal | `export-modal` |
| Export JSON textarea | `export-json-textarea` |
| Export copy button | `export-copy-button` |
| Export download button | `export-download-button` |

### Node/Edge Selection

Nodes and edges have `data-node-id` and `data-edge-id` attributes:

```typescript
// Select by ID
await page.click('[data-node-id="stock-1"]');
await page.click('[data-edge-id="flow-1"]');

// Count all nodes/edges
const nodeCount = await page.locator("[data-node-id]").count();
const edgeCount = await page.locator("[data-edge-id]").count();
```

## Best Practices

1. **Use fixtures for complex states**: Don't manually create complex diagrams in tests - import them
2. **Wait for canvas**: Always call `waitForCanvas()` before interacting with the diagram
3. **Test one thing per test**: Keep tests focused on a single behavior
4. **Use descriptive names**: Test names should describe the expected behavior
5. **Clean up state**: Each test should start fresh (tests are isolated)

## Debugging Failed Tests

1. **Use headed mode**: `bun run test:headed` shows the browser
2. **Use UI mode**: `bun run test:ui` provides interactive debugging
3. **Add screenshots**: Playwright captures on failure automatically
4. **Check traces**: Run `npx playwright show-report` after tests

## CI Integration

For CI environments:
- Set `CI=true` environment variable
- Tests will run headless with retries
- Use `bun test` for standard CI runs

```yaml
# Example GitHub Actions
- name: Run tests
  run: bun test
  env:
    CI: true
```
