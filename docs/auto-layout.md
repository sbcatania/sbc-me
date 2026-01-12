# Auto-Layout System

> **Last Updated:** 2026-01-11 (v5 - Compact Spring-Electrical Model)
> **Location:** `/lib/layout/autolayout.ts`

---

## Core Philosophy: Proximity = Connection

The fundamental principle: **connected nodes should be close together, unconnected nodes should be far apart.**

This is achieved through a **spring-electrical model** (force-directed layout) with deterministic initialization.

---

## Why Not Layer-Based Layout?

Traditional hierarchical layout (Sugiyama algorithm, dagre, ELK) assigns nodes to "layers" based on depth from sources. This works well for strict DAGs but **breaks down** for graphs where:

1. **Many nodes are both sources AND sinks** — They receive inputs AND produce outputs
2. **Cycles exist** — Feedback loops create awkward SCC groupings
3. **The graph has no clear hierarchy** — Multiple valid "flow directions"

### The Problem with Layer-Based Approaches

Layer-based algorithms collapse strongly connected components (cycles) into single nodes, then spread all nodes in a layer horizontally. This creates:
- **Extreme horizontal sprawl** when many nodes have similar depth
- **Loss of feedback structure** — cycles appear as horizontal clusters
- **Long crossing edges** when "depth" doesn't match visual proximity

---

## The Spring-Electrical Model

Inspired by [Fruchterman-Reingold](https://en.wikipedia.org/wiki/Force-directed_graph_drawing) and [Graphviz neato/fdp](https://graphviz.org/docs/layouts/).

### Core Forces

1. **Attraction (Springs)**: Connected nodes attract each other
   - Force ∝ distance² / k
   - Pulls neighbors closer together

2. **Repulsion (Electrical)**: All nodes repel each other
   - Force ∝ k² / distance
   - Prevents overlapping, spreads layout

3. **Flow Bias**: Edges prefer to point downward (top-to-bottom flow)
   - Gentle vertical offset based on edge direction
   - Maintains readability without strict layering

### Why This Works Better

- **Cycles become visible**: Nodes in a cycle stay close but arrange naturally
- **Connected clusters form**: Groups of interconnected nodes cluster together
- **Edge lengths equalize**: Most edges end up similar length
- **No arbitrary layering**: Position is based on actual connections

---

## Algorithm Phases

### Phase 1: Initialization (Deterministic)

Position nodes using a hash of their IDs:
```
x = hash(nodeId) * width
y = hash(nodeId) * height
```

This ensures:
- Same input → same output (determinism)
- Spread initial positions to avoid local minima

### Phase 2: Force Simulation

For a fixed number of iterations:
```
for each node:
    total_force = (0, 0)

    # Repulsion from all other nodes
    for each other_node:
        force = repulsion(node, other_node)
        total_force += force

    # Attraction to connected nodes
    for each neighbor:
        force = attraction(node, neighbor)
        total_force += force

    # Flow bias for edges
    for each outgoing edge:
        total_force.y += FLOW_BIAS
    for each incoming edge:
        total_force.y -= FLOW_BIAS

    # Apply with cooling
    node.position += total_force * temperature

temperature *= COOLING_RATE
```

### Phase 3: Centering

Center the layout around origin (0, 0).

### Phase 4: Overlap Resolution (Optional)

If nodes overlap, apply small repulsive adjustments.

---

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `ITERATIONS` | 150 | Number of simulation steps |
| `OPTIMAL_DISTANCE` | 100 | Ideal distance between connected nodes (Dagre: 50, Graphviz: ~72) |
| `REPULSION_STRENGTH` | 2500 | How strongly nodes repel each other |
| `ATTRACTION_STRENGTH` | 0.1 | How strongly edges pull nodes together |
| `FLOW_BIAS` | 5 | Downward force for edge direction |
| `INITIAL_TEMPERATURE` | 100 | Starting movement magnitude |
| `COOLING_RATE` | 0.95 | Temperature decay per iteration |
| `MIN_DISTANCE` | 40 | Minimum distance between node centers |
| `INITIAL_SPREAD` | 250 | Starting spread for node positions |
| `COMPONENT_SPACING` | 100 | Gap between disconnected components |

---

## Determinism

The algorithm is fully deterministic:

1. **Initial positions**: Derived from node ID hash
2. **Iteration count**: Fixed, not convergence-based
3. **Processing order**: Nodes sorted by ID before each pass

Same graph → same layout, every time.

---

## Comparison with Previous Approaches

| Aspect | v3 (Layer-Based) | v4 (Spring-Electrical) |
|--------|------------------|------------------------|
| Cycles | Collapsed to single layer | Natural positioning |
| Edge length | Varies wildly | Roughly uniform |
| Compactness | Grid-wrapped layers | Organic clustering |
| Flow direction | Strict top-to-bottom | Gentle preference |
| Crossings | Barycenter heuristic | Naturally minimized |

---

## References

- [Force-Directed Graph Drawing](https://en.wikipedia.org/wiki/Force-directed_graph_drawing)
- [Graphviz Layout Engines](https://graphviz.org/docs/layouts/)
- [Dagre.js Algorithm](https://github.com/dagrejs/dagre/wiki)
- [ELK Layered Algorithm](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html)
- [Fruchterman-Reingold Algorithm](https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/force-directed.pdf)
- [Stress Majorization for Graph Layout](https://www.graphviz.org/documentation/GKN04.pdf)

---

## Changelog

### v5 (2026-01-11)
- **Compact layout tuning**: Significantly tighter spacing based on research
- Reduced `OPTIMAL_DISTANCE` from 180 → 100 (informed by Dagre 50px, Graphviz ~72px defaults)
- Reduced `REPULSION_STRENGTH` from 10000 → 2500 (better attraction/repulsion balance)
- Reduced `INITIAL_SPREAD` from 500 → 250 (tighter starting positions)
- Increased `ITERATIONS` from 100 → 150 (better convergence)
- Reduced `COMPONENT_SPACING` from 200 → 100

### v4 (2026-01-11)
- **Complete rewrite**: Spring-electrical model instead of layer-based
- Nodes position based on connectivity, not depth
- Natural handling of cycles and bidirectional edges
- Deterministic via node ID hashing

### v3 (2026-01-11)
- Grid wrapping within layers
- Still had issues with cycles and bidirectional edges

### v2 (2026-01-11)
- Top-to-bottom flow with horizontal spreading
- Extreme horizontal sprawl for wide graphs

### v1 (2026-01-11)
- Initial hierarchical approach
