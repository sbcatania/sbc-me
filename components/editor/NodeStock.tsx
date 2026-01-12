"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Node, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, COLOR_PALETTE } from "@/lib/model/schema";
import { useDiagramStore } from "@/lib/store/diagrams";

interface NodeStockProps {
  node: Node;
  selected: boolean;
  editing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
}

const MIN_NODE_WIDTH = DEFAULT_NODE_WIDTH;
const MIN_NODE_HEIGHT = DEFAULT_NODE_HEIGHT;
const PADDING = 16;
const LINE_HEIGHT = 20;
const FONT_SIZE = 13;

export function NodeStock({
  node,
  selected,
  editing,
  onEditStart,
  onEditEnd,
}: NodeStockProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [editValue, setEditValue] = useState(node.label);
  const [hovered, setHovered] = useState(false);
  const { updateNode } = useDiagramStore();

  const isExternal = node.kind === "external";
  const colorKey = node.color || "default";
  const palette = COLOR_PALETTE[colorKey] || COLOR_PALETTE.default;

  // Calculate required node size based on text content
  const calculateNodeSize = useCallback((text: string) => {
    // Create a temporary element to measure text
    const measureDiv = document.createElement("div");
    measureDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${MIN_NODE_WIDTH - PADDING * 2}px;
      font-size: ${FONT_SIZE}px;
      line-height: ${LINE_HEIGHT}px;
      word-wrap: break-word;
      white-space: pre-wrap;
    `;
    measureDiv.textContent = text || "Stock";
    document.body.appendChild(measureDiv);

    const textHeight = measureDiv.scrollHeight;
    document.body.removeChild(measureDiv);

    const requiredHeight = Math.max(MIN_NODE_HEIGHT, textHeight + PADDING * 2);
    return { width: MIN_NODE_WIDTH, height: requiredHeight };
  }, []);

  // Update node size when label changes
  useEffect(() => {
    const { height } = calculateNodeSize(node.label);
    if (height !== node.height) {
      updateNode(node.id, { height });
    }
  }, [node.label, node.id, node.height, calculateNodeSize, updateNode]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputBlur = () => {
    updateNode(node.id, { label: editValue });
    onEditEnd();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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
        className={`${isExternal ? "node-stock-external" : ""} ${
          selected ? "node-stock-selected" : ""
        }`}
        style={{
          fill: palette.fill,
          stroke: colorKey === "default" ? "currentColor" : palette.stroke,
          strokeWidth: selected ? 1.5 : 1,
        }}
        rx="0"
        ry="0"
      />

      {/* Label or edit input */}
      {editing ? (
        <foreignObject
          x={PADDING / 2}
          y={PADDING / 2}
          width={node.width - PADDING}
          height={node.height - PADDING}
        >
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="inline-edit-input h-full w-full resize-none border-none bg-transparent p-0 text-center outline-none"
            style={{
              fontSize: `${FONT_SIZE}px`,
              lineHeight: `${LINE_HEIGHT}px`,
            }}
          />
        </foreignObject>
      ) : (
        <foreignObject
          x={PADDING / 2}
          y={PADDING / 2}
          width={node.width - PADDING}
          height={node.height - PADDING}
          onDoubleClick={handleDoubleClick}
          className="pointer-events-auto"
        >
          <div
            className="flex h-full w-full items-center justify-center text-center"
            style={{
              fontSize: `${FONT_SIZE}px`,
              lineHeight: `${LINE_HEIGHT}px`,
              wordWrap: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              color: colorKey !== "default" ? palette.text : undefined,
            }}
          >
            {node.label || "Stock"}
          </div>
        </foreignObject>
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
