"use client"

import { useStore } from "@/lib/state/store";
import { LayoutResult } from "@/lib/layout/elk";
import { getActiveFlows, getActiveStocks, getFlowThickness } from "@/lib/state/selectors";
import { flowAriaLabel } from "@/lib/a11y/aria";
import { path as d3Path } from "d3-path";

type FlowsLayerProps = {
  layout: LayoutResult;
};

export function FlowsLayer({ layout }: FlowsLayerProps) {
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const valves = useStore((state) => state.valves);
  const hoveredItem = useStore((state) => state.hoveredItem);
  const selectedItem = useStore((state) => state.selectedItem);
  const setHoveredItem = useStore((state) => state.setHoveredItem);

  if (!systemData) return null;

  const activeStocks = getActiveStocks(systemData, snapshotIndex);
  const activeFlows = getActiveFlows(systemData, snapshotIndex, activeStocks);

  return (
    <g className="flows-layer">
      {layout.edges.map((edge) => {
        const flow = activeFlows.find((f) => f.id === edge.id);
        if (!flow || edge.points.length < 2) return null;

        const fromStock = activeStocks.find((s) => s.id === flow.from);
        const toStock = activeStocks.find((s) => s.id === flow.to);
        if (!fromStock || !toStock) return null;

        const thickness = getFlowThickness(flow, activeFlows, valves[flow.id]);

        const isHovered = hoveredItem?.kind === "flow" && hoveredItem.id === flow.id;
        const opacity = isHovered ? 1 : hoveredItem || selectedItem ? 0.3 : 0.6;

        // Build smooth path with rounded corners
        const pathData = buildRoundedPath(edge.points, 4);

        return (
          <g
            key={flow.id}
            data-interactive="true"
            onMouseEnter={() => setHoveredItem({ kind: "flow", id: flow.id })}
            onMouseLeave={() => setHoveredItem(null)}
            role="button"
            tabIndex={0}
            aria-label={flowAriaLabel(fromStock.title, toStock.title)}
          >
            {/* Main path */}
            <path
              d={pathData}
              className="fill-none stroke-current dark:stroke-white stroke-black"
              strokeWidth={thickness}
              style={{ opacity }}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Chevrons (direction indicators) */}
            {buildChevrons(edge.points, thickness, opacity)}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Build a rounded path from points
 */
function buildRoundedPath(points: { x: number; y: number }[], radius: number): string {
  if (points.length < 2) return "";

  const path = d3Path();
  path.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    if (i === points.length - 1) {
      // Last segment, just line to
      path.lineTo(points[i].x, points[i].y);
    } else {
      // Round the corner
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const d1x = curr.x - prev.x;
      const d1y = curr.y - prev.y;
      const d2x = next.x - curr.x;
      const d2y = next.y - curr.y;

      const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
      const len2 = Math.sqrt(d2x * d2x + d2y * d2y);

      const r = Math.min(radius, len1 / 2, len2 / 2);

      const startX = curr.x - (d1x / len1) * r;
      const startY = curr.y - (d1y / len1) * r;
      const endX = curr.x + (d2x / len2) * r;
      const endY = curr.y + (d2y / len2) * r;

      path.lineTo(startX, startY);
      path.quadraticCurveTo(curr.x, curr.y, endX, endY);
    }
  }

  return path.toString();
}

/**
 * Build chevrons along the path
 */
function buildChevrons(
  points: { x: number; y: number }[],
  thickness: number,
  opacity: number
): JSX.Element[] {
  const chevrons: JSX.Element[] = [];
  const chevronSpacing = 24; // px between chevrons
  const chevronSize = 6;

  if (points.length < 2) return chevrons;

  // Compute total length and place chevrons
  let accumulated = 0;
  let chevronIndex = 0;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segmentLen = Math.sqrt(dx * dx + dy * dy);

    if (segmentLen === 0) continue;

    const angle = Math.atan2(dy, dx);

    // Place chevrons along this segment
    let localDist = 0;
    while (accumulated + localDist < (chevronIndex + 1) * chevronSpacing) {
      const neededDist = (chevronIndex + 1) * chevronSpacing - accumulated;
      if (neededDist <= segmentLen) {
        const t = neededDist / segmentLen;
        const cx = p1.x + dx * t;
        const cy = p1.y + dy * t;

        // Draw chevron
        const x1 = cx - chevronSize * Math.cos(angle + Math.PI / 6);
        const y1 = cy - chevronSize * Math.sin(angle + Math.PI / 6);
        const x2 = cx + chevronSize * Math.cos(angle);
        const y2 = cy + chevronSize * Math.sin(angle);
        const x3 = cx - chevronSize * Math.cos(angle - Math.PI / 6);
        const y3 = cy - chevronSize * Math.sin(angle - Math.PI / 6);

        chevrons.push(
          <path
            key={`chevron-${chevronIndex}`}
            d={`M ${x1},${y1} L ${x2},${y2} L ${x3},${y3}`}
            className="stroke-current dark:stroke-white stroke-black fill-none"
            strokeWidth={1.5}
            style={{ opacity }}
          />
        );

        chevronIndex++;
        localDist = neededDist;
      } else {
        break;
      }
    }

    accumulated += segmentLen;
  }

  return chevrons;
}

