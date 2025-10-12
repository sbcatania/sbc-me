"use client"

import { useStore } from "@/lib/state/store";
import { LayoutResult } from "@/lib/layout/elk";
import { getActiveStocks } from "@/lib/state/selectors";
import { formatValue } from "@/lib/util/format";
import { stockAriaLabel } from "@/lib/a11y/aria";
import { useEffect, useState, useRef } from "react";
import { initDriftState, updateDriftState, DriftState } from "@/lib/anim/ticker";

type StocksLayerProps = {
  layout: LayoutResult;
};

export function StocksLayer({ layout }: StocksLayerProps) {
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const hoveredItem = useStore((state) => state.hoveredItem);
  const selectedItem = useStore((state) => state.selectedItem);
  const setHoveredItem = useStore((state) => state.setHoveredItem);
  const setSelectedItem = useStore((state) => state.setSelectedItem);
  const reducedMotion = useStore((state) => state.reducedMotion);

  const [driftStates, setDriftStates] = useState<Map<string, DriftState>>(new Map());
  const rafRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  if (!systemData) return null;

  const activeStocks = getActiveStocks(systemData, snapshotIndex);

  // Initialize drift states
  useEffect(() => {
    const newStates = new Map<string, DriftState>();
    
    activeStocks.forEach((stock) => {
      const existing = driftStates.get(stock.id);
      if (existing && existing.base === stock.value) {
        newStates.set(stock.id, existing);
      } else {
        newStates.set(stock.id, initDriftState(stock.value));
      }
    });
    
    setDriftStates(newStates);
  }, [activeStocks, snapshotIndex]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;

      setDriftStates((prev) => {
        const updated = new Map(prev);
        updated.forEach((state, id) => {
          updated.set(id, updateDriftState(state, dt, reducedMotion));
        });
        return updated;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [reducedMotion]);

  return (
    <g className="stocks-layer">
      {layout.nodes.map((node) => {
        const stock = activeStocks.find((s) => s.id === node.id);
        if (!stock) return null;

        const driftState = driftStates.get(stock.id);
        const displayValue = driftState ? driftState.displayed : stock.value;
        const formattedValue = formatValue(displayValue, stock.unit);

        const isHovered = hoveredItem?.kind === "stock" && hoveredItem.id === stock.id;
        const isSelected = selectedItem?.kind === "stock" && selectedItem.id === stock.id;

        const opacity = isHovered || isSelected ? 1 : hoveredItem || selectedItem ? 0.3 : 0.6;

        return (
          <g
            key={stock.id}
            transform={`translate(${node.x}, ${node.y})`}
            data-interactive="true"
            onMouseEnter={() => setHoveredItem({ kind: "stock", id: stock.id })}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => setSelectedItem({ kind: "stock", id: stock.id })}
            className="cursor-pointer"
            tabIndex={0}
            role="button"
            aria-label={stockAriaLabel(stock.title, formattedValue)}
          >
            {/* Rounded rect */}
            <rect
              width={node.width}
              height={node.height}
              rx={8}
              ry={8}
              className="fill-none stroke-current dark:stroke-white stroke-black"
              strokeWidth={1.5}
              style={{ opacity }}
            />

            {/* Title */}
            <text
              x={node.width / 2}
              y={node.height / 2 - 8}
              textAnchor="middle"
              className="text-xs font-medium fill-current dark:fill-white fill-black pointer-events-none"
              style={{ opacity }}
            >
              {stock.title}
            </text>

            {/* Ticker value */}
            <text
              x={node.width / 2}
              y={node.height / 2 + 12}
              textAnchor="middle"
              className="text-xs font-mono fill-current dark:fill-white fill-black pointer-events-none"
              style={{ opacity }}
            >
              {formattedValue}
            </text>
          </g>
        );
      })}
    </g>
  );
}

