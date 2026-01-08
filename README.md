# System Builder

A local-first systems diagram editor for creating stocks and flows diagrams with an infinite canvas.

## Features

- **Stocks and Flows**: Create stock nodes and connect them with flow edges
- **Infinite Canvas**: Pan, zoom, and navigate freely
- **Local-first**: All data stored locally via IndexedDB - no server required
- **Auto-layout**: Automatic graph layout with circular arrangement for cycles
- **Smart Edge Routing**: Bezier curves with collision avoidance
- **Import/Export**: Paste JSON directly or drag & drop files
- **Keyboard Shortcuts**: Full keyboard navigation support

## Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Open http://localhost:3000
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create stock | Double-click canvas |
| Create flow | Drag from node handle |
| Pan canvas | Space + Drag |
| Delete selected | Backspace |
| Undo | ⌘Z |
| Redo | ⌘⇧Z |
| Select all | ⌘A |

## Testing

```bash
# Run all tests
bun test

# Interactive UI mode
bun run test:ui

# Run with visible browser
bun run test:headed
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS, Radix UI
- **State**: Zustand with IndexedDB persistence
- **Validation**: Zod schemas
- **Testing**: Playwright

## Project Structure

```
app/                    # Next.js app router pages
components/editor/      # Canvas, nodes, edges, modals
lib/
  layout/              # Auto-layout algorithms
  model/               # Zod schemas
  store/               # Zustand stores
tests/
  fixtures/            # Test scenario JSON files
docs/                  # Technical documentation
```

## Documentation

- `CLAUDE.md` - Project overview and engineering constraints
- `docs/edge-routing.md` - Edge routing algorithm specification
- `docs/testing.md` - Testing guide and fixtures

## License

MIT
