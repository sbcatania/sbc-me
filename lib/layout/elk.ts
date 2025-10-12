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
  nodes: { id: string; width: number; height: number; group?: string }[],
  edges: { id: string; from: string; to: string }[]
): Promise<LayoutResult> {
  // Group nodes by their group field
  const groups = new Map<string, typeof nodes>();
  const ungrouped: typeof nodes = [];

  nodes.forEach((node) => {
    if (node.group) {
      if (!groups.has(node.group)) {
        groups.set(node.group, []);
      }
      groups.get(node.group)!.push(node);
    } else {
      ungrouped.push(node);
    }
  });

  // Build ELK graph
  const elkNodes: ElkNode[] = [];

  // Add grouped nodes as children of cluster nodes
  groups.forEach((groupNodes, groupId) => {
    elkNodes.push({
      id: `cluster_${groupId}`,
      children: groupNodes.map((n) => ({
        id: n.id,
        width: n.width,
        height: n.height,
      })),
    });
  });

  // Add ungrouped nodes
  ungrouped.forEach((node) => {
    elkNodes.push({
      id: node.id,
      width: node.width,
      height: node.height,
    });
  });

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
      "elk.spacing.nodeNode": "24",
      "elk.layered.spacing.nodeNodeBetweenLayers": "48",
      "elk.layered.nodePlacement.strategy": "LINEAR_SEGMENTS",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.padding": "[top=24,left=24,bottom=24,right=24]",
    },
  };

  try {
    const result = await elk.layout(graph);

    // Extract positioned nodes
    const layoutNodes: LayoutNode[] = [];
    const processNode = (node: ElkNode, offsetX = 0, offsetY = 0) => {
      if (node.children) {
        // This is a cluster, process its children
        node.children.forEach((child) => {
          processNode(
            child,
            offsetX + (node.x ?? 0),
            offsetY + (node.y ?? 0)
          );
        });
      } else {
        // This is a leaf node
        layoutNodes.push({
          id: node.id,
          x: offsetX + (node.x ?? 0),
          y: offsetY + (node.y ?? 0),
          width: node.width ?? 0,
          height: node.height ?? 0,
        });
      }
    };

    result.children?.forEach((node) => processNode(node));

    // Extract edge routing
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

