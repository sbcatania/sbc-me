import { SystemData } from "@/lib/domain/types";
import { getActiveStocks, getActiveFlows, getActiveObjectives, getStockSize } from "@/lib/state/selectors";
import { runElkLayout, LayoutResult } from "./elk";

/**
 * Build and layout graph for a specific snapshot
 */
export async function buildGraph(
  data: SystemData,
  snapshotIndex: number
): Promise<LayoutResult> {
  const activeStocks = getActiveStocks(data, snapshotIndex);
  const activeFlows = getActiveFlows(data, snapshotIndex, activeStocks);
  const activeObjectives = getActiveObjectives(data, snapshotIndex);

  // Compute node sizes
  const nodes = activeStocks.map((stock) => {
    const size = getStockSize(stock, activeStocks);

    return {
      id: stock.id,
      width: size,
      height: size * 0.7, // Slightly rectangular
      // No grouping - objectives are just overlays
    };
  });

  // Build edges
  const edges = activeFlows.map((flow) => ({
    id: flow.id,
    from: flow.from,
    to: flow.to,
  }));

  // Run ELK layout
  try {
    return await runElkLayout(nodes, edges);
  } catch (error) {
    console.error("Layout failed, using fallback:", error);
    
    // Simple fallback layout (grid)
    return createFallbackLayout(nodes, edges);
  }
}

/**
 * Simple fallback layout when ELK fails
 */
function createFallbackLayout(
  nodes: { id: string; width: number; height: number }[],
  edges: { id: string; from: string; to: string }[]
): LayoutResult {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const spacing = 150;

  const layoutNodes = nodes.map((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    return {
      id: node.id,
      x: col * spacing,
      y: row * spacing,
      width: node.width,
      height: node.height,
    };
  });

  // Create simple straight-line edges
  const nodePositions = new Map(
    layoutNodes.map((n) => [n.id, { x: n.x + n.width / 2, y: n.y + n.height / 2 }])
  );

  const layoutEdges = edges.map((edge) => {
    const from = nodePositions.get(edge.from);
    const to = nodePositions.get(edge.to);
    
    return {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      points: from && to ? [from, to] : [],
    };
  });

  const maxX = Math.max(...layoutNodes.map((n) => n.x + n.width), 0);
  const maxY = Math.max(...layoutNodes.map((n) => n.y + n.height), 0);

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: maxX + 100,
    height: maxY + 100,
  };
}

