"use client"

import { useEffect, useState } from "react";
import { useStore } from "@/lib/state/store";
import { buildGraph } from "@/lib/layout/buildGraph";
import { LayoutResult } from "@/lib/layout/elk";
import { FlowsLayer } from "./FlowsLayer";
import { StocksLayer } from "./StocksLayer";
import { ValvesLayer } from "./ValvesLayer";
import { ObjectiveSpotlightOverlay } from "./ObjectiveSpotlightOverlay";

export function GraphView() {
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const valves = useStore((state) => state.valves);
  const setViewTransform = useStore((state) => state.setViewTransform);
  
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);

  // Recompute layout when data or snapshot changes
  useEffect(() => {
    if (!systemData) return;

    setIsLayouting(true);
    buildGraph(systemData, snapshotIndex, valves)
      .then((result) => {
        setLayout(result);
        setIsLayouting(false);
        
        // Fit graph to viewport on initial load or snapshot change
        fitGraphToViewport(result);
      })
      .catch((error) => {
        console.error("Layout error:", error);
        setIsLayouting(false);
      });
  }, [systemData, snapshotIndex]); // Note: deliberately not including valves

  const fitGraphToViewport = (layout: LayoutResult) => {
    if (typeof window === "undefined") return;
    
    const padding = 40;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 44 - 44; // minus timebar and top bar
    
    const scaleX = (viewportWidth - padding * 2) / layout.width;
    const scaleY = (viewportHeight - padding * 2) / layout.height;
    const scale = Math.min(scaleX, scaleY, 1.5); // Don't zoom in too much
    
    const x = (viewportWidth - layout.width * scale) / 2;
    const y = (viewportHeight - layout.height * scale) / 2 + 44; // account for top bar
    
    setViewTransform({ x, y, scale });
  };

  if (!systemData || !layout) {
    return (
      <text x="400" y="300" className="fill-current text-sm opacity-30">
        {isLayouting ? "Computing layout..." : "Loading..."}
      </text>
    );
  }

  return (
    <g>
      <ObjectiveSpotlightOverlay layout={layout} />
      <FlowsLayer layout={layout} />
      <ValvesLayer layout={layout} />
      <StocksLayer layout={layout} />
    </g>
  );
}

