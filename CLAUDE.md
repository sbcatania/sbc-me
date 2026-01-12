# System Builder V1

A local-first, beautiful systems diagram editor with stocks and flows, Muse-like drill-down navigation, auto-layout with circular cycle support, and import/export capabilities.

## Documentation Index

**Always read relevant docs before making changes.** Create new docs when implementing complex features.

| Document | Purpose | When to Read/Update |
|----------|---------|---------------------|
| `/docs/edge-routing.md` | Edge/flow connection logic, bezier curves, collision avoidance | Modifying edge rendering, fixing connection bugs |
| `/docs/testing.md` | Playwright test suite, fixtures, helpers | Running tests, adding test cases |
| `CLAUDE.md` (this file) | Project overview, architecture, constraints | Starting work, major changes |

### Development Workflow

**IMPORTANT**: This project requires E2E testing of all changes:

1. **Always E2E test changes**: Before considering any change complete, verify it works in the browser
2. **Use Playwright for automated testing**: Run `npx playwright test` to execute the full test suite
3. **Manual verification**: After making UI changes, navigate to `http://localhost:$CONDUCTOR_PORT` (or `http://localhost:4000` outside Conductor) and test the feature
4. **Test edge cases**: Try different inputs, long text, special characters, etc.

**Port Configuration**: When running in Conductor, the dev server and tests automatically use `CONDUCTOR_PORT` environment variable. Outside Conductor, port 4000 is used as fallback.

### Documentation Workflow

**IMPORTANT**: This project uses a self-documenting approach:

1. **Before implementing complex features**: Check if relevant docs exist
2. **During implementation**: Update docs with decisions and changes
3. **After implementation**: Create new docs for complex systems
4. **When debugging**: Document edge cases and solutions found

Create new docs liberally in `/docs/` for:
- Complex algorithms or logic
- Non-obvious architectural decisions
- Features with multiple interacting parts
- Anything that took significant debugging

## V1 Scope

### Implemented Features

- **Stocks and Flows**: Create and edit stock nodes and flow edges on an infinite canvas
- **Local-first Persistence**: Multiple diagrams stored locally as JSON via IndexedDB
- **Muse-like Drill-down**: Stocks can link to sub-diagrams with breadcrumb navigation
- **Auto-layout**: Deterministic layout with circular formations for cycles (SCC detection)
- **Visual Design**: Minimal, gritty black/white style with sharp edges and subtle grid
- **Curved Edges**: Bezier curves with animated flow direction indicators
- **Settings**: Label visibility mode, theme/font preferences, grid toggle
- **Import/Export**: Modal-based import (drag/drop, file select, paste) and export (copy, download)

### Non-goals (Out of Scope for V1)

- No simulation, unit checking, formulas, or metrics computation
- No accounts/login, collaboration, or server persistence
- No public sharing links
- No full ontology mode UI (data model supports future expansion)

## Testing

### Running Tests

```bash
# Run all tests (starts dev server automatically on CONDUCTOR_PORT or 4000)
npx playwright test

# Interactive UI mode (recommended for debugging)
npx playwright test --ui

# Run with visible browser
npx playwright test --headed

# Debug mode with step-through
npx playwright test --debug

# List all tests without running
npx playwright test --list
```

**Note**: The test server automatically uses `CONDUCTOR_PORT` when running in Conductor, falling back to port 4000 otherwise. This ensures tests work correctly in parallel Conductor workspaces.

### Test Fixtures

Test fixtures in `/tests/fixtures/` are JSON diagrams for different scenarios:

| Fixture | Use Case |
|---------|----------|
| `empty-diagram` | Empty canvas baseline |
| `single-stock` | Single node operations |
| `simple-flow` | Basic edge/flow testing |
| `linear-chain` | Sequential node layouts |
| `cycle` | Feedback loop / SCC testing |
| `complex-system` | Multi-node, multi-edge scenarios |
| `hub-node` | Node with many in/out edges (edge routing stress test) |

### Adding Test Fixtures

1. Create diagram in app or write JSON manually
2. Export via Export modal
3. Save to `tests/fixtures/your-fixture.json`
4. Use in tests: `await importFixture(page, "your-fixture")`

See `/docs/testing.md` for full testing documentation.

## Data Model

The data model is designed for future extensibility:

### Reserved Fields for Future Use

#### Edge Types
- `edge.kind`: Currently "flow", reserved for "influence" and "relationship"
- `edge.relationshipType`: Reserved for ontology mode
- `edge.attributes`: Generic key-value store for custom metadata

#### Node Ontology
- `node.ontology.entityType`: e.g., "BugBacklog", "Employee"
- `node.ontology.description`: Human-readable description
- `node.attributes`: Generic key-value store for custom metadata

#### Future "Flow-as-Node" Promotion
Edge IDs are stable and first-class, enabling future promotion of flows to nodes for more complex modeling scenarios.

## Planned Future Features (Do Not Implement Now)

1. **Sharing & Collaboration**
   - Server persistence with accounts
   - Public sharing links
   - Real-time collaboration

2. **Ontology Mode**
   - Alternate renderer showing entity relationships
   - Type constraints and validation
   - Schema definition UI

3. **Simulation Mode**
   - Rates, quality, throughput calculations
   - Time-based simulation
   - Formula editor

4. **Metrics Overlays**
   - Visual indicators on edges/nodes
   - Data binding to external sources
   - Dashboard views

## Engineering Constraints

### Layout
- Prefer deterministic layout algorithms
- No continuous force layout in V1
- SCC detection with circular arrangement for cycles
- Layered DAG layout for overall structure

### Edge Routing
Edge routing is complex and has its own documentation. **Always consult and update** `/docs/edge-routing.md` when:
- Modifying edge/flow rendering logic
- Changing how edges connect to nodes
- Updating bezier curve calculations
- Fixing edge collision or overlap issues

Key principles (see docs for full spec):
- Edges connect at exact midpoint of node sides only
- Edges never pass through their source or target nodes
- Each node has separate sides for incoming vs outgoing edges
- Curves travel outward first before curving to target

### Accessibility
- Respect `prefers-reduced-motion`
- Disable edge animations when reduced motion preferred
- Keep transitions lightweight

### Visual Style
- Sharp edges (`rounded-none` by default)
- Monochrome palette (black/white)
- Subtle grid background
- Crisp typography

### Undo/Redo Requirements

**IMPORTANT**: All user actions that modify data must be undoable:

1. **Every destructive action must be undoable** - Never use confirmation dialogs for delete operations. Instead, make the action reversible via undo (⌘Z).

2. **Actions that require undo/redo support**:
   - Node creation, deletion, and modification
   - Edge creation, deletion, and modification
   - Label changes
   - Position changes (drag operations)
   - Property value changes
   - Selection changes (for multi-select operations)

3. **Implementation pattern**:
   - Store previous state before modification
   - Push to undo stack
   - Clear redo stack on new action
   - Redo pops from redo stack, pushes to undo

4. **Testing requirements**:
   - Write E2E tests for undo/redo of each action type
   - Test that redo works after undo
   - Test that new actions clear redo stack
   - Test undo/redo across persistence (state should survive page reload)

### Performance
- Target smooth interaction at 50-100 nodes
- SVG rendering for V1 (sufficient for target scale)
- Debounced persistence (500ms)

## Project Structure

```
/app
  /page.tsx                     # Home - redirects to default diagram
  /d/[id]/page.tsx              # Diagram editor page
  /layout.tsx

/components
  /editor
    Canvas.tsx                  # Main SVG canvas with viewport
    NodeStock.tsx               # Stock node component
    EdgeFlow.tsx                # Flow edge component
    SelectionRect.tsx           # Selection rectangle
    InlineTextEdit.tsx          # Inline text editing
    Breadcrumb.tsx              # Drill-down breadcrumb
    TopBar.tsx                  # Top toolbar
    SettingsPanel.tsx           # Settings drawer
    ImportModal.tsx             # Import dialog (drag/drop, paste, file)
    ExportModal.tsx             # Export dialog (copy, download)
    QuickAddMenu.tsx            # Cmd+K quick add
    SearchPanel.tsx             # Cmd+F search
  /ui                           # shadcn/ui components

/lib
  /model
    schema.ts                   # Zod schemas
    ids.ts                      # ID generators
  /store
    diagrams.ts                 # Diagram state & persistence
    prefs.ts                    # User preferences
  /layout
    autolayout.ts               # SCC + DAG layout
    geometry.ts                 # Edge snapping, bezier math
  /utils.ts                     # Utility functions

/tests
  /fixtures/                    # Test scenario JSON files
  helpers.ts                    # Playwright test utilities
  *.spec.ts                     # Test files

/docs
  edge-routing.md               # Edge routing algorithm spec
  testing.md                    # Testing documentation
```

## Import/Export

### Import Modal
- **Paste JSON**: Paste directly into the textarea at the top
- **Drag & drop**: Drop JSON file onto the dropzone below
- **File select**: Click the dropzone to select a file

### Export Modal
- **Copy**: Click copy button to copy JSON to clipboard
- **Download**: Click download button to save as file

### Test IDs for Automation
| Element | `data-testid` |
|---------|---------------|
| Import button | `import-button` |
| Import modal | `import-modal` |
| Import paste textarea | `import-paste-textarea` |
| Import dropzone | `import-dropzone` |
| Import confirm | `import-confirm-paste` |
| Import error | `import-error` |
| Export button | `export-button` |
| Export modal | `export-modal` |
| Export textarea | `export-json-textarea` |
| Export copy | `export-copy-button` |
| Export download | `export-download-button` |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create stock | Double-click canvas |
| Create flow | Drag from node handle |
| Pan canvas | Space + Drag |
| Delete selected | Backspace / Delete |
| Undo | ⌘Z |
| Redo | ⌘⇧Z |
| Select all | ⌘A |
| Search | ⌘F |
| Quick add | ⌘K |
| Toggle sidebar | ⌘/ |
| New system | ⇧⌘N |
| System tab | ⌘1 |
| Database tab | ⌘2 |

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run on specific port
bun run dev -- -p 4000

# Build for production
bun run build

# Run tests (Playwright E2E)
npx playwright test
```

## Data Storage

- **IndexedDB Keys**:
  - `diagrams:index`: List of diagram metadata
  - `diagram:<id>`: Full diagram JSON
  - `prefs`: User preferences JSON

- **Auto-save**: Changes are debounced and saved after 500ms of inactivity
