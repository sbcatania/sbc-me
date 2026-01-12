import { Node, Edge } from "@/lib/model/schema";

// ============================================================================
// CONFIGURATION
// ============================================================================
// v4: Spring-electrical model (force-directed layout)
// See /docs/auto-layout.md for principles

// Exported type for config tuning UI
export interface LayoutConfig {
  ITERATIONS: number;
  OPTIMAL_DISTANCE: number;
  REPULSION_STRENGTH: number;
  ATTRACTION_STRENGTH: number;
  FLOW_BIAS: number;
  INITIAL_TEMPERATURE: number;
  COOLING_RATE: number;
  MIN_DISTANCE: number;
  INITIAL_SPREAD: number;
  COMPONENT_SPACING: number;
  HORIZONTAL_STRETCH: number;
}

const LAYOUT_CONFIG: LayoutConfig = {
  // Number of simulation iterations
  ITERATIONS: 150,
  // Ideal distance between connected nodes (very tight)
  OPTIMAL_DISTANCE: 36,
  // How strongly nodes repel each other
  REPULSION_STRENGTH: 1000,
  // How strongly edges pull nodes together (low for looser clustering)
  ATTRACTION_STRENGTH: 0.02,
  // Downward force for edge direction (high for strong top-to-bottom flow)
  FLOW_BIAS: 20,
  // Starting movement magnitude
  INITIAL_TEMPERATURE: 80,
  // Temperature decay per iteration
  COOLING_RATE: 0.95,
  // Minimum distance between node centers (very close allowed)
  MIN_DISTANCE: 10,
  // Initial spread for node placement
  INITIAL_SPREAD: 150,
  // Spacing between disconnected components
  COMPONENT_SPACING: 50,
  // Horizontal stretch factor (wide layout)
  HORIZONTAL_STRETCH: 2,
};

// Mutable config for tuning UI
let activeConfig: LayoutConfig = { ...LAYOUT_CONFIG };

// ============================================================================
// TYPES
// ============================================================================

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutResult {
  nodes: Record<string, LayoutNode>;
}

interface Vector {
  x: number;
  y: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple deterministic hash function for strings.
 * Returns a value between 0 and 1.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Normalize to 0-1 range
  return (Math.abs(hash) % 10000) / 10000;
}

/**
 * Calculate distance between two points.
 */
function distance(p1: Vector, p2: Vector): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate unit vector from p1 to p2.
 */
function direction(p1: Vector, p2: Vector): Vector {
  const d = distance(p1, p2);
  if (d === 0) return { x: 0, y: 0 };
  return {
    x: (p2.x - p1.x) / d,
    y: (p2.y - p1.y) / d,
  };
}

/**
 * Find connected components (treating edges as undirected).
 */
function findConnectedComponents(
  nodeIds: string[],
  edges: Edge[]
): string[][] {
  if (nodeIds.length === 0) return [];

  const adjacency = new Map<string, Set<string>>();
  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, new Set());
  }
  for (const edge of edges) {
    if (adjacency.has(edge.sourceId) && adjacency.has(edge.targetId)) {
      adjacency.get(edge.sourceId)!.add(edge.targetId);
      adjacency.get(edge.targetId)!.add(edge.sourceId);
    }
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  const sortedNodeIds = [...nodeIds].sort();
  for (const startNode of sortedNodeIds) {
    if (visited.has(startNode)) continue;

    const component: string[] = [];
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const node = queue.shift()!;
      component.push(node);

      const neighbors = [...adjacency.get(node)!].sort();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    component.sort();
    components.push(component);
  }

  return components;
}

/**
 * Separate isolated nodes (no connections) from connected nodes.
 */
function separateIsolatedNodes(
  nodeIds: string[],
  edges: Edge[]
): { connected: string[]; isolated: string[] } {
  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.sourceId);
    connectedNodes.add(edge.targetId);
  }

  const connected: string[] = [];
  const isolated: string[] = [];

  for (const nodeId of nodeIds) {
    if (connectedNodes.has(nodeId)) {
      connected.push(nodeId);
    } else {
      isolated.push(nodeId);
    }
  }

  connected.sort();
  isolated.sort();

  return { connected, isolated };
}

// ============================================================================
// SPRING-ELECTRICAL MODEL
// ============================================================================

/**
 * Initialize node positions deterministically using node ID hashes.
 */
function initializePositions(
  nodeIds: string[],
  spread: number
): Map<string, Vector> {
  const positions = new Map<string, Vector>();

  // Sort for determinism
  const sorted = [...nodeIds].sort();

  for (const nodeId of sorted) {
    // Use two different hash seeds for x and y
    const hashX = hashString(nodeId + "_x");
    const hashY = hashString(nodeId + "_y");

    positions.set(nodeId, {
      x: (hashX - 0.5) * spread,
      y: (hashY - 0.5) * spread,
    });
  }

  return positions;
}

/**
 * Calculate repulsion force between two nodes.
 * F_repulsion ∝ k² / distance
 */
function calculateRepulsion(
  p1: Vector,
  p2: Vector,
  k: number
): Vector {
  const d = Math.max(distance(p1, p2), activeConfig.MIN_DISTANCE);
  const dir = direction(p2, p1); // Repulsion pushes p1 away from p2

  const magnitude = (k * k) / d;

  return {
    x: dir.x * magnitude,
    y: dir.y * magnitude,
  };
}

/**
 * Calculate attraction force between connected nodes.
 * F_attraction ∝ distance² / k
 */
function calculateAttraction(
  p1: Vector,
  p2: Vector,
  k: number,
  strength: number
): Vector {
  const d = distance(p1, p2);
  const dir = direction(p1, p2); // Attraction pulls p1 toward p2

  const magnitude = (d * d / k) * strength;

  return {
    x: dir.x * magnitude,
    y: dir.y * magnitude,
  };
}

/**
 * Run the spring-electrical simulation for a connected component.
 */
function simulateComponent(
  nodeIds: string[],
  edges: Edge[],
  nodes: Record<string, Node>
): Map<string, Vector> {
  if (nodeIds.length === 0) {
    return new Map();
  }

  if (nodeIds.length === 1) {
    const positions = new Map<string, Vector>();
    positions.set(nodeIds[0], { x: 0, y: 0 });
    return positions;
  }

  // Filter edges to this component
  const nodeSet = new Set(nodeIds);
  const componentEdges = edges.filter(
    e => nodeSet.has(e.sourceId) && nodeSet.has(e.targetId)
  );

  // Build adjacency for quick neighbor lookup
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const nodeId of nodeIds) {
    outgoing.set(nodeId, []);
    incoming.set(nodeId, []);
  }
  for (const edge of componentEdges) {
    outgoing.get(edge.sourceId)!.push(edge.targetId);
    incoming.get(edge.targetId)!.push(edge.sourceId);
  }

  // Initialize positions
  const positions = initializePositions(nodeIds, activeConfig.INITIAL_SPREAD);

  // Simulation parameters
  const k = activeConfig.OPTIMAL_DISTANCE;
  let temperature = activeConfig.INITIAL_TEMPERATURE;

  // Sort node IDs for deterministic iteration order
  const sortedNodeIds = [...nodeIds].sort();

  // Run simulation
  for (let iter = 0; iter < activeConfig.ITERATIONS; iter++) {
    const forces = new Map<string, Vector>();

    // Initialize forces to zero
    for (const nodeId of sortedNodeIds) {
      forces.set(nodeId, { x: 0, y: 0 });
    }

    // Calculate repulsion forces (all pairs)
    for (let i = 0; i < sortedNodeIds.length; i++) {
      const nodeA = sortedNodeIds[i];
      const posA = positions.get(nodeA)!;
      const forceA = forces.get(nodeA)!;

      for (let j = i + 1; j < sortedNodeIds.length; j++) {
        const nodeB = sortedNodeIds[j];
        const posB = positions.get(nodeB)!;
        const forceB = forces.get(nodeB)!;

        const repulsion = calculateRepulsion(posA, posB, k);

        // Apply equal and opposite forces
        forceA.x += repulsion.x;
        forceA.y += repulsion.y;
        forceB.x -= repulsion.x;
        forceB.y -= repulsion.y;
      }
    }

    // Calculate attraction forces (connected pairs)
    for (const edge of componentEdges) {
      const posSource = positions.get(edge.sourceId)!;
      const posTarget = positions.get(edge.targetId)!;

      const attraction = calculateAttraction(
        posSource,
        posTarget,
        k,
        activeConfig.ATTRACTION_STRENGTH
      );

      const forceSource = forces.get(edge.sourceId)!;
      const forceTarget = forces.get(edge.targetId)!;

      // Source is pulled toward target
      forceSource.x += attraction.x;
      forceSource.y += attraction.y;

      // Target is pulled toward source
      forceTarget.x -= attraction.x;
      forceTarget.y -= attraction.y;
    }

    // Apply flow bias (edges prefer to point downward)
    for (const nodeId of sortedNodeIds) {
      const force = forces.get(nodeId)!;
      const outCount = outgoing.get(nodeId)!.length;
      const inCount = incoming.get(nodeId)!.length;

      // Nodes with more outgoing edges move up, more incoming move down
      force.y += (outCount - inCount) * activeConfig.FLOW_BIAS;
    }

    // Apply forces with cooling
    for (const nodeId of sortedNodeIds) {
      const pos = positions.get(nodeId)!;
      const force = forces.get(nodeId)!;

      // Calculate displacement magnitude
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);

      if (magnitude > 0) {
        // Limit displacement by temperature
        const displacement = Math.min(magnitude, temperature);
        const ratio = displacement / magnitude;

        pos.x += force.x * ratio;
        pos.y += force.y * ratio;
      }
    }

    // Cool down
    temperature *= activeConfig.COOLING_RATE;
  }

  return positions;
}

/**
 * Center positions around origin.
 */
function centerPositions(
  positions: Map<string, Vector>,
  nodes: Record<string, Node>
): void {
  if (positions.size === 0) return;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [nodeId, pos] of positions) {
    const node = nodes[nodeId];
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + node.width);
    maxY = Math.max(maxY, pos.y + node.height);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  for (const pos of positions.values()) {
    pos.x -= centerX;
    pos.y -= centerY;
  }
}

/**
 * Get bounding box of positions.
 */
function getBoundingBox(
  positions: Map<string, Vector>,
  nodes: Record<string, Node>
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [nodeId, pos] of positions) {
    const node = nodes[nodeId];
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + node.width);
    maxY = Math.max(maxY, pos.y + node.height);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Layout isolated nodes in a compact arrangement.
 */
function layoutIsolatedNodes(
  nodeIds: string[],
  nodes: Record<string, Node>,
  startY: number
): Map<string, Vector> {
  const positions = new Map<string, Vector>();

  if (nodeIds.length === 0) return positions;

  // Sort for determinism
  const sorted = [...nodeIds].sort();

  // Arrange in a grid pattern
  const cols = Math.ceil(Math.sqrt(sorted.length));
  let x = 0;
  let y = startY;
  let rowHeight = 0;
  let col = 0;

  for (const nodeId of sorted) {
    const node = nodes[nodeId];

    positions.set(nodeId, { x, y });

    rowHeight = Math.max(rowHeight, node.height);
    x += node.width + 60;
    col++;

    if (col >= cols) {
      col = 0;
      x = 0;
      y += rowHeight + 60;
      rowHeight = 0;
    }
  }

  return positions;
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Main auto-layout function using spring-electrical model.
 *
 * Core principle: Connected nodes should be close together,
 * unconnected nodes should be far apart.
 *
 * The algorithm uses:
 * - Attraction forces between connected nodes (springs)
 * - Repulsion forces between all nodes (electrical)
 * - Flow bias for edge direction (gentle downward preference)
 * - Deterministic initialization via node ID hashing
 */
export function autoLayout(
  nodes: Record<string, Node>,
  edges: Edge[],
  config?: Partial<LayoutConfig>
): LayoutResult {
  // Merge custom config with defaults
  activeConfig = { ...LAYOUT_CONFIG, ...config };
  const nodeIds = Object.keys(nodes);

  if (nodeIds.length === 0) {
    return { nodes: {} };
  }

  if (nodeIds.length === 1) {
    const nodeId = nodeIds[0];
    const node = nodes[nodeId];
    return {
      nodes: {
        [nodeId]: {
          id: nodeId,
          x: -node.width / 2,
          y: -node.height / 2,
          width: node.width,
          height: node.height,
        },
      },
    };
  }

  // Separate isolated nodes from connected nodes
  const { connected, isolated } = separateIsolatedNodes(nodeIds, edges);

  // Find connected components
  const components = findConnectedComponents(connected, edges);

  // Layout each component separately
  const componentPositions: Map<string, Vector>[] = [];
  const componentBounds: { width: number; height: number }[] = [];

  for (const component of components) {
    const positions = simulateComponent(component, edges, nodes);
    centerPositions(positions, nodes);

    const bounds = getBoundingBox(positions, nodes);
    componentPositions.push(positions);
    componentBounds.push({ width: bounds.width, height: bounds.height });
  }

  // Combine component layouts (stack vertically)
  const allPositions = new Map<string, Vector>();
  let currentY = 0;

  for (let i = 0; i < componentPositions.length; i++) {
    const positions = componentPositions[i];
    const bounds = componentBounds[i];

    // Get current component's bounds for proper offsetting
    const compBounds = getBoundingBox(positions, nodes);

    for (const [nodeId, pos] of positions) {
      allPositions.set(nodeId, {
        x: pos.x,
        y: pos.y - compBounds.minY + currentY,
      });
    }

    currentY += bounds.height + activeConfig.COMPONENT_SPACING;
  }

  // Layout isolated nodes below all components
  if (isolated.length > 0) {
    const isolatedPositions = layoutIsolatedNodes(isolated, nodes, currentY);
    for (const [nodeId, pos] of isolatedPositions) {
      allPositions.set(nodeId, pos);
    }
  }

  // Center everything around origin
  centerPositions(allPositions, nodes);

  // Apply horizontal stretch (wider layout while keeping vertical compact)
  for (const pos of allPositions.values()) {
    pos.x *= activeConfig.HORIZONTAL_STRETCH;
  }

  // Re-center after stretch
  centerPositions(allPositions, nodes);

  // Build final result
  const result: Record<string, LayoutNode> = {};
  for (const [nodeId, pos] of allPositions) {
    const node = nodes[nodeId];
    result[nodeId] = {
      id: nodeId,
      x: pos.x,
      y: pos.y,
      width: node.width,
      height: node.height,
    };
  }

  return { nodes: result };
}

/**
 * Apply layout results to nodes.
 */
export function applyLayout(
  nodes: Record<string, Node>,
  layout: LayoutResult
): Record<string, Node> {
  const result: Record<string, Node> = {};

  for (const [nodeId, node] of Object.entries(nodes)) {
    const layoutNode = layout.nodes[nodeId];
    if (layoutNode) {
      result[nodeId] = {
        ...node,
        x: layoutNode.x,
        y: layoutNode.y,
      };
    } else {
      result[nodeId] = node;
    }
  }

  return result;
}
