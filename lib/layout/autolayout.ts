import { Node, Edge } from "@/lib/model/schema";

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

/**
 * Find strongly connected components using Tarjan's algorithm
 */
function findSCCs(
  nodeIds: string[],
  adjacency: Map<string, string[]>
): string[][] {
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];
  let currentIndex = 0;

  function strongConnect(v: string) {
    index.set(v, currentIndex);
    lowlink.set(v, currentIndex);
    currentIndex++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adjacency.get(v) || [];
    for (const w of neighbors) {
      if (!index.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  for (const nodeId of nodeIds) {
    if (!index.has(nodeId)) {
      strongConnect(nodeId);
    }
  }

  return sccs;
}

/**
 * Build a condensed DAG from SCCs
 */
function buildCondensedDAG(
  sccs: string[][],
  edges: Edge[]
): { dag: Map<number, number[]>; nodeToScc: Map<string, number> } {
  // Map each node to its SCC index
  const nodeToScc = new Map<string, number>();
  for (let i = 0; i < sccs.length; i++) {
    for (const nodeId of sccs[i]) {
      nodeToScc.set(nodeId, i);
    }
  }

  // Build DAG edges between SCCs
  const dag = new Map<number, number[]>();
  for (let i = 0; i < sccs.length; i++) {
    dag.set(i, []);
  }

  const addedEdges = new Set<string>();
  for (const edge of edges) {
    const sourceScc = nodeToScc.get(edge.sourceId)!;
    const targetScc = nodeToScc.get(edge.targetId)!;

    if (sourceScc !== targetScc) {
      const edgeKey = `${sourceScc}-${targetScc}`;
      if (!addedEdges.has(edgeKey)) {
        dag.get(sourceScc)!.push(targetScc);
        addedEdges.add(edgeKey);
      }
    }
  }

  return { dag, nodeToScc };
}

/**
 * Topological sort of the condensed DAG
 */
function topologicalSort(dag: Map<number, number[]>): number[] {
  const inDegree = new Map<number, number>();
  const result: number[] = [];

  // Initialize in-degrees
  for (const [node] of dag) {
    if (!inDegree.has(node)) inDegree.set(node, 0);
    for (const target of dag.get(node)!) {
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    }
  }

  // Find nodes with no incoming edges
  const queue: number[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    for (const target of dag.get(node) || []) {
      const newDegree = inDegree.get(target)! - 1;
      inDegree.set(target, newDegree);
      if (newDegree === 0) queue.push(target);
    }
  }

  return result;
}

/**
 * Layout nodes in an SCC in a circle
 */
function layoutCircle(
  nodeIds: string[],
  centerX: number,
  centerY: number,
  nodes: Record<string, Node>
): Record<string, LayoutNode> {
  const result: Record<string, LayoutNode> = {};
  const count = nodeIds.length;

  if (count === 1) {
    const nodeId = nodeIds[0];
    const node = nodes[nodeId];
    result[nodeId] = {
      id: nodeId,
      x: centerX - node.width / 2,
      y: centerY - node.height / 2,
      width: node.width,
      height: node.height,
    };
    return result;
  }

  // Calculate radius based on number of nodes
  const avgNodeSize = 160;
  const circumference = count * (avgNodeSize + 80);
  const radius = circumference / (2 * Math.PI);

  for (let i = 0; i < count; i++) {
    const nodeId = nodeIds[i];
    const node = nodes[nodeId];
    const angle = (2 * Math.PI * i) / count - Math.PI / 2; // Start from top

    result[nodeId] = {
      id: nodeId,
      x: centerX + radius * Math.cos(angle) - node.width / 2,
      y: centerY + radius * Math.sin(angle) - node.height / 2,
      width: node.width,
      height: node.height,
    };
  }

  return result;
}

/**
 * Get parent SCCs of a given SCC
 */
function getParentSccs(sccIndex: number, dag: Map<number, number[]>): number[] {
  const parents: number[] = [];
  for (const [parent, children] of dag) {
    if (children.includes(sccIndex)) {
      parents.push(parent);
    }
  }
  return parents;
}

/**
 * Simple layered layout for DAG with better positioning to avoid edge crossings
 */
function layoutDAG(
  sccs: string[][],
  sortedOrder: number[],
  nodes: Record<string, Node>,
  dag: Map<number, number[]>
): Record<string, LayoutNode> {
  const result: Record<string, LayoutNode> = {};
  const sccCenters: Map<number, { x: number; y: number }> = new Map();

  // Calculate layer for each SCC
  const layers = new Map<number, number>();

  for (const sccIndex of sortedOrder) {
    let maxParentLayer = -1;
    for (const [parent, children] of dag) {
      if (children.includes(sccIndex)) {
        maxParentLayer = Math.max(maxParentLayer, layers.get(parent) || 0);
      }
    }
    layers.set(sccIndex, maxParentLayer + 1);
  }

  // Group SCCs by layer
  const layerGroups = new Map<number, number[]>();
  for (const [sccIndex, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(sccIndex);
  }

  // Layout parameters
  const layerSpacing = 200;
  const nodeSpacing = 250; // Increased spacing to avoid edge crossings

  // Position each layer
  const sortedLayers = Array.from(layerGroups.keys()).sort((a, b) => a - b);

  for (const layer of sortedLayers) {
    const sccsInLayer = layerGroups.get(layer)!;
    const y = layer * layerSpacing;

    // Sort SCCs in this layer based on average parent X position to reduce crossings
    if (layer > 0) {
      sccsInLayer.sort((a, b) => {
        const parentsA = getParentSccs(a, dag);
        const parentsB = getParentSccs(b, dag);

        const avgXA = parentsA.length > 0
          ? parentsA.reduce((sum, p) => sum + (sccCenters.get(p)?.x || 0), 0) / parentsA.length
          : 0;
        const avgXB = parentsB.length > 0
          ? parentsB.reduce((sum, p) => sum + (sccCenters.get(p)?.x || 0), 0) / parentsB.length
          : 0;

        return avgXA - avgXB;
      });
    }

    // Calculate total width for this layer
    let totalWidth = 0;
    for (const sccIndex of sccsInLayer) {
      const scc = sccs[sccIndex];
      if (scc.length === 1) {
        totalWidth += nodes[scc[0]].width + nodeSpacing;
      } else {
        // Estimate circle diameter
        const avgNodeSize = 160;
        const circumference = scc.length * (avgNodeSize + 80);
        const radius = circumference / (2 * Math.PI);
        totalWidth += radius * 2 + nodeSpacing;
      }
    }

    // For layers with parents, try to center under the average parent position
    let startX = -totalWidth / 2;
    if (layer > 0 && sccsInLayer.length > 0) {
      // Get all parent positions
      const allParentXPositions: number[] = [];
      for (const sccIndex of sccsInLayer) {
        const parents = getParentSccs(sccIndex, dag);
        for (const p of parents) {
          const center = sccCenters.get(p);
          if (center) allParentXPositions.push(center.x);
        }
      }
      if (allParentXPositions.length > 0) {
        const avgParentX = allParentXPositions.reduce((a, b) => a + b, 0) / allParentXPositions.length;
        startX = avgParentX - totalWidth / 2;
      }
    }

    let currentX = startX;

    for (const sccIndex of sccsInLayer) {
      const scc = sccs[sccIndex];

      if (scc.length === 1) {
        // Single node - simple positioning
        const nodeId = scc[0];
        const node = nodes[nodeId];
        const centerX = currentX + node.width / 2;

        result[nodeId] = {
          id: nodeId,
          x: currentX,
          y: y,
          width: node.width,
          height: node.height,
        };

        sccCenters.set(sccIndex, { x: centerX, y: y + node.height / 2 });
        currentX += node.width + nodeSpacing;
      } else {
        // Multiple nodes - circular layout
        const avgNodeSize = 160;
        const circumference = scc.length * (avgNodeSize + 80);
        const radius = circumference / (2 * Math.PI);
        const centerX = currentX + radius;
        const centerY = y + radius;

        const circleLayout = layoutCircle(scc, centerX, centerY, nodes);
        Object.assign(result, circleLayout);

        sccCenters.set(sccIndex, { x: centerX, y: centerY });
        currentX += radius * 2 + nodeSpacing;
      }
    }
  }

  return result;
}

/**
 * Main auto-layout function
 */
export function autoLayout(
  nodes: Record<string, Node>,
  edges: Edge[]
): LayoutResult {
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

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, []);
  }
  for (const edge of edges) {
    const sources = adjacency.get(edge.sourceId);
    if (sources) sources.push(edge.targetId);
  }

  // Find strongly connected components
  const sccs = findSCCs(nodeIds, adjacency);

  // Build condensed DAG
  const { dag } = buildCondensedDAG(sccs, edges);

  // Topological sort
  const sortedOrder = topologicalSort(dag);

  // Layout the DAG with circular SCCs
  const layoutNodes = layoutDAG(sccs, sortedOrder, nodes, dag);

  // Center the layout around origin
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const layoutNode of Object.values(layoutNodes)) {
    minX = Math.min(minX, layoutNode.x);
    minY = Math.min(minY, layoutNode.y);
    maxX = Math.max(maxX, layoutNode.x + layoutNode.width);
    maxY = Math.max(maxY, layoutNode.y + layoutNode.height);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  for (const nodeId of Object.keys(layoutNodes)) {
    layoutNodes[nodeId].x -= centerX;
    layoutNodes[nodeId].y -= centerY;
  }

  return { nodes: layoutNodes };
}

/**
 * Apply layout results to nodes
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
