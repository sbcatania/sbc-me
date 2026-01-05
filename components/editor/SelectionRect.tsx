"use client";

import React from "react";

interface SelectionRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SelectionRect({ x, y, width, height }: SelectionRectProps) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      className="selection-rect"
    />
  );
}
