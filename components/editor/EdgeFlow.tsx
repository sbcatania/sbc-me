"use client";

import React, { useState, useRef, useEffect } from "react";
import { Edge, Node } from "@/lib/model/schema";
import { useDiagramStore } from "@/lib/store/diagrams";
import {
  getEdgeEndpoints,
  getCurvedEdgePath,
  getBezierControlPoints,
  Point,
  EdgeRoute,
} from "@/lib/layout/geometry";

interface EdgeFlowProps {
  edge: Edge;
  sourceNode: Node;
  targetNode: Node;
  endpoints?: EdgeRoute;
  selected: boolean;
  labelMode: "hover" | "always";
  editing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
}

export function EdgeFlow({
  edge,
  sourceNode,
  targetNode,
  endpoints,
  selected,
  labelMode,
  editing,
  onEditStart,
  onEditEnd,
}: EdgeFlowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(edge.label);
  const [hovered, setHovered] = useState(false);
  const { updateEdge } = useDiagramStore();

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(edge.label);
  }, [edge.label]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Use pre-calculated route if provided, otherwise calculate
  let start: Point, end: Point, c1: Point, c2: Point;

  if (endpoints) {
    // Use the pre-calculated safe route (includes control points)
    start = endpoints.start;
    end = endpoints.end;
    c1 = endpoints.c1;
    c2 = endpoints.c2;
  } else {
    // Fallback: calculate endpoints and control points
    const fallbackEndpoints = getEdgeEndpoints(sourceNode, targetNode);
    start = fallbackEndpoints.start;
    end = fallbackEndpoints.end;

    if (edge.curve?.c1 && edge.curve?.c2) {
      c1 = edge.curve.c1;
      c2 = edge.curve.c2;
    } else {
      const controlPoints = getBezierControlPoints(start, end);
      c1 = controlPoints.c1;
      c2 = controlPoints.c2;
    }
  }

  const path = getCurvedEdgePath(start, end, c1, c2);

  // Calculate label position (midpoint of bezier)
  const t = 0.5;
  const labelX =
    (1 - t) ** 3 * start.x +
    3 * (1 - t) ** 2 * t * c1.x +
    3 * (1 - t) * t ** 2 * c2.x +
    t ** 3 * end.x;
  const labelY =
    (1 - t) ** 3 * start.y +
    3 * (1 - t) ** 2 * t * c1.y +
    3 * (1 - t) * t ** 2 * c2.y +
    t ** 3 * end.y;

  // Calculate arrow angle at the end point
  // Derivative of bezier at t=1 gives us tangent direction
  const tangentX = 3 * (end.x - c2.x);
  const tangentY = 3 * (end.y - c2.y);
  const angle = Math.atan2(tangentY, tangentX) * (180 / Math.PI);

  const showLabel =
    labelMode === "always" || selected || hovered || editing || edge.label;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditStart();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputBlur = () => {
    updateEdge(edge.id, { label: editValue });
    onEditEnd();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      updateEdge(edge.id, { label: editValue });
      onEditEnd();
    } else if (e.key === "Escape") {
      setEditValue(edge.label);
      onEditEnd();
    }
    e.stopPropagation();
  };

  return (
    <g
      data-edge-id={edge.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Invisible wider path for easier selection */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="16"
        className="cursor-pointer"
      />

      {/* Animated dotted flow path */}
      <path
        d={path}
        className="flow-animated"
        fill="none"
        stroke="currentColor"
        strokeWidth={selected ? 1.5 : 1}
        strokeLinecap="round"
      />

      {/* Small arrowhead at end */}
      <g transform={`translate(${end.x}, ${end.y}) rotate(${angle})`}>
        <path
          d="M -6 -3 L 0 0 L -6 3"
          fill="none"
          stroke="currentColor"
          strokeWidth={selected ? 1.5 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Label */}
      {showLabel && (
        <g
          transform={`translate(${labelX}, ${labelY})`}
          onDoubleClick={handleDoubleClick}
          className="cursor-pointer"
        >
          {/* Label background */}
          <rect
            x={-40}
            y={-10}
            width={80}
            height={20}
            className="fill-background"
            opacity={0.9}
            rx={2}
          />

          {editing ? (
            <foreignObject x={-40} y={-10} width={80} height={20}>
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="inline-edit-input h-full text-xs"
                style={{ fontSize: "11px" }}
              />
            </foreignObject>
          ) : (
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none select-none fill-current"
              style={{
                fontSize: "11px",
                opacity: labelMode === "always" || selected || hovered ? 1 : 0.5,
              }}
            >
              {edge.label || "flow"}
            </text>
          )}
        </g>
      )}
    </g>
  );
}
