"use client"

import { useStore } from "@/lib/state/store";
import { LayoutResult } from "@/lib/layout/elk";
import { getActiveFlows, getActiveStocks, getFlowThickness } from "@/lib/state/selectors";
import { path as d3Path } from "d3-path";

type FlowsLayerProps = {
  layout: LayoutResult;
};

export function FlowsLayer({ layout }: FlowsLayerProps) {
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const hoveredItem = useStore((state) => state.hoveredItem);
  const selectedItem = useStore((state) => state.selectedItem);
  const showFlows = useStore((state) => state.showFlows);
  const stockPositions = useStore((state) => state.stockPositions);

  if (!systemData || !showFlows) return null;

  const activeStocks = getActiveStocks(systemData, snapshotIndex);
  const activeFlows = getActiveFlows(systemData, snapshotIndex, activeStocks);

  // Helper to get actual node position (respecting dragged positions)
  const getNodePosition = (nodeId: string) => {
    const layoutNode = layout.nodes.find(n => n.id === nodeId);
    if (!layoutNode) return null;
    
    const draggedPos = stockPositions[nodeId];
    return {
      x: draggedPos?.x ?? layoutNode.x,
      y: draggedPos?.y ?? layoutNode.y,
      width: layoutNode.width,
      height: layoutNode.height,
    };
  };

  // Helper to find edge intersection point with rectangle
  const getEdgePoint = (nodePos: ReturnType<typeof getNodePosition>, point: { x: number; y: number }, isStart: boolean) => {
    if (!nodePos) return point;
    
    const cx = nodePos.x + nodePos.width / 2;
    const cy = nodePos.y + nodePos.height / 2;
    
    const dx = point.x - cx;
    const dy = point.y - cy;
    
    // Avoid division by zero
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      return { x: cx, y: cy };
    }
    
    const halfW = nodePos.width / 2;
    const halfH = nodePos.height / 2;
    
    // Calculate intersection with rectangle edges based on the direction
    // Check all four edges and find the one that's actually intersected
    let intersectX, intersectY;
    
    // Scale factor to extend from center to edge
    const scaleX = Math.abs(dx) > 0.001 ? halfW / Math.abs(dx) : Infinity;
    const scaleY = Math.abs(dy) > 0.001 ? halfH / Math.abs(dy) : Infinity;
    
    // Use the smaller scale factor (first edge hit)
    const scale = Math.min(scaleX, scaleY);
    
    intersectX = cx + dx * scale;
    intersectY = cy + dy * scale;
    
    return { x: intersectX, y: intersectY };
  };

  return (
    <g className="flows-layer">
      {layout.edges.map((edge) => {
        const flow = activeFlows.find((f) => f.id === edge.id);
        if (!flow || edge.points.length < 2) return null;

        const fromStock = activeStocks.find((s) => s.id === flow.from);
        const toStock = activeStocks.find((s) => s.id === flow.to);
        if (!fromStock || !toStock) return null;

        const thickness = getFlowThickness(flow, activeFlows);

        // Check if this flow is connected to the hovered stock
        const isConnected = hoveredItem?.kind === "stock" && 
          (flow.from === hoveredItem.id || flow.to === hoveredItem.id);

        // More dramatic opacity changes for better visibility
        const opacity = isConnected ? 1 : hoveredItem || selectedItem ? 0.08 : 0.6;

        // Check if either stock has been dragged
        const fromNodePos = getNodePosition(flow.from);
        const toNodePos = getNodePosition(flow.to);
        const fromDragged = stockPositions[flow.from] !== undefined;
        const toDragged = stockPositions[flow.to] !== undefined;
        
        let adjustedPoints: { x: number; y: number }[];
        
        // If either node is dragged, recalculate a simple orthogonal path
        if ((fromDragged || toDragged) && fromNodePos && toNodePos) {
          adjustedPoints = calculateSimpleOrthogonalPath(fromNodePos, toNodePos);
        } else {
          // Use ELK routing and adjust endpoints
          adjustedPoints = [...edge.points];
          
          if (fromNodePos && adjustedPoints.length > 0) {
            adjustedPoints[0] = getEdgePoint(fromNodePos, adjustedPoints[0], true);
          }
          
          if (toNodePos && adjustedPoints.length > 0) {
            adjustedPoints[adjustedPoints.length - 1] = getEdgePoint(toNodePos, adjustedPoints[adjustedPoints.length - 1], false);
          }
        }

        // Calculate arrow dimensions
        const arrowLength = Math.max(10, thickness * 2.5);
        
        // Build path that stops at the base of the arrow
        const { pathData, arrowStart, arrowAngle } = buildPathWithArrow(adjustedPoints, arrowLength);

        return (
          <g
            key={flow.id}
            style={{ pointerEvents: 'none' }}
          >
            {/* Main path ending at arrow base */}
            <path
              d={pathData}
              className="fill-none stroke-current dark:stroke-white stroke-black"
              strokeWidth={thickness}
              style={{ opacity }}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />

            {/* Arrowhead that continues from line */}
            {arrowStart && buildEndArrow(arrowStart, adjustedPoints[adjustedPoints.length - 1], arrowAngle, thickness, opacity)}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Calculate a strict orthogonal path between two node positions
 */
function calculateSimpleOrthogonalPath(
  fromNode: { x: number; y: number; width: number; height: number },
  toNode: { x: number; y: number; width: number; height: number }
): { x: number; y: number }[] {
  const fromCenterX = fromNode.x + fromNode.width / 2;
  const fromCenterY = fromNode.y + fromNode.height / 2;
  const toCenterX = toNode.x + toNode.width / 2;
  const toCenterY = toNode.y + toNode.height / 2;
  
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  
  const points: { x: number; y: number }[] = [];
  
  // Determine which side of each node to connect to
  // For fromNode: check which direction leads toward toNode
  let fromExitSide: 'top' | 'bottom' | 'left' | 'right';
  if (Math.abs(dx) > Math.abs(dy)) {
    fromExitSide = dx > 0 ? 'right' : 'left';
  } else {
    fromExitSide = dy > 0 ? 'bottom' : 'top';
  }
  
  // For toNode: check which direction leads toward fromNode (opposite)
  let toEntrySide: 'top' | 'bottom' | 'left' | 'right';
  if (Math.abs(dx) > Math.abs(dy)) {
    toEntrySide = dx > 0 ? 'left' : 'right';
  } else {
    toEntrySide = dy > 0 ? 'top' : 'bottom';
  }
  
  // Calculate edge points
  const fromEdge = getEdgePointBySide(fromNode, fromExitSide);
  const toEdge = getEdgePointBySide(toNode, toEntrySide);
  
  points.push(fromEdge);
  
  // Create orthogonal path (only horizontal and vertical segments)
  if (fromExitSide === 'left' || fromExitSide === 'right') {
    // Exit horizontally
    const midX = fromCenterX + dx * 0.5;
    
    // Go horizontal from exit
    points.push({ x: midX, y: fromEdge.y });
    
    // Then vertical
    points.push({ x: midX, y: toEdge.y });
  } else {
    // Exit vertically
    const midY = fromCenterY + dy * 0.5;
    
    // Go vertical from exit
    points.push({ x: fromEdge.x, y: midY });
    
    // Then horizontal
    points.push({ x: toEdge.x, y: midY });
  }
  
  points.push(toEdge);
  
  return points;
}

/**
 * Get edge point on a specific side of a node
 */
function getEdgePointBySide(
  node: { x: number; y: number; width: number; height: number },
  side: 'top' | 'bottom' | 'left' | 'right'
): { x: number; y: number } {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  
  switch (side) {
    case 'top':
      return { x: cx, y: node.y };
    case 'bottom':
      return { x: cx, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: cy };
    case 'right':
      return { x: node.x + node.width, y: cy };
  }
}

/**
 * Get edge point for a node given a target direction
 */
function getEdgePointForPath(
  node: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number }
): { x: number; y: number } {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  
  const dx = target.x - cx;
  const dy = target.y - cy;
  
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return { x: cx, y: cy };
  }
  
  const halfW = node.width / 2;
  const halfH = node.height / 2;
  
  const scaleX = Math.abs(dx) > 0.001 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0.001 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  
  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

/**
 * Build a smooth path with rounded corners that stops before the arrow
 */
function buildPathWithArrow(
  points: { x: number; y: number }[],
  arrowLength: number
): {
  pathData: string;
  arrowStart: { x: number; y: number } | null;
  arrowAngle: number;
} {
  if (points.length < 2) {
    return { pathData: "", arrowStart: null, arrowAngle: 0 };
  }

  const path = d3Path();
  const cornerRadius = 24; // Larger radius for smoother curves
  
  path.moveTo(points[0].x, points[0].y);

  // Draw segments with smooth rounded corners
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = i < points.length - 1 ? points[i + 1] : null;
    
    if (!next) {
      // Last corner before arrow
      path.lineTo(curr.x, curr.y);
      continue;
    }
    
    // Calculate vectors
    const d1x = curr.x - prev.x;
    const d1y = curr.y - prev.y;
    const d2x = next.x - curr.x;
    const d2y = next.y - curr.y;
    
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);
    
    // Determine corner radius (scale with segment length for smoothness)
    const maxRadius = Math.min(len1 * 0.4, len2 * 0.4, cornerRadius);
    const r = Math.max(maxRadius, 1);
    
    if (r > 0.5) {
      // Line to corner start
      const startX = curr.x - (d1x / len1) * r;
      const startY = curr.y - (d1y / len1) * r;
      path.lineTo(startX, startY);
      
      // Smooth rounded corner with control point
      const endX = curr.x + (d2x / len2) * r;
      const endY = curr.y + (d2y / len2) * r;
      
      // Use cubic bezier for extra smoothness
      const cp1X = curr.x - (d1x / len1) * (r * 0.4);
      const cp1Y = curr.y - (d1y / len1) * (r * 0.4);
      const cp2X = curr.x + (d2x / len2) * (r * 0.4);
      const cp2Y = curr.y + (d2y / len2) * (r * 0.4);
      
      path.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
    } else {
      // Corner too tight, just use straight line
      path.lineTo(curr.x, curr.y);
    }
  }

  // Handle the last segment (stopping at arrow base)
  const lastPoint = points[points.length - 1];
  const secondLastPoint = points[points.length - 2];
  
  const dx = lastPoint.x - secondLastPoint.x;
  const dy = lastPoint.y - secondLastPoint.y;
  const segmentLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  
  // Stop the line at arrow base
  const stopDistance = Math.min(arrowLength, segmentLength * 0.9);
  const arrowBaseX = lastPoint.x - (dx / segmentLength) * stopDistance;
  const arrowBaseY = lastPoint.y - (dy / segmentLength) * stopDistance;
  
  path.lineTo(arrowBaseX, arrowBaseY);

  return {
    pathData: path.toString(),
    arrowStart: { x: arrowBaseX, y: arrowBaseY },
    arrowAngle: angle,
  };
}

/**
 * Build a single arrowhead that starts from the line end
 */
function buildEndArrow(
  arrowBase: { x: number; y: number },
  tipPoint: { x: number; y: number },
  angle: number,
  thickness: number,
  opacity: number
): JSX.Element {
  const arrowLength = Math.max(10, thickness * 2.5);
  const arrowWidth = Math.max(6, thickness * 1.5);
  
  // Tip is at the actual end point
  const tipX = tipPoint.x;
  const tipY = tipPoint.y;
  
  // Base is where the line stopped
  const baseX = arrowBase.x;
  const baseY = arrowBase.y;
  
  // Calculate the two wing points perpendicular to the arrow direction
  const perpAngle = angle + Math.PI / 2;
  const wing1X = baseX + arrowWidth * Math.cos(perpAngle);
  const wing1Y = baseY + arrowWidth * Math.sin(perpAngle);
  const wing2X = baseX - arrowWidth * Math.cos(perpAngle);
  const wing2Y = baseY - arrowWidth * Math.sin(perpAngle);

  return (
    <path
      d={`M ${tipX},${tipY} L ${wing1X},${wing1Y} L ${wing2X},${wing2Y} Z`}
      className="fill-current dark:fill-white fill-black stroke-none"
      style={{ opacity }}
    />
  );
}

