import ELK, { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export type LayoutNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutEdge = {
  id: string;
  from: string;
  to: string;
  points: { x: number; y: number }[];
};

export type LayoutResult = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
};

/**
 * Run ELK layout algorithm
 */
export async function runElkLayout(
  nodes: { id: string; width: number; height: number }[],
  edges: { id: string; from: string; to: string }[]
): Promise<LayoutResult> {
  // Build ELK graph - all nodes are flat, no grouping
  // Allow ports on all sides for more flexible routing
  const elkNodes: ElkNode[] = nodes.map((node) => ({
    id: node.id,
    width: node.width,
    height: node.height,
    layoutOptions: {
      "elk.portConstraints": "FREE",
    },
  }));

  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.from],
    targets: [edge.to],
  }));

  const graph: ElkNode = {
    id: "root",
    children: elkNodes,
    edges: elkEdges,
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": "120",
      "elk.layered.spacing.edgeNodeBetweenLayers": "20",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "15",
      "elk.spacing.edgeNode": "20",
      "elk.spacing.edgeEdge": "15",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.considerModelOrder.strategy": "NONE",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.thoroughness": "7",
      "elk.layered.compaction.postCompaction.strategy": "EDGE_LENGTH",
      "elk.layered.compaction.connectedComponents": "false",
      "elk.padding": "[top=40,left=40,bottom=40,right=40]",
      "elk.aspectRatio": "0.5",
      "elk.layered.layering.strategy": "INTERACTIVE",
      "elk.layered.cycleBreaking.strategy": "DEPTH_FIRST",
      "elk.portConstraints": "FREE",
    },
  };

  try {
    const result = await elk.layout(graph);

    // Extract positioned nodes - simple flat structure with randomization
    const layoutNodes: LayoutNode[] = [];
    
    result.children?.forEach((node) => {
      // Add slight random offset to break up perfect alignment (±15px)
      const randomOffsetX = (Math.random() - 0.5) * 30;
      const randomOffsetY = (Math.random() - 0.5) * 30;
      
      layoutNodes.push({
        id: node.id,
        x: (node.x ?? 0) + randomOffsetX,
        y: (node.y ?? 0) + randomOffsetY,
        width: node.width ?? 0,
        height: node.height ?? 0,
      });
    });

    // Extract edge routing
    // Note: edges at the root level have coordinates in the root coordinate system
    const layoutEdges: LayoutEdge[] = [];
    result.edges?.forEach((edge) => {
      const points: { x: number; y: number }[] = [];
      
      if (edge.sections && edge.sections.length > 0) {
        const section = edge.sections[0];
        
        // Start point
        if (section.startPoint) {
          points.push({ x: section.startPoint.x, y: section.startPoint.y });
        }
        
        // Bend points
        if (section.bendPoints) {
          section.bendPoints.forEach((bp) => {
            points.push({ x: bp.x, y: bp.y });
          });
        }
        
        // End point
        if (section.endPoint) {
          points.push({ x: section.endPoint.x, y: section.endPoint.y });
        }
      }

      // Fallback: if no edge routing, connect node centers
      if (points.length === 0) {
        const sourceId = edge.sources?.[0] as string;
        const targetId = edge.targets?.[0] as string;
        const sourceNode = layoutNodes.find(n => n.id === sourceId);
        const targetNode = layoutNodes.find(n => n.id === targetId);
        
        if (sourceNode && targetNode) {
          points.push({ 
            x: sourceNode.x + sourceNode.width / 2, 
            y: sourceNode.y + sourceNode.height / 2 
          });
          points.push({ 
            x: targetNode.x + targetNode.width / 2, 
            y: targetNode.y + targetNode.height / 2 
          });
        }
      }

      layoutEdges.push({
        id: edge.id,
        from: (edge.sources?.[0] as string) ?? "",
        to: (edge.targets?.[0] as string) ?? "",
        points,
      });
    });

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      width: result.width ?? 0,
      height: result.height ?? 0,
    };
  } catch (error) {
    console.error("ELK layout failed:", error);
    throw error;
  }
}

