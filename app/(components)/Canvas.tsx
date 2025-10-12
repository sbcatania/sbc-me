"use client"

import { useRef, useEffect } from "react";
import { useStore } from "@/lib/state/store";
import { GraphView } from "./GraphView";
import { clamp } from "@/lib/util/math";

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewTransform = useStore((state) => state.viewTransform);
  const setViewTransform = useStore((state) => state.setViewTransform);
  
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Handle pan
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only pan on empty canvas (not on interactive elements)
      if ((e.target as Element).closest("[data-interactive]")) return;
      
      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      svg.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;

      setViewTransform({
        ...viewTransform,
        x: viewTransform.x + dx,
        y: viewTransform.y + dy,
      });

      lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      svg.style.cursor = "default";
    };

    svg.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      svg.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [viewTransform, setViewTransform]);

  // Handle zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      
      e.preventDefault();

      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom factor
      const delta = -e.deltaY;
      const zoomFactor = 1 + delta * 0.001;
      const newScale = clamp(viewTransform.scale * zoomFactor, 0.5, 3.0);

      // Zoom toward mouse position
      const scaleDelta = newScale - viewTransform.scale;
      const worldX = (mouseX - viewTransform.x) / viewTransform.scale;
      const worldY = (mouseY - viewTransform.y) / viewTransform.scale;

      setViewTransform({
        x: viewTransform.x - worldX * scaleDelta,
        y: viewTransform.y - worldY * scaleDelta,
        scale: newScale,
      });
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      svg.removeEventListener("wheel", handleWheel);
    };
  }, [viewTransform, setViewTransform]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      <svg
        ref={svgRef}
        className="w-full h-full cursor-default"
        style={{ touchAction: "none" }}
      >
        <g
          transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.scale})`}
        >
          <GraphView />
        </g>
      </svg>
    </div>
  );
}

