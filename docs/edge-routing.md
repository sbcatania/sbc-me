# Edge Routing System

> **Last Updated:** 2026-01-04
> **Location:** `/lib/layout/geometry.ts`

This document describes how edges (flows/arrows) are routed between nodes (stocks) in the System Builder diagram editor.

---

## Original Design Intent

These were the guiding requirements that shaped the system:

> "An arrow should never go beneath its stock at any point. It should always have to weave or go around."

> "When possible try to have all the arrows going into a flow go in on the same side and all the arrows coming out of a flow go out on the opposite side."

> "It should be impossible to have an arrow going in or out of any position besides the midpoint of that edge."

> "Prioritize having input and output flows coming out of different sides of the stock if possible and ideally opposite sides. You can figure out which side to prioritize based on if there are more things going in or out."

---

## Core Principles

### 1. Midpoint Connection Only

All edges connect at the **exact center** of a node's side. No offsets or distribution along the side.

```
        ┌─────────────────┐
        │                 │
  ●─────●     Stock       ●─────●
        │                 │
        └────────●────────┘
             │
             ●

  ● = Valid connection point (midpoint only)
```

### 2. Edges Never Pass Through Their Own Nodes

An edge from Stock A to Stock B must never visually intersect Stock A or Stock B.

```
  BAD:                          GOOD:

  ┌───────┐                     ┌───────┐
  │ Stock │────┐                │ Stock │
  │   A   │    │                │   A   │──────┐
  └───────┘    │                └───────┘      │
       ╳ passes through               ╲       │
               │                       ╲      │
          ┌────┴──┐                 ┌───╲─────┴┐
          │ Stock │                 │ Stock    │
          │   B   │                 │   B      │
          └───────┘                 └──────────┘
```

### 3. Outward-First Curve Direction

Edges initially travel **away** from their source node before curving toward the target.

```
  Side exit directions:

           ↑ (top exits upward first)
           │
      ←────┼────→
      left │ right
           │
           ↓ (bottom exits downward first)
```

### 4. Separate In/Out Sides Per Node

Each node has a designated side for incoming edges and a different side for outgoing edges.

```
  Opposite side pairs:

  ┌─────────────────┐        ┌─────────────────┐
  │                 │        │        ↑        │
  │←── IN    OUT ──→│   OR   │       IN        │
  │                 │        │       OUT       │
  └─────────────────┘        │        ↓        │
     left/right pair         └─────────────────┘
                                top/bottom pair
```

---

## Algorithm Overview

### Phase 1: Group Edges by Node

```typescript
incomingByNode[nodeId] = edges where node is the target
outgoingByNode[nodeId] = edges where node is the source
```

### Phase 2: Assign Sides for Each Node

For each node, determine:
- `inSide`: Which side ALL incoming edges will enter
- `outSide`: Which side ALL outgoing edges will exit

**Rules:**
1. If only incoming edges: `inSide` faces average source position, `outSide` = opposite
2. If only outgoing edges: `outSide` faces average target position, `inSide` = opposite
3. If both: Use natural sides if different, otherwise score opposite pairs

**Majority Wins:**
- If more outgoing than incoming: outgoing gets optimal placement
- If more incoming than outgoing: incoming gets optimal placement

### Phase 3: Route Each Edge

```typescript
sourceSide = sourceNode's assigned outSide
targetSide = targetNode's assigned inSide
```

Calculate bezier control points that:
- Start by going outward from sourceSide
- End by approaching from targetSide direction

### Phase 4: Validate & Fallback

If the calculated curve passes through source or target node:
1. First try pushing control points further out
2. If still colliding, fall back to per-edge best-sides calculation

---

## Side Pair Scoring

When both in and out want the same side, score all opposite pairs:

```
Pairs: [left, right], [right, left], [top, bottom], [bottom, top]

For each pair (inSide, outSide):
  +30 for each incoming edge where inSide faces the source
  -10 for each incoming edge where inSide faces away
  +30 for each outgoing edge where outSide faces the target
  -10 for each outgoing edge where outSide faces away
  +20 if horizontal pair and connections spread horizontally
  +20 if vertical pair and connections spread vertically
```

---

## Bezier Curve Generation

### Control Point Calculation

```typescript
// Distance-based control point offset
controlDist = clamp(distance * 0.4, 40, 150)

// Control points pushed outward from endpoints
c1 = start + outwardDirection(sourceSide) * controlDist
c2 = end + outwardDirection(targetSide) * controlDist
```

### Collision Detection

Sample the bezier curve at 20 points. If any point falls inside a node (with padding), the curve collides.

```typescript
function bezierIntersectsRect(start, c1, c2, end, rect, padding): boolean
```

### Collision Resolution

If collision detected, push control points further out (1.5x, 2x, 2.5x multipliers).

---

## Key Functions

| Function | Purpose |
|----------|---------|
| `calculateAllEdgeEndpoints()` | Main entry point, returns all edge routes |
| `assignNodeSides()` | Determines in/out sides for a node |
| `scoreSidePair()` | Scores an opposite pair for side assignment |
| `getSafeControlPoints()` | Generates collision-free bezier control points |
| `bezierIntersectsRect()` | Checks if curve passes through a rectangle |
| `findBestSides()` | Per-edge fallback when node assignment fails |
| `getOppositeSide()` | Returns opposite side (top↔bottom, left↔right) |
| `getOutwardDirection()` | Returns direction vector for a side |

---

## Data Structures

### EdgeRoute

```typescript
interface EdgeRoute {
  start: Point;      // Connection point on source node
  end: Point;        // Connection point on target node
  c1: Point;         // First bezier control point
  c2: Point;         // Second bezier control point
  sourceSide: Side;  // Which side of source node
  targetSide: Side;  // Which side of target node
}
```

### Side

```typescript
type Side = "top" | "right" | "bottom" | "left"
```

---

## Known Edge Cases

### All Connections in Same Direction

When all of a node's connections (both in and out) are in the same geometric direction, using opposite sides would cause curves to pass through the node itself.

```
  Problem scenario:

      [A]     [B]      ← sources above
        ╲     ╱
         ╲   ╱
    ┌─────┴─┴─────┐
    │      X      │   ← if out=bottom, edge to C would
    └─────────────┘     exit down then curve UP through X
          │
         [C]           ← target also conceptually "related" via flow
```

**Solution:** The fallback routing kicks in and finds a safe path even if it means in/out don't use strictly opposite sides.

---

## Rendering

Edge rendering is handled by `/components/editor/EdgeFlow.tsx`:

- Receives pre-calculated `EdgeRoute` from `calculateAllEdgeEndpoints()`
- Renders animated dotted bezier path using SVG `<path>` with cubic bezier
- Arrowhead rotated to match curve tangent at endpoint
- Label positioned at curve midpoint (t=0.5)

---

## Changelog

### 2026-01-04
- Initial implementation
- Node-level side assignment with in/out separation
- Opposite side preference with majority priority
- Bezier collision detection and resolution
- Fallback routing for edge cases
