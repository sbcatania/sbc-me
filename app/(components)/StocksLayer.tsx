"use client"

import { useStore } from "@/lib/state/store";
import { LayoutResult } from "@/lib/layout/elk";
import { getActiveStocks, getActiveFlows } from "@/lib/state/selectors";
import { formatValue, formatValueDetailed } from "@/lib/util/format";
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
  const showStocks = useStore((state) => state.showStocks);
  const stockPositions = useStore((state) => state.stockPositions);
  const setStockPosition = useStore((state) => state.setStockPosition);
  const viewTransform = useStore((state) => state.viewTransform);

  const [driftStates, setDriftStates] = useState<Map<string, DriftState>>(new Map());
  const [draggedStock, setDraggedStock] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());

  // Get active stocks and flows (before early return to avoid hook ordering issues)
  const activeStocks = systemData ? getActiveStocks(systemData, snapshotIndex) : [];
  const activeFlows = systemData ? getActiveFlows(systemData, snapshotIndex, activeStocks) : [];

  // Initialize drift states
  useEffect(() => {
    if (!systemData) return;
    
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
  }, [activeStocks, snapshotIndex, systemData]);

  // Animation loop
  useEffect(() => {
    if (!systemData || !showStocks) return;
    
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
  }, [reducedMotion, systemData, showStocks]);

  // Early return AFTER all hooks
  if (!systemData || !showStocks) return null;

  // Handle drag start
  const handleMouseDown = (stockId: string, node: typeof layout.nodes[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedStock(stockId);
    
    // Calculate offset from node position to mouse in SVG coordinates
    const svg = (e.target as SVGElement).ownerSVGElement;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    // Account for view transform
    const worldX = (svgP.x - viewTransform.x) / viewTransform.scale;
    const worldY = (svgP.y - viewTransform.y) / viewTransform.scale;
    
    const currentX = stockPositions[stockId]?.x ?? node.x;
    const currentY = stockPositions[stockId]?.y ?? node.y;
    
    setDragOffset({
      x: worldX - currentX,
      y: worldY - currentY,
    });
  };

  // Handle drag move
  useEffect(() => {
    if (!draggedStock) return;

    const handleMouseMove = (e: MouseEvent) => {
      const svg = document.querySelector('svg');
      if (!svg) return;

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      
      // Account for view transform
      const worldX = (svgP.x - viewTransform.x) / viewTransform.scale;
      const worldY = (svgP.y - viewTransform.y) / viewTransform.scale;

      setStockPosition(
        draggedStock,
        worldX - dragOffset.x,
        worldY - dragOffset.y
      );
    };

    const handleMouseUp = () => {
      setDraggedStock(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedStock, dragOffset, viewTransform, setStockPosition]);

  return (
    <g className="stocks-layer">
      {layout.nodes.map((node) => {
        const stock = activeStocks.find((s) => s.id === node.id);
        if (!stock) return null;

        const driftState = driftStates.get(stock.id);
        const displayValue = driftState ? driftState.displayed : stock.value;
        const formattedValue = formatValue(displayValue, stock.unit);
        const detailedValue = formatValueDetailed(displayValue, stock.unit);

        const isHovered = hoveredItem?.kind === "stock" && hoveredItem.id === stock.id;
        const isSelected = selectedItem?.kind === "stock" && selectedItem.id === stock.id;
        const isDragging = draggedStock === stock.id;

        // Check if this stock is connected to the hovered item
        const isConnected = hoveredItem && (
          (hoveredItem.kind === "stock" && 
            activeFlows.some(f => 
              (f.from === stock.id && f.to === hoveredItem.id) ||
              (f.to === stock.id && f.from === hoveredItem.id)
            )
          )
        );

        const opacity = isHovered || isSelected || isDragging || isConnected ? 1 : hoveredItem || selectedItem ? 0.15 : 1;

        // Use dragged position if available, otherwise layout position
        const x = stockPositions[stock.id]?.x ?? node.x;
        const y = stockPositions[stock.id]?.y ?? node.y;

        return (
          <g
            key={stock.id}
            transform={`translate(${x}, ${y})`}
            data-interactive="true"
            onMouseEnter={() => setHoveredItem({ kind: "stock", id: stock.id })}
            onMouseLeave={() => setHoveredItem(null)}
            onMouseDown={(e) => handleMouseDown(stock.id, node, e)}
            onClick={() => setSelectedItem({ kind: "stock", id: stock.id })}
            className={isDragging ? "cursor-grabbing" : "cursor-grab"}
            tabIndex={0}
            role="button"
            aria-label={stockAriaLabel(stock.title, formattedValue)}
          >
            {/* Rectangle with black background */}
            <rect
              width={node.width}
              height={node.height}
              className="fill-black stroke-current dark:stroke-white stroke-black"
              strokeWidth={1.5}
              style={{ opacity }}
            />

            {/* Title - wrapped text with dynamic size */}
            {(() => {
              // Scale font size based on node dimensions (14px to 24px range)
              const baseFontSize = Math.max(14, Math.min(24, node.width / 12));
              const lineHeight = baseFontSize * 1.3;
              const wrappedLines = wrapText(stock.title, node.width - 20, baseFontSize);
              const totalHeight = wrappedLines.length * lineHeight;
              const startY = (node.height - totalHeight) / 2 + lineHeight / 2;
              
              return wrappedLines.map((line, i) => (
                <text
                  key={i}
                  x={node.width / 2}
                  y={startY + i * lineHeight}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-medium fill-current dark:fill-white fill-black pointer-events-none"
                  style={{ opacity, fontSize: `${baseFontSize}px` }}
                >
                  {line}
                </text>
              ));
            })()}

            {/* Ticker value (outside bottom, left-aligned) */}
            <text
              x={0}
              y={node.height + 12}
              textAnchor="start"
              className="font-mono fill-current dark:fill-white fill-black pointer-events-none"
              style={{ opacity, fontSize: `${Math.max(8, node.width / 25)}px` }}
            >
              {detailedValue} {stock.unit.key}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Wrap text to fit within a given width, accounting for font size
 */
function wrapText(text: string, maxWidth: number, fontSize: number = 14): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  
  // Approximate character width based on font size (0.5 * fontSize is typical for sans-serif)
  const charWidth = fontSize * 0.5;
  const maxChars = Math.floor(maxWidth / charWidth);
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [text];
}

