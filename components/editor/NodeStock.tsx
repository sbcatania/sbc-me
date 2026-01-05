"use client";

import React, { useState, useRef, useEffect } from "react";
import { Node } from "@/lib/model/schema";
import { useDiagramStore } from "@/lib/store/diagrams";

interface NodeStockProps {
  node: Node;
  selected: boolean;
  editing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
}

export function NodeStock({
  node,
  selected,
  editing,
  onEditStart,
  onEditEnd,
}: NodeStockProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(node.label);
  const [hovered, setHovered] = useState(false);
  const { updateNode } = useDiagramStore();

  const isExternal = node.kind === "external";

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(node.label);
  }, [node.label]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditStart();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputBlur = () => {
    updateNode(node.id, { label: editValue });
    onEditEnd();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      updateNode(node.id, { label: editValue });
      onEditEnd();
    } else if (e.key === "Escape") {
      setEditValue(node.label);
      onEditEnd();
    }
    e.stopPropagation();
  };

  // Handle positions on all four sides (on the edge)
  const handleSize = 3;
  const handles = [
    { x: node.width / 2, y: 0, cursor: "n-resize" },           // top
    { x: node.width, y: node.height / 2, cursor: "e-resize" }, // right
    { x: node.width / 2, y: node.height, cursor: "s-resize" }, // bottom
    { x: 0, y: node.height / 2, cursor: "w-resize" },          // left
  ];

  const showHandles = selected || hovered;

  return (
    <g
      data-node-id={node.id}
      transform={`translate(${node.x}, ${node.y})`}
      className="cursor-move"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Node rectangle */}
      <rect
        width={node.width}
        height={node.height}
        className={`node-stock ${isExternal ? "node-stock-external" : ""} ${
          selected ? "selected" : ""
        }`}
        rx="0"
        ry="0"
      />

      {/* Label or edit input */}
      {editing ? (
        <foreignObject
          x={4}
          y={4}
          width={node.width - 8}
          height={node.height - 8}
        >
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="inline-edit-input h-full text-sm"
            style={{ fontSize: "13px" }}
          />
        </foreignObject>
      ) : (
        <text
          x={node.width / 2}
          y={node.height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none select-none fill-current"
          style={{ fontSize: "13px" }}
          onDoubleClick={handleDoubleClick}
        >
          {node.label || "Stock"}
        </text>
      )}

      {/* Connector handle dots on all four sides */}
      {handles.map((handle, i) => (
        <circle
          key={i}
          data-handle="true"
          data-node-id={node.id}
          cx={handle.x}
          cy={handle.y}
          r={handleSize}
          className="cursor-crosshair"
          style={{
            fill: "currentColor",
            opacity: showHandles ? 0.6 : 0,
            transition: "opacity 0.1s ease",
          }}
        />
      ))}

      {/* Child diagram indicator */}
      {node.childDiagramId && (
        <g transform={`translate(${node.width - 16}, 4)`}>
          <rect
            width={12}
            height={12}
            rx="1"
            className="fill-muted stroke-current"
            strokeWidth={0.5}
          />
          <path
            d="M3 6h6M6 3v6"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </g>
      )}
    </g>
  );
}
