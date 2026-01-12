"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useDiagramStore } from "@/lib/store/diagrams";
import { usePrefsStore } from "@/lib/store/prefs";
import { Viewport, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from "@/lib/model/schema";
import { clamp, calculateAllEdgeEndpoints } from "@/lib/layout/geometry";
import { NodeStock } from "./NodeStock";
import { EdgeFlow } from "./EdgeFlow";
import { SelectionRect } from "./SelectionRect";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

interface DragState {
  type: "pan" | "node" | "selection" | "edge-create";
  startX: number;
  startY: number;
  startViewport?: Viewport;
  nodeStartPositions?: Record<string, { x: number; y: number }>;
  sourceNodeId?: string;
}

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    currentDiagram,
    selectedNodeIds,
    selectedEdgeIds,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    clearSelection,
    addNode,
    updateNode,
    addEdge,
    deleteSelected,
    setViewport,
  } = useDiagramStore();

  const { prefs } = usePrefsStore();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [tempEdge, setTempEdge] = useState<{
    sourceId: string;
    x: number;
    y: number;
  } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const viewport = useMemo<Viewport>(
    () => currentDiagram?.viewport || { x: 0, y: 0, zoom: 1 },
    [currentDiagram?.viewport]
  );

  // Screen to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (screenX - rect.left - viewport.x) / viewport.zoom,
        y: (screenY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Handle double-click to create node
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== svgRef.current && (e.target as SVGElement).tagName !== "rect") return;

      const canvas = screenToCanvas(e.clientX, e.clientY);
      const nodeId = addNode({
        type: "stock",
        kind: "internal",
        label: "",
        x: canvas.x - DEFAULT_NODE_WIDTH / 2,
        y: canvas.y - DEFAULT_NODE_HEIGHT / 2,
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
      });

      clearSelection();
      setSelectedNodeIds(new Set([nodeId]));
      setEditingNodeId(nodeId);
    },
    [screenToCanvas, addNode, clearSelection, setSelectedNodeIds]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      const target = e.target as SVGElement;
      const isOnNode = target.closest("[data-node-id]");
      const isOnEdge = target.closest("[data-edge-id]");
      const isOnHandle = target.closest("[data-handle]");

      // Edge creation from handle
      if (isOnHandle) {
        const nodeId = isOnHandle.getAttribute("data-node-id");
        if (nodeId) {
          const canvas = screenToCanvas(e.clientX, e.clientY);
          setDragState({
            type: "edge-create",
            startX: e.clientX,
            startY: e.clientY,
            sourceNodeId: nodeId,
          });
          setTempEdge({ sourceId: nodeId, x: canvas.x, y: canvas.y });
          e.stopPropagation();
          return;
        }
      }

      // Pan with space or on empty canvas
      if (spaceHeld || (!isOnNode && !isOnEdge)) {
        if (!isOnNode && !isOnEdge && !e.shiftKey) {
          // Start selection rect if not holding space
          if (!spaceHeld) {
            const canvas = screenToCanvas(e.clientX, e.clientY);
            setDragState({
              type: "selection",
              startX: canvas.x,
              startY: canvas.y,
            });
            setSelectionRect({ x: canvas.x, y: canvas.y, width: 0, height: 0 });
            clearSelection();
            return;
          }
        }

        setDragState({
          type: "pan",
          startX: e.clientX,
          startY: e.clientY,
          startViewport: { ...viewport },
        });
        return;
      }

      // Node selection and drag
      if (isOnNode) {
        const nodeId = isOnNode.getAttribute("data-node-id")!;

        if (e.shiftKey) {
          // Toggle selection
          const newSelection = new Set(selectedNodeIds);
          if (newSelection.has(nodeId)) {
            newSelection.delete(nodeId);
          } else {
            newSelection.add(nodeId);
          }
          setSelectedNodeIds(newSelection);
          setSelectedEdgeIds(new Set());
        } else if (!selectedNodeIds.has(nodeId)) {
          // Select only this node
          setSelectedNodeIds(new Set([nodeId]));
          setSelectedEdgeIds(new Set());
        }

        // Start drag
        const nodeStartPositions: Record<string, { x: number; y: number }> = {};
        const nodesToMove = selectedNodeIds.has(nodeId) ? selectedNodeIds : new Set([nodeId]);
        nodesToMove.forEach((id) => {
          const node = currentDiagram?.nodes[id];
          if (node) {
            nodeStartPositions[id] = { x: node.x, y: node.y };
          }
        });

        if (!selectedNodeIds.has(nodeId)) {
          nodeStartPositions[nodeId] = {
            x: currentDiagram!.nodes[nodeId].x,
            y: currentDiagram!.nodes[nodeId].y,
          };
        }

        setDragState({
          type: "node",
          startX: e.clientX,
          startY: e.clientY,
          nodeStartPositions,
        });
        return;
      }

      // Edge selection
      if (isOnEdge) {
        const edgeId = isOnEdge.getAttribute("data-edge-id")!;
        if (e.shiftKey) {
          const newSelection = new Set(selectedEdgeIds);
          if (newSelection.has(edgeId)) {
            newSelection.delete(edgeId);
          } else {
            newSelection.add(edgeId);
          }
          setSelectedEdgeIds(newSelection);
        } else {
          setSelectedNodeIds(new Set());
          setSelectedEdgeIds(new Set([edgeId]));
        }
      }
    },
    [
      spaceHeld,
      viewport,
      selectedNodeIds,
      selectedEdgeIds,
      currentDiagram,
      screenToCanvas,
      setSelectedNodeIds,
      setSelectedEdgeIds,
      clearSelection,
    ]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      switch (dragState.type) {
        case "pan":
          if (dragState.startViewport) {
            setViewport({
              x: dragState.startViewport.x + dx,
              y: dragState.startViewport.y + dy,
              zoom: viewport.zoom,
            });
          }
          break;

        case "node":
          if (dragState.nodeStartPositions) {
            const canvasDx = dx / viewport.zoom;
            const canvasDy = dy / viewport.zoom;

            Object.entries(dragState.nodeStartPositions).forEach(([id, start]) => {
              updateNode(id, {
                x: start.x + canvasDx,
                y: start.y + canvasDy,
              });
            });
          }
          break;

        case "selection":
          const canvas = screenToCanvas(e.clientX, e.clientY);
          const x = Math.min(dragState.startX, canvas.x);
          const y = Math.min(dragState.startY, canvas.y);
          const width = Math.abs(canvas.x - dragState.startX);
          const height = Math.abs(canvas.y - dragState.startY);
          setSelectionRect({ x, y, width, height });
          break;

        case "edge-create":
          const canvasPos = screenToCanvas(e.clientX, e.clientY);
          setTempEdge((prev) =>
            prev ? { ...prev, x: canvasPos.x, y: canvasPos.y } : null
          );
          break;
      }
    },
    [dragState, viewport, setViewport, updateNode, screenToCanvas]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;

      switch (dragState.type) {
        case "node":
          // Push history after drag
          if (dragState.nodeStartPositions) {
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
              // Moved significantly
            }
          }
          break;

        case "selection":
          if (selectionRect && currentDiagram) {
            // Select nodes that intersect with selection rect
            const selectedNodes = new Set<string>();
            Object.values(currentDiagram.nodes).forEach((node) => {
              if (
                node.x + node.width > selectionRect.x &&
                node.x < selectionRect.x + selectionRect.width &&
                node.y + node.height > selectionRect.y &&
                node.y < selectionRect.y + selectionRect.height
              ) {
                selectedNodes.add(node.id);
              }
            });
            setSelectedNodeIds(selectedNodes);

            // Select edges that have their midpoint in selection rect
            const selectedEdges = new Set<string>();
            const endpoints = calculateAllEdgeEndpoints(
              Object.values(currentDiagram.edges),
              currentDiagram.nodes
            );
            Object.values(currentDiagram.edges).forEach((edge) => {
              const ep = endpoints[edge.id];
              if (ep) {
                // Check if midpoint of edge is in selection rect
                const midX = (ep.start.x + ep.end.x) / 2;
                const midY = (ep.start.y + ep.end.y) / 2;
                if (
                  midX > selectionRect.x &&
                  midX < selectionRect.x + selectionRect.width &&
                  midY > selectionRect.y &&
                  midY < selectionRect.y + selectionRect.height
                ) {
                  selectedEdges.add(edge.id);
                }
              }
            });
            setSelectedEdgeIds(selectedEdges);
          }
          setSelectionRect(null);
          break;

        case "edge-create":
          if (tempEdge) {
            const target = e.target as SVGElement;
            const targetNode = target.closest("[data-node-id]");
            if (targetNode) {
              const targetId = targetNode.getAttribute("data-node-id")!;
              if (targetId !== tempEdge.sourceId) {
                const edgeId = addEdge({
                  type: "flow",
                  sourceId: tempEdge.sourceId,
                  targetId,
                  label: "",
                });
                setEditingEdgeId(edgeId);
              }
            }
          }
          setTempEdge(null);
          break;
      }

      setDragState(null);
    },
    [dragState, selectionRect, currentDiagram, tempEdge, setSelectedNodeIds, addEdge]
  );

  // Handle wheel/trackpad for pan and zoom (Apple Maps style)
  // Using native event listener with passive: false to prevent browser zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = svg.getBoundingClientRect();

      // Pinch to zoom (ctrlKey is set during pinch gestures on trackpad)
      if (e.ctrlKey) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom from pinch gesture
        const delta = -e.deltaY * 0.01;
        const currentViewport = useDiagramStore.getState().currentDiagram?.viewport || { x: 0, y: 0, zoom: 1 };
        const newZoom = clamp(currentViewport.zoom * (1 + delta), MIN_ZOOM, MAX_ZOOM);

        // Zoom towards mouse/pinch position
        const scale = newZoom / currentViewport.zoom;
        const newX = mouseX - (mouseX - currentViewport.x) * scale;
        const newY = mouseY - (mouseY - currentViewport.y) * scale;

        useDiagramStore.getState().setViewport({ x: newX, y: newY, zoom: newZoom });
      } else {
        // Two-finger pan (like Apple Maps)
        const currentViewport = useDiagramStore.getState().currentDiagram?.viewport || { x: 0, y: 0, zoom: 1 };
        useDiagramStore.getState().setViewport({
          x: currentViewport.x - e.deltaX,
          y: currentViewport.y - e.deltaY,
          zoom: currentViewport.zoom,
        });
      }
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when user is typing in an input field
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.code === "Space" && !e.repeat && !isTyping) {
        setSpaceHeld(true);
        e.preventDefault();
      }

      if (editingNodeId || editingEdgeId || isTyping) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (!editingNodeId && !editingEdgeId) {
          deleteSelected();
          e.preventDefault();
        }
      }

      if (e.key === "Escape") {
        clearSelection();
        setEditingNodeId(null);
        setEditingEdgeId(null);
      }

      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        useDiagramStore.getState().selectAll();
        e.preventDefault();
      }

      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        if (e.shiftKey) {
          useDiagramStore.getState().redo();
        } else {
          useDiagramStore.getState().undo();
        }
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpaceHeld(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingNodeId, editingEdgeId, deleteSelected, clearSelection]);

  // Calculate all edge endpoints with proper distribution to avoid overlaps
  // Must be called before early return to satisfy hooks rules
  const edgeEndpoints = useMemo(() => {
    if (!currentDiagram) return {};
    const edgeList = Object.values(currentDiagram.edges);
    return calculateAllEdgeEndpoints(edgeList, currentDiagram.nodes);
  }, [currentDiagram]);

  if (!currentDiagram) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading diagram...
      </div>
    );
  }

  const nodes = Object.values(currentDiagram.nodes);
  const edges = Object.values(currentDiagram.edges);
  const labelMode = currentDiagram.ui?.labelMode || prefs.labelModeDefault;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${
        prefs.grid.style === "lines" ? "canvas-grid-lines" :
        prefs.grid.style === "dotted" ? "canvas-grid-dotted" : "bg-background"
      }`}
      style={{ cursor: spaceHeld || dragState?.type === "pan" ? "grab" : "default" }}
    >
      <svg
        ref={svgRef}
        className="h-full w-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <defs>
          {/* Arrowhead marker (kept for potential future use) */}
        </defs>

        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Edges */}
          {edges.map((edge) => (
            <EdgeFlow
              key={edge.id}
              edge={edge}
              sourceNode={currentDiagram.nodes[edge.sourceId]}
              targetNode={currentDiagram.nodes[edge.targetId]}
              endpoints={edgeEndpoints[edge.id]}
              selected={selectedEdgeIds.has(edge.id)}
              labelMode={labelMode}
              editing={editingEdgeId === edge.id}
              onEditStart={() => setEditingEdgeId(edge.id)}
              onEditEnd={() => setEditingEdgeId(null)}
            />
          ))}

          {/* Temporary edge while creating */}
          {tempEdge && currentDiagram.nodes[tempEdge.sourceId] && (
            <line
              x1={
                currentDiagram.nodes[tempEdge.sourceId].x +
                currentDiagram.nodes[tempEdge.sourceId].width / 2
              }
              y1={
                currentDiagram.nodes[tempEdge.sourceId].y +
                currentDiagram.nodes[tempEdge.sourceId].height / 2
              }
              x2={tempEdge.x}
              y2={tempEdge.y}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              strokeOpacity="0.5"
            />
          )}

          {/* Nodes */}
          {nodes.map((node) => (
            <NodeStock
              key={node.id}
              node={node}
              selected={selectedNodeIds.has(node.id)}
              editing={editingNodeId === node.id}
              onEditStart={() => setEditingNodeId(node.id)}
              onEditEnd={() => setEditingNodeId(null)}
            />
          ))}

          {/* Selection rectangle */}
          {selectionRect && (
            <SelectionRect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
            />
          )}
        </g>
      </svg>
    </div>
  );
}
