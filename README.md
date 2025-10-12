# Sam Catania — Life as a System

An interactive visualization of life as a system of stocks and flows, with objectives overlaying subsets of the system and artifacts attached to specific stocks/objectives.

## Features

- 📊 **Interactive Graph Visualization** - SVG-based rendering with ELK auto-layout
- 🎯 **Objectives Overlay** - View how different life areas relate to goals
- ⚡ **Real-time Drift Animation** - Values gently fluctuate to show system dynamics
- 🎚️ **Adjustable Valves** - Drag flow controls to see how system changes propagate
- ⏱️ **Time Travel** - Scrub through snapshots to see different eras
- ♿ **Fully Accessible** - Keyboard navigation, ARIA labels, reduced-motion support
- 🎨 **Minimalist Design** - Pure black & white aesthetic

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
  layout.tsx, page.tsx           # Next.js app router
  (components)/                   # All React components
    Canvas.tsx                    # Pan/zoom container
    GraphView.tsx                 # Main graph orchestrator
    StocksLayer.tsx              # Node rendering with drift animation
    FlowsLayer.tsx               # Edge rendering with chevrons
    ValvesLayer.tsx              # Adjustable flow controls
    ObjectivesChips.tsx          # Top-right objective list
    ObjectiveSpotlightOverlay.tsx # Hover spotlight effect
    ParticlesLayer.tsx           # Pixi.js particle effects
    RightDrawer.tsx              # Details panel
    Timebar.tsx                  # Snapshot timeline
    CursorOverlay.tsx            # Custom pixelated cursor

lib/
  domain/                         # Core types and data logic
    types.ts                      # TypeScript definitions
    normalize.ts                  # Value → display size mapping
    merge.ts                      # Data merging & snapshot application
  layout/                         # Graph layout
    elk.ts                        # ELK integration
    buildGraph.ts                 # Graph construction
  anim/                           # Animation systems
    ticker.ts                     # Drift animation logic
    particles.ts                  # Flow particle system
  a11y/                           # Accessibility
    aria.ts                       # ARIA label helpers
  util/                           # Utilities
    format.ts                     # Value formatting
    math.ts                       # Math helpers
  state/                          # State management
    store.ts                      # Zustand store
    selectors.ts                  # Derived state
  io/                             # Data loading
    load.ts                       # Fetch & merge data

public/data/
  seed.json                       # Required: baseline data
  synced.json                     # Optional: Notion-synced data

scripts/
  notion-pull.ts                  # Optional: Notion integration
```

## Data Format

The app loads data from `/public/data/seed.json` (required) and optionally merges `/public/data/synced.json` if present.

See `docs/spec.md` for full data schema and examples.

## Key Interactions

- **Pan**: Drag on empty canvas
- **Zoom**: Ctrl/Cmd + scroll, or trackpad pinch (clamped to 0.5-3.0x)
- **Select Node/Objective**: Click to open detail drawer
- **Adjust Valve**: Drag circular handles on flows horizontally
- **Time Scrub**: Use bottom timeline or arrow keys (Left/Right)
- **Reset**: Click "Reset" button to restore all valve positions
- **Theme**: Click "Light/Dark" to toggle color scheme
- **Keyboard**: Tab to cycle focus, Enter to open, Esc to close

## Tech Stack

- **Next.js 14** - App Router
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Zustand + Immer** - State management
- **ELK.js** - Graph auto-layout
- **Pixi.js** - Canvas particles (optional, disabled in reduced-motion)
- **Framer Motion** - UI transitions
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component primitives

## Development Guidelines

See `.cursor/cursor_rules.md` for full development rules and `docs/spec.md` for the complete specification.

Key principles:
- Pure black & white design
- No mutations of canonical data
- Accessibility first
- Performance: layout < 50ms for 50 nodes
- Respect `prefers-reduced-motion`

## License

Private - Sam Catania
Personal website
