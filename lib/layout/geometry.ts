import { Node } from "@/lib/model/schema";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get the center point of a rectangle
 */
export function getCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Get the center point of a node
 */
export function getNodeCenter(node: Node): Point {
  return getCenter({
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  });
}

/**
 * Determine the best side of a rectangle to connect from/to,
 * and return the CENTER point of that side.
 */
export function getRectEdgePoint(
  rect: Rect,
  targetPoint: Point
): Point {
  const center = getCenter(rect);
  const dx = targetPoint.x - center.x;
  const dy = targetPoint.y - center.y;

  // Handle case where target is at center - default to right side
  if (dx === 0 && dy === 0) {
    return { x: rect.x + rect.width, y: center.y };
  }

  // Determine the best side based on the angle to the target
  // Compare the aspect-adjusted direction to pick horizontal vs vertical side
  const aspectRatio = rect.width / rect.height;
  const normalizedDx = dx / aspectRatio;

  // Pick the side based on which direction is dominant
  if (Math.abs(normalizedDx) > Math.abs(dy)) {
    // Horizontal direction dominant - use left or right side
    if (dx > 0) {
      // Right side center
      return { x: rect.x + rect.width, y: center.y };
    } else {
      // Left side center
      return { x: rect.x, y: center.y };
    }
  } else {
    // Vertical direction dominant - use top or bottom side
    if (dy > 0) {
      // Bottom side center
      return { x: center.x, y: rect.y + rect.height };
    } else {
      // Top side center
      return { x: center.x, y: rect.y };
    }
  }
}

/**
 * Determine which side of a rectangle should be used to connect to a target point
 */
export function getBestSide(
  rect: Rect,
  targetPoint: Point
): "top" | "right" | "bottom" | "left" {
  const center = getCenter(rect);
  const dx = targetPoint.x - center.x;
  const dy = targetPoint.y - center.y;

  if (dx === 0 && dy === 0) {
    return "right";
  }

  const aspectRatio = rect.width / rect.height;
  const normalizedDx = dx / aspectRatio;

  if (Math.abs(normalizedDx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "bottom" : "top";
  }
}

/**
 * Get the midpoint of a specific side of a rectangle.
 * Always returns the exact center of that side.
 */
export function getSidePoint(
  rect: Rect,
  side: "top" | "right" | "bottom" | "left"
): Point {
  const center = getCenter(rect);

  switch (side) {
    case "top":
      return { x: center.x, y: rect.y };
    case "bottom":
      return { x: center.x, y: rect.y + rect.height };
    case "left":
      return { x: rect.x, y: center.y };
    case "right":
      return { x: rect.x + rect.width, y: center.y };
  }
}

/**
 * Get the connection points for an edge between two nodes
 */
export function getEdgeEndpoints(
  sourceNode: Node,
  targetNode: Node
): { start: Point; end: Point } {
  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);

  const sourceRect: Rect = {
    x: sourceNode.x,
    y: sourceNode.y,
    width: sourceNode.width,
    height: sourceNode.height,
  };

  const targetRect: Rect = {
    x: targetNode.x,
    y: targetNode.y,
    width: targetNode.width,
    height: targetNode.height,
  };

  return {
    start: getRectEdgePoint(sourceRect, targetCenter),
    end: getRectEdgePoint(targetRect, sourceCenter),
  };
}

type Side = "top" | "right" | "bottom" | "left";
const ALL_SIDES: Side[] = ["top", "right", "bottom", "left"];

/**
 * Get the outward direction vector for a side.
 * This is the direction an edge should initially travel when exiting from this side.
 */
function getOutwardDirection(side: Side): Point {
  switch (side) {
    case "top": return { x: 0, y: -1 };
    case "bottom": return { x: 0, y: 1 };
    case "left": return { x: -1, y: 0 };
    case "right": return { x: 1, y: 0 };
  }
}

/**
 * Sample a point on a cubic bezier curve at parameter t (0-1)
 */
function sampleBezier(start: Point, c1: Point, c2: Point, end: Point, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * start.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t3 * end.x,
    y: mt3 * start.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t3 * end.y,
  };
}

/**
 * Check if a bezier curve passes through a rectangle.
 * Samples the curve at multiple points to detect intersection.
 */
function bezierIntersectsRect(
  start: Point,
  c1: Point,
  c2: Point,
  end: Point,
  rect: Rect,
  padding: number = 2
): boolean {
  // Expand rect slightly for safety margin
  const expandedRect: Rect = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  // Sample curve at multiple points
  const samples = 20;
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    const point = sampleBezier(start, c1, c2, end, t);
    if (pointInRect(point, expandedRect)) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate safe bezier control points that ensure the curve:
 * 1. Initially travels outward from the source node
 * 2. Approaches the target from outside
 * 3. Never passes through either node
 */
function getSafeControlPoints(
  start: Point,
  end: Point,
  sourceSide: Side,
  targetSide: Side,
  sourceRect: Rect,
  targetRect: Rect
): { c1: Point; c2: Point } {
  const sourceDir = getOutwardDirection(sourceSide);
  const targetDir = getOutwardDirection(targetSide);

  // Calculate distance between points
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Control point distance scales with edge length, with min/max bounds
  const minControlDist = 40;
  const maxControlDist = 150;
  const controlDist = clamp(distance * 0.4, minControlDist, maxControlDist);

  // Initial control points: travel outward from each endpoint
  let c1: Point = {
    x: start.x + sourceDir.x * controlDist,
    y: start.y + sourceDir.y * controlDist,
  };
  let c2: Point = {
    x: end.x + targetDir.x * controlDist,
    y: end.y + targetDir.y * controlDist,
  };

  // Check if curve passes through source or target nodes
  // If so, push control points further out
  for (let attempt = 0; attempt < 3; attempt++) {
    const passesSource = bezierIntersectsRect(start, c1, c2, end, sourceRect, 5);
    const passesTarget = bezierIntersectsRect(start, c1, c2, end, targetRect, 5);

    if (!passesSource && !passesTarget) {
      break;
    }

    // Push control points further out
    const multiplier = 1.5 + attempt * 0.5;
    c1 = {
      x: start.x + sourceDir.x * controlDist * multiplier,
      y: start.y + sourceDir.y * controlDist * multiplier,
    };
    c2 = {
      x: end.x + targetDir.x * controlDist * multiplier,
      y: end.y + targetDir.y * controlDist * multiplier,
    };
  }

  return { c1, c2 };
}

/**
 * Score a side combination for an edge.
 * Higher score = better choice.
 */
function scoreSideCombination(
  sourceRect: Rect,
  targetRect: Rect,
  sourceSide: Side,
  targetSide: Side,
  allNodes: Rect[]
): number {
  let score = 0;

  const start = getSidePoint(sourceRect, sourceSide);
  const end = getSidePoint(targetRect, targetSide);
  const { c1, c2 } = getSafeControlPoints(start, end, sourceSide, targetSide, sourceRect, targetRect);

  // Penalty: curve passes through source node
  if (bezierIntersectsRect(start, c1, c2, end, sourceRect, 5)) {
    score -= 1000;
  }

  // Penalty: curve passes through target node
  if (bezierIntersectsRect(start, c1, c2, end, targetRect, 5)) {
    score -= 1000;
  }

  // Penalty: curve passes through any other node
  for (const nodeRect of allNodes) {
    // Skip source and target
    if (nodeRect === sourceRect || nodeRect === targetRect) continue;
    if (bezierIntersectsRect(start, c1, c2, end, nodeRect, 3)) {
      score -= 500;
    }
  }

  // Bonus: source side faces toward target
  const sourceCenter = getCenter(sourceRect);
  const targetCenter = getCenter(targetRect);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  const sourceDir = getOutwardDirection(sourceSide);
  const dotSource = sourceDir.x * dx + sourceDir.y * dy;
  if (dotSource > 0) {
    score += 50; // Side faces toward target
  }

  // Bonus: target side faces toward source
  const targetDir = getOutwardDirection(targetSide);
  const dotTarget = targetDir.x * (-dx) + targetDir.y * (-dy);
  if (dotTarget > 0) {
    score += 50; // Side faces toward source
  }

  // Bonus: shorter path (prefer more direct routes)
  const pathLength = Math.sqrt(dx * dx + dy * dy);
  score += Math.max(0, 100 - pathLength / 10);

  return score;
}

/**
 * Find the best side combination for an edge that avoids passing through nodes.
 */
function findBestSides(
  sourceRect: Rect,
  targetRect: Rect,
  allNodes: Rect[]
): { sourceSide: Side; targetSide: Side } {
  const sourceCenter = getCenter(sourceRect);
  const targetCenter = getCenter(targetRect);

  // Start with the natural best sides
  let bestSourceSide = getBestSide(sourceRect, targetCenter);
  let bestTargetSide = getBestSide(targetRect, sourceCenter);
  let bestScore = scoreSideCombination(sourceRect, targetRect, bestSourceSide, bestTargetSide, allNodes);

  // If score is good enough, use it
  if (bestScore >= 0) {
    return { sourceSide: bestSourceSide, targetSide: bestTargetSide };
  }

  // Otherwise, try all combinations to find a better one
  for (const sourceSide of ALL_SIDES) {
    for (const targetSide of ALL_SIDES) {
      const score = scoreSideCombination(sourceRect, targetRect, sourceSide, targetSide, allNodes);
      if (score > bestScore) {
        bestScore = score;
        bestSourceSide = sourceSide;
        bestTargetSide = targetSide;
      }
    }
  }

  return { sourceSide: bestSourceSide, targetSide: bestTargetSide };
}

export interface EdgeRoute {
  start: Point;
  end: Point;
  c1: Point;
  c2: Point;
  sourceSide: Side;
  targetSide: Side;
}

/**
 * Get the opposite side
 */
function getOppositeSide(side: Side): Side {
  switch (side) {
    case "top": return "bottom";
    case "bottom": return "top";
    case "left": return "right";
    case "right": return "left";
  }
}

/**
 * Score a pair of opposite sides for a node's in/out assignment.
 * Considers how well the pair serves all incoming and outgoing edges.
 */
function scoreSidePair(
  nodeRect: Rect,
  inSide: Side,
  outSide: Side,
  incomingPositions: Point[], // positions of source nodes
  outgoingPositions: Point[], // positions of target nodes
  _allNodeRects: Rect[]
): number {
  let score = 0;
  const nodeCenter = getCenter(nodeRect);

  // Score how well inSide serves incoming edges
  const inDir = getOutwardDirection(inSide);
  for (const sourcePos of incomingPositions) {
    const dx = sourcePos.x - nodeCenter.x;
    const dy = sourcePos.y - nodeCenter.y;
    // Incoming edge comes FROM source, so we want the side facing the source
    // inDir points outward, so we want dot product with direction TO source to be positive
    const dot = inDir.x * dx + inDir.y * dy;
    if (dot > 0) {
      score += 30; // Good alignment
    } else {
      score -= 10; // Edge has to curve around
    }
  }

  // Score how well outSide serves outgoing edges
  const outDir = getOutwardDirection(outSide);
  for (const targetPos of outgoingPositions) {
    const dx = targetPos.x - nodeCenter.x;
    const dy = targetPos.y - nodeCenter.y;
    // Outgoing edge goes TO target, so we want outDir to point toward target
    const dot = outDir.x * dx + outDir.y * dy;
    if (dot > 0) {
      score += 30; // Good alignment
    } else {
      score -= 10; // Edge has to curve around
    }
  }

  // Bonus for using horizontal pair (left/right) when most connections are horizontal
  // or vertical pair (top/bottom) when most connections are vertical
  const isHorizontalPair = (inSide === "left" || inSide === "right");

  // Calculate if connections are mostly horizontal or vertical
  let horizontalSpread = 0;
  let verticalSpread = 0;
  for (const pos of [...incomingPositions, ...outgoingPositions]) {
    horizontalSpread += Math.abs(pos.x - nodeCenter.x);
    verticalSpread += Math.abs(pos.y - nodeCenter.y);
  }

  if (isHorizontalPair && horizontalSpread > verticalSpread) {
    score += 20; // Horizontal pair for horizontally-spread connections
  } else if (!isHorizontalPair && verticalSpread > horizontalSpread) {
    score += 20; // Vertical pair for vertically-spread connections
  }

  return score;
}

/**
 * Determine the best sides for a node's incoming and outgoing edges.
 * Ensures they use different (ideally opposite) sides.
 */
function assignNodeSides(
  nodeId: string,
  nodeRect: Rect,
  incomingEdges: { sourceId: string }[],
  outgoingEdges: { targetId: string }[],
  nodes: Record<string, Node>,
  allNodeRects: Rect[]
): { inSide: Side; outSide: Side } {
  const nodeCenter = getCenter(nodeRect);

  // If no edges, return default
  if (incomingEdges.length === 0 && outgoingEdges.length === 0) {
    return { inSide: "left", outSide: "right" };
  }

  // If only incoming edges, pick best side for them
  if (outgoingEdges.length === 0) {
    const sourcePositions = incomingEdges
      .map(e => nodes[e.sourceId])
      .filter(Boolean)
      .map(n => getNodeCenter(n));

    if (sourcePositions.length === 0) return { inSide: "left", outSide: "right" };

    const avgSource = {
      x: sourcePositions.reduce((s, p) => s + p.x, 0) / sourcePositions.length,
      y: sourcePositions.reduce((s, p) => s + p.y, 0) / sourcePositions.length,
    };
    const inSide = getBestSide(nodeRect, avgSource);
    return { inSide, outSide: getOppositeSide(inSide) };
  }

  // If only outgoing edges, pick best side for them
  if (incomingEdges.length === 0) {
    const targetPositions = outgoingEdges
      .map(e => nodes[e.targetId])
      .filter(Boolean)
      .map(n => getNodeCenter(n));

    if (targetPositions.length === 0) return { inSide: "left", outSide: "right" };

    const avgTarget = {
      x: targetPositions.reduce((s, p) => s + p.x, 0) / targetPositions.length,
      y: targetPositions.reduce((s, p) => s + p.y, 0) / targetPositions.length,
    };
    const outSide = getBestSide(nodeRect, avgTarget);
    return { inSide: getOppositeSide(outSide), outSide };
  }

  // Both incoming and outgoing edges exist
  const inCount = incomingEdges.length;
  const outCount = outgoingEdges.length;

  const sourcePositions = incomingEdges
    .map(e => nodes[e.sourceId])
    .filter(Boolean)
    .map(n => getNodeCenter(n));

  const targetPositions = outgoingEdges
    .map(e => nodes[e.targetId])
    .filter(Boolean)
    .map(n => getNodeCenter(n));

  // Calculate average positions
  const avgSource = sourcePositions.length > 0 ? {
    x: sourcePositions.reduce((s, p) => s + p.x, 0) / sourcePositions.length,
    y: sourcePositions.reduce((s, p) => s + p.y, 0) / sourcePositions.length,
  } : nodeCenter;

  const avgTarget = targetPositions.length > 0 ? {
    x: targetPositions.reduce((s, p) => s + p.x, 0) / targetPositions.length,
    y: targetPositions.reduce((s, p) => s + p.y, 0) / targetPositions.length,
  } : nodeCenter;

  // Get natural best sides
  const naturalInSide = getBestSide(nodeRect, avgSource);
  const naturalOutSide = getBestSide(nodeRect, avgTarget);

  // If natural sides are already different, use them
  if (naturalInSide !== naturalOutSide) {
    return { inSide: naturalInSide, outSide: naturalOutSide };
  }

  // Conflict: both want the same side
  // Try all opposite pairs and score them
  const oppositePairs: [Side, Side][] = [
    ["left", "right"],
    ["right", "left"],
    ["top", "bottom"],
    ["bottom", "top"],
  ];

  let bestPair = oppositePairs[0];
  let bestScore = -Infinity;

  for (const [inSide, outSide] of oppositePairs) {
    const score = scoreSidePair(
      nodeRect,
      inSide,
      outSide,
      sourcePositions,
      targetPositions,
      allNodeRects
    );
    if (score > bestScore) {
      bestScore = score;
      bestPair = [inSide, outSide];
    }
  }

  // If counts are unequal, prioritize the majority direction
  if (outCount > inCount) {
    // Outgoing gets priority - find best out side, incoming gets opposite
    const outSide = getBestSide(nodeRect, avgTarget);
    const inSide = getOppositeSide(outSide);

    // But check if this would be worse than our scored best pair
    const priorityScore = scoreSidePair(nodeRect, inSide, outSide, sourcePositions, targetPositions, allNodeRects);
    if (priorityScore >= bestScore - 20) { // Allow small penalty for majority preference
      return { inSide, outSide };
    }
  } else if (inCount > outCount) {
    // Incoming gets priority - find best in side, outgoing gets opposite
    const inSide = getBestSide(nodeRect, avgSource);
    const outSide = getOppositeSide(inSide);

    const priorityScore = scoreSidePair(nodeRect, inSide, outSide, sourcePositions, targetPositions, allNodeRects);
    if (priorityScore >= bestScore - 20) {
      return { inSide, outSide };
    }
  }

  // Use the best scored pair
  return { inSide: bestPair[0], outSide: bestPair[1] };
}

/**
 * Calculate all edge routes with proper bezier curves that:
 * - Connect at the exact midpoint of each side
 * - Never pass through their own source or target nodes
 * - Avoid passing through other nodes when possible
 * - Use outward-first curve directions
 * - Separate incoming and outgoing edges to different sides of each node
 */
export function calculateAllEdgeEndpoints(
  edges: { id: string; sourceId: string; targetId: string }[],
  nodes: Record<string, Node>
): Record<string, EdgeRoute> {
  const result: Record<string, EdgeRoute> = {};

  // Build array of all node rects for collision detection
  const allNodeRects: Rect[] = Object.values(nodes).map(node => ({
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  }));

  // Create a map from node to its rect for quick lookup
  const nodeToRect: Record<string, Rect> = {};
  for (const node of Object.values(nodes)) {
    nodeToRect[node.id] = {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    };
  }

  // Group edges by node for side assignment
  const incomingByNode: Record<string, { sourceId: string }[]> = {};
  const outgoingByNode: Record<string, { targetId: string }[]> = {};

  for (const nodeId of Object.keys(nodes)) {
    incomingByNode[nodeId] = [];
    outgoingByNode[nodeId] = [];
  }

  for (const edge of edges) {
    if (nodes[edge.targetId]) {
      incomingByNode[edge.targetId].push({ sourceId: edge.sourceId });
    }
    if (nodes[edge.sourceId]) {
      outgoingByNode[edge.sourceId].push({ targetId: edge.targetId });
    }
  }

  // Assign sides for each node
  const nodeSides: Record<string, { inSide: Side; outSide: Side }> = {};
  for (const nodeId of Object.keys(nodes)) {
    const nodeRect = nodeToRect[nodeId];
    nodeSides[nodeId] = assignNodeSides(
      nodeId,
      nodeRect,
      incomingByNode[nodeId],
      outgoingByNode[nodeId],
      nodes,
      allNodeRects
    );
  }

  // Route each edge using the assigned sides
  for (const edge of edges) {
    const sourceNode = nodes[edge.sourceId];
    const targetNode = nodes[edge.targetId];
    if (!sourceNode || !targetNode) continue;

    const sourceRect = nodeToRect[edge.sourceId];
    const targetRect = nodeToRect[edge.targetId];

    // Use the assigned sides
    let sourceSide = nodeSides[edge.sourceId]?.outSide ?? "right";
    let targetSide = nodeSides[edge.targetId]?.inSide ?? "left";

    // Validate the route doesn't pass through nodes
    const start = getSidePoint(sourceRect, sourceSide);
    const end = getSidePoint(targetRect, targetSide);
    const { c1, c2 } = getSafeControlPoints(start, end, sourceSide, targetSide, sourceRect, targetRect);

    // Check if this route passes through source or target
    const passesSource = bezierIntersectsRect(start, c1, c2, end, sourceRect, 5);
    const passesTarget = bezierIntersectsRect(start, c1, c2, end, targetRect, 5);

    // If route is bad, fall back to findBestSides for this specific edge
    if (passesSource || passesTarget) {
      const fallback = findBestSides(sourceRect, targetRect, allNodeRects);
      sourceSide = fallback.sourceSide;
      targetSide = fallback.targetSide;
      const newStart = getSidePoint(sourceRect, sourceSide);
      const newEnd = getSidePoint(targetRect, targetSide);
      const newCp = getSafeControlPoints(newStart, newEnd, sourceSide, targetSide, sourceRect, targetRect);

      result[edge.id] = {
        start: newStart,
        end: newEnd,
        c1: newCp.c1,
        c2: newCp.c2,
        sourceSide,
        targetSide,
      };
    } else {
      result[edge.id] = {
        start,
        end,
        c1,
        c2,
        sourceSide,
        targetSide,
      };
    }
  }

  return result;
}

/**
 * Calculate control points for a bezier curve between two points
 */
export function getBezierControlPoints(
  start: Point,
  end: Point,
  curvature: number = 0.5
): { c1: Point; c2: Point } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Control point offset (perpendicular to the line)
  const offset = distance * curvature * 0.3;

  // Perpendicular direction
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  // For mostly horizontal edges, curve up/down
  // For mostly vertical edges, curve left/right
  const shouldCurveVertically = Math.abs(dx) > Math.abs(dy);

  if (shouldCurveVertically) {
    // Curve above/below the line
    return {
      c1: { x: start.x + dx * 0.25, y: start.y + perpY * offset },
      c2: { x: start.x + dx * 0.75, y: end.y - perpY * offset },
    };
  } else {
    // Curve to the side
    return {
      c1: { x: start.x + perpX * offset, y: start.y + dy * 0.25 },
      c2: { x: end.x - perpX * offset, y: start.y + dy * 0.75 },
    };
  }
}

/**
 * Generate SVG path for a curved edge
 */
export function getCurvedEdgePath(
  start: Point,
  end: Point,
  c1?: Point,
  c2?: Point
): string {
  if (!c1 || !c2) {
    const controlPoints = getBezierControlPoints(start, end);
    c1 = controlPoints.c1;
    c2 = controlPoints.c2;
  }

  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if two rectangles intersect
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Get bounding box of multiple nodes
 */
export function getNodesBoundingBox(nodes: Node[]): Rect | null {
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate viewport to fit all nodes with padding
 */
export function calculateZoomToFit(
  nodes: Node[],
  viewWidth: number,
  viewHeight: number,
  padding: number = 50
): { x: number; y: number; zoom: number } {
  const bounds = getNodesBoundingBox(nodes);

  if (!bounds) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const contentWidth = bounds.width + padding * 2;
  const contentHeight = bounds.height + padding * 2;

  const scaleX = viewWidth / contentWidth;
  const scaleY = viewHeight / contentHeight;
  const zoom = Math.min(Math.max(scaleX, scaleY), 2, 1);

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  return {
    x: viewWidth / 2 - centerX * zoom,
    y: viewHeight / 2 - centerY * zoom,
    zoom,
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
