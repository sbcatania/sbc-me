"use client"

import { useRef } from "react";
import { useStore } from "@/lib/state/store";
import { LayoutResult } from "@/lib/layout/elk";
import { getActiveFlows, getActiveStocks } from "@/lib/state/selectors";
import { valveAriaLabel } from "@/lib/a11y/aria";
import { clamp } from "@/lib/util/math";

type ValvesLayerProps = {
  layout: LayoutResult;
};

export function ValvesLayer({ layout }: ValvesLayerProps) {
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const valves = useStore((state) => state.valves);
  const setValve = useStore((state) => state.setValve);

  const draggingRef = useRef<string | null>(null);
  const startXRef = useRef<number>(0);
  const startPosRef = useRef<number>(0);

  if (!systemData) return null;

  const activeStocks = getActiveStocks(systemData, snapshotIndex);
  const activeFlows = getActiveFlows(systemData, snapshotIndex, activeStocks);

  const handleMouseDown = (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    draggingRef.current = flowId;
    startXRef.current = e.clientX;
    startPosRef.current = valves[flowId] ?? 0.5;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current) return;

    const flowId = draggingRef.current;
    const dx = e.clientX - startXRef.current;

    // Deadzone of ±8px
    if (Math.abs(dx) < 8) {
      setValve(flowId, startPosRef.current);
      return;
    }

    // Map horizontal movement to valve position
    // 100px = full range (0..1)
    const delta = dx / 100;
    const newPos = clamp(startPosRef.current + delta, 0, 1);
    setValve(flowId, newPos);
  };

  const handleMouseUp = () => {
    draggingRef.current = null;
  };

  // Attach global mouse handlers
  useRef(() => {
    window.addEventListener("mousemove", handleMouseMove as any);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove as any);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  return (
    <g className="valves-layer">
      {layout.edges.map((edge) => {
        const flow = activeFlows.find((f) => f.id === edge.id);
        if (!flow || edge.points.length < 2) return null;

        const fromStock = activeStocks.find((s) => s.id === flow.from);
        const toStock = activeStocks.find((s) => s.id === flow.to);
        if (!fromStock || !toStock) return null;

        // Find midpoint of the path
        const midpoint = getMidpoint(edge.points);

        return (
          <g
            key={`valve-${flow.id}`}
            data-interactive="true"
            className="cursor-ew-resize"
          >
            <circle
              cx={midpoint.x}
              cy={midpoint.y}
              r={6}
              className="fill-black dark:fill-white"
              opacity={0.8}
              onMouseDown={(e) => handleMouseDown(flow.id, e)}
              tabIndex={0}
              role="slider"
              aria-label={valveAriaLabel(fromStock.title, toStock.title)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((valves[flow.id] ?? 0.5) * 100)}
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Get midpoint of a path
 */
function getMidpoint(points: { x: number; y: number }[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  // Compute total length
  let totalLength = 0;
  const lengths: number[] = [0];
  
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    totalLength += len;
    lengths.push(totalLength);
  }

  const midLength = totalLength / 2;

  // Find segment containing midpoint
  for (let i = 1; i < lengths.length; i++) {
    if (midLength <= lengths[i]) {
      const t = (midLength - lengths[i - 1]) / (lengths[i] - lengths[i - 1]);
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      };
    }
  }

  return points[points.length - 1];
}

