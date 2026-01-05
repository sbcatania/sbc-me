"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import {
  DiagramDoc,
  DiagramDocSchema,
  Node,
  Edge,
  Frame,
  DEFAULT_VIEWPORT,
  Viewport,
} from "@/lib/model/schema";
import { generateDiagramId, generateNodeId, generateEdgeId, generateFrameId } from "@/lib/model/ids";

const DIAGRAM_PREFIX = "diagram:";
const DIAGRAMS_INDEX_KEY = "diagrams:index";

interface DiagramIndex {
  [id: string]: {
    id: string;
    title: string;
    updatedAt: number;
  };
}

// History for undo/redo
interface HistoryEntry {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  frames?: Record<string, Frame>;
}

interface DiagramState {
  // State
  initialized: boolean;
  diagrams: DiagramIndex;
  currentDiagramId: string | null;
  currentDiagram: DiagramDoc | null;

  // Selection
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  initialize: () => Promise<void>;
  loadDiagram: (id: string) => Promise<DiagramDoc | null>;
  createDiagram: (title: string, parentRef?: { diagramId: string; viaStockId: string }, initialContent?: Partial<DiagramDoc>) => string;
  updateDiagram: (id: string, updates: Partial<DiagramDoc>) => void;
  deleteDiagram: (id: string) => Promise<void>;
  duplicateDiagram: (id: string) => Promise<string>;

  // Node actions
  addNode: (node: Omit<Node, "id">) => string;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;

  // Edge actions
  addEdge: (edge: Omit<Edge, "id">) => string;
  updateEdge: (id: string, updates: Partial<Edge>) => void;
  deleteEdge: (id: string) => void;

  // Frame actions
  addFrame: (frame: Omit<Frame, "id">) => string;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  deleteFrame: (id: string) => void;

  // Selection
  setSelectedNodeIds: (ids: Set<string>) => void;
  setSelectedEdgeIds: (ids: Set<string>) => void;
  clearSelection: () => void;
  selectAll: () => void;
  deleteSelected: () => void;

  // Viewport
  setViewport: (viewport: Viewport) => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Persistence
  saveDiagram: () => Promise<void>;
}

export const useDiagramStore = create<DiagramState>()(
  subscribeWithSelector((set, get) => ({
    initialized: false,
    diagrams: {},
    currentDiagramId: null,
    currentDiagram: null,
    selectedNodeIds: new Set(),
    selectedEdgeIds: new Set(),
    history: [],
    historyIndex: -1,

    initialize: async () => {
      try {
        const indexData = await idbGet<DiagramIndex>(DIAGRAMS_INDEX_KEY);
        set({ diagrams: indexData || {}, initialized: true });
      } catch (error) {
        console.error("Failed to initialize diagram store:", error);
        set({ diagrams: {}, initialized: true });
      }
    },

    loadDiagram: async (id: string) => {
      try {
        const data = await idbGet<DiagramDoc>(`${DIAGRAM_PREFIX}${id}`);
        if (data) {
          const validated = DiagramDocSchema.parse(data);
          set({
            currentDiagramId: id,
            currentDiagram: validated,
            selectedNodeIds: new Set(),
            selectedEdgeIds: new Set(),
            history: [{
              nodes: { ...validated.nodes },
              edges: { ...validated.edges },
              frames: validated.frames ? { ...validated.frames } : undefined,
            }],
            historyIndex: 0,
          });
          return validated;
        }
        return null;
      } catch (error) {
        console.error("Failed to load diagram:", error);
        return null;
      }
    },

    createDiagram: (title: string, parentRef?: { diagramId: string; viaStockId: string }, initialContent?: Partial<DiagramDoc>) => {
      const id = generateDiagramId();
      const now = Date.now();

      const diagram: DiagramDoc = {
        version: 1,
        id,
        title,
        createdAt: now,
        updatedAt: now,
        parent: parentRef,
        viewport: initialContent?.viewport ?? DEFAULT_VIEWPORT,
        ui: initialContent?.ui ?? {
          labelMode: "hover",
          hasRunInitialAutoLayout: false,
          hasManualLayoutEdits: false,
        },
        nodes: initialContent?.nodes ?? {},
        edges: initialContent?.edges ?? {},
        frames: initialContent?.frames ?? {},
        notes: initialContent?.notes ?? {},
      };

      // Update index
      const newIndex = {
        ...get().diagrams,
        [id]: { id, title, updatedAt: now },
      };

      set({
        diagrams: newIndex,
        currentDiagramId: id,
        currentDiagram: diagram,
        selectedNodeIds: new Set(),
        selectedEdgeIds: new Set(),
        history: [{
          nodes: initialContent?.nodes ?? {},
          edges: initialContent?.edges ?? {},
          frames: initialContent?.frames ?? {},
        }],
        historyIndex: 0,
      });

      // Persist
      idbSet(`${DIAGRAM_PREFIX}${id}`, diagram);
      idbSet(DIAGRAMS_INDEX_KEY, newIndex);

      return id;
    },

    updateDiagram: (id: string, updates: Partial<DiagramDoc>) => {
      const { currentDiagram, diagrams } = get();
      if (!currentDiagram || currentDiagram.id !== id) return;

      const updated = {
        ...currentDiagram,
        ...updates,
        updatedAt: Date.now(),
      };

      const newIndex = {
        ...diagrams,
        [id]: { id, title: updated.title, updatedAt: updated.updatedAt },
      };

      set({
        currentDiagram: updated,
        diagrams: newIndex,
      });
    },

    deleteDiagram: async (id: string) => {
      const { diagrams } = get();
      const newIndex = { ...diagrams };
      delete newIndex[id];

      await idbDel(`${DIAGRAM_PREFIX}${id}`);
      await idbSet(DIAGRAMS_INDEX_KEY, newIndex);

      set({
        diagrams: newIndex,
        currentDiagramId: get().currentDiagramId === id ? null : get().currentDiagramId,
        currentDiagram: get().currentDiagramId === id ? null : get().currentDiagram,
      });
    },

    duplicateDiagram: async (id: string) => {
      const data = await idbGet<DiagramDoc>(`${DIAGRAM_PREFIX}${id}`);
      if (!data) throw new Error("Diagram not found");

      const newId = generateDiagramId();
      const now = Date.now();

      const newDiagram: DiagramDoc = {
        ...data,
        id: newId,
        title: `${data.title} (Copy)`,
        createdAt: now,
        updatedAt: now,
        parent: undefined, // Remove parent reference on duplicate
      };

      const newIndex = {
        ...get().diagrams,
        [newId]: { id: newId, title: newDiagram.title, updatedAt: now },
      };

      await idbSet(`${DIAGRAM_PREFIX}${newId}`, newDiagram);
      await idbSet(DIAGRAMS_INDEX_KEY, newIndex);

      set({ diagrams: newIndex });

      return newId;
    },

    addNode: (nodeData: Omit<Node, "id">) => {
      const { currentDiagram, pushHistory } = get();
      if (!currentDiagram) return "";

      pushHistory();

      const id = generateNodeId();
      const node: Node = { ...nodeData, id } as Node;

      const updated = {
        ...currentDiagram,
        nodes: { ...currentDiagram.nodes, [id]: node },
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });

      return id;
    },

    updateNode: (id: string, updates: Partial<Node>) => {
      const { currentDiagram } = get();
      if (!currentDiagram || !currentDiagram.nodes[id]) return;

      // Mark manual layout edit if position changed
      const positionChanged = updates.x !== undefined || updates.y !== undefined;

      const updated = {
        ...currentDiagram,
        nodes: {
          ...currentDiagram.nodes,
          [id]: { ...currentDiagram.nodes[id], ...updates },
        },
        ui: positionChanged ? {
          ...currentDiagram.ui,
          hasManualLayoutEdits: true,
        } : currentDiagram.ui,
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });
    },

    deleteNode: (id: string) => {
      const { currentDiagram, pushHistory } = get();
      if (!currentDiagram) return;

      pushHistory();

      const newNodes = { ...currentDiagram.nodes };
      delete newNodes[id];

      // Also delete edges connected to this node
      const newEdges = { ...currentDiagram.edges };
      Object.keys(newEdges).forEach((edgeId) => {
        const edge = newEdges[edgeId];
        if (edge.sourceId === id || edge.targetId === id) {
          delete newEdges[edgeId];
        }
      });

      const updated = {
        ...currentDiagram,
        nodes: newNodes,
        edges: newEdges,
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });
    },

    addEdge: (edgeData: Omit<Edge, "id">) => {
      const { currentDiagram, pushHistory } = get();
      if (!currentDiagram) return "";

      pushHistory();

      const id = generateEdgeId();
      const edge: Edge = { ...edgeData, id } as Edge;

      const updated = {
        ...currentDiagram,
        edges: { ...currentDiagram.edges, [id]: edge },
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });

      return id;
    },

    updateEdge: (id: string, updates: Partial<Edge>) => {
      const { currentDiagram } = get();
      if (!currentDiagram || !currentDiagram.edges[id]) return;

      const updated = {
        ...currentDiagram,
        edges: {
          ...currentDiagram.edges,
          [id]: { ...currentDiagram.edges[id], ...updates },
        },
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });
    },

    deleteEdge: (id: string) => {
      const { currentDiagram, pushHistory } = get();
      if (!currentDiagram) return;

      pushHistory();

      const newEdges = { ...currentDiagram.edges };
      delete newEdges[id];

      const updated = {
        ...currentDiagram,
        edges: newEdges,
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });
    },

    addFrame: (frameData: Omit<Frame, "id">) => {
      const { currentDiagram, pushHistory } = get();
      if (!currentDiagram) return "";

      pushHistory();

      const id = generateFrameId();
      const frame: Frame = { ...frameData, id } as Frame;

      const updated = {
        ...currentDiagram,
        frames: { ...currentDiagram.frames, [id]: frame },
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });

      return id;
    },

    updateFrame: (id: string, updates: Partial<Frame>) => {
      const { currentDiagram } = get();
      if (!currentDiagram || !currentDiagram.frames?.[id]) return;

      const updated = {
        ...currentDiagram,
        frames: {
          ...currentDiagram.frames,
          [id]: { ...currentDiagram.frames[id], ...updates },
        },
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });
    },

    deleteFrame: (id: string) => {
      const { currentDiagram, pushHistory } = get();
      if (!currentDiagram) return;

      pushHistory();

      const newFrames = { ...currentDiagram.frames };
      delete newFrames[id];

      const updated = {
        ...currentDiagram,
        frames: newFrames,
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });
    },

    setSelectedNodeIds: (ids: Set<string>) => {
      set({ selectedNodeIds: ids });
    },

    setSelectedEdgeIds: (ids: Set<string>) => {
      set({ selectedEdgeIds: ids });
    },

    clearSelection: () => {
      set({ selectedNodeIds: new Set(), selectedEdgeIds: new Set() });
    },

    selectAll: () => {
      const { currentDiagram } = get();
      if (!currentDiagram) return;

      set({
        selectedNodeIds: new Set(Object.keys(currentDiagram.nodes)),
        selectedEdgeIds: new Set(Object.keys(currentDiagram.edges)),
      });
    },

    deleteSelected: () => {
      const { currentDiagram, selectedNodeIds, selectedEdgeIds, pushHistory } = get();
      if (!currentDiagram) return;

      if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;

      pushHistory();

      const newNodes = { ...currentDiagram.nodes };
      const newEdges = { ...currentDiagram.edges };

      // Delete selected nodes
      selectedNodeIds.forEach((id) => {
        delete newNodes[id];
      });

      // Delete selected edges and edges connected to deleted nodes
      Object.keys(newEdges).forEach((edgeId) => {
        const edge = newEdges[edgeId];
        if (
          selectedEdgeIds.has(edgeId) ||
          selectedNodeIds.has(edge.sourceId) ||
          selectedNodeIds.has(edge.targetId)
        ) {
          delete newEdges[edgeId];
        }
      });

      const updated = {
        ...currentDiagram,
        nodes: newNodes,
        edges: newEdges,
        updatedAt: Date.now(),
      };

      set({
        currentDiagram: updated,
        selectedNodeIds: new Set(),
        selectedEdgeIds: new Set(),
      });
    },

    setViewport: (viewport: Viewport) => {
      const { currentDiagram } = get();
      if (!currentDiagram) return;

      const updated = {
        ...currentDiagram,
        viewport,
        updatedAt: Date.now(),
      };

      set({ currentDiagram: updated });
    },

    pushHistory: () => {
      const { currentDiagram, history, historyIndex } = get();
      if (!currentDiagram) return;

      // Truncate future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);

      newHistory.push({
        nodes: JSON.parse(JSON.stringify(currentDiagram.nodes)),
        edges: JSON.parse(JSON.stringify(currentDiagram.edges)),
        frames: currentDiagram.frames ? JSON.parse(JSON.stringify(currentDiagram.frames)) : undefined,
      });

      // Limit history size
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    undo: () => {
      const { currentDiagram, history, historyIndex } = get();
      if (!currentDiagram || historyIndex <= 0) return;

      const prevState = history[historyIndex - 1];

      const updated = {
        ...currentDiagram,
        nodes: JSON.parse(JSON.stringify(prevState.nodes)),
        edges: JSON.parse(JSON.stringify(prevState.edges)),
        frames: prevState.frames ? JSON.parse(JSON.stringify(prevState.frames)) : currentDiagram.frames,
        updatedAt: Date.now(),
      };

      set({
        currentDiagram: updated,
        historyIndex: historyIndex - 1,
      });
    },

    redo: () => {
      const { currentDiagram, history, historyIndex } = get();
      if (!currentDiagram || historyIndex >= history.length - 1) return;

      const nextState = history[historyIndex + 1];

      const updated = {
        ...currentDiagram,
        nodes: JSON.parse(JSON.stringify(nextState.nodes)),
        edges: JSON.parse(JSON.stringify(nextState.edges)),
        frames: nextState.frames ? JSON.parse(JSON.stringify(nextState.frames)) : currentDiagram.frames,
        updatedAt: Date.now(),
      };

      set({
        currentDiagram: updated,
        historyIndex: historyIndex + 1,
      });
    },

    saveDiagram: async () => {
      const { currentDiagram, diagrams } = get();
      if (!currentDiagram) return;

      await idbSet(`${DIAGRAM_PREFIX}${currentDiagram.id}`, currentDiagram);
      await idbSet(DIAGRAMS_INDEX_KEY, diagrams);
    },
  }))
);

// Auto-save with debounce
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

useDiagramStore.subscribe(
  (state) => state.currentDiagram,
  (currentDiagram) => {
    if (!currentDiagram) return;

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      useDiagramStore.getState().saveDiagram();
    }, 500);
  }
);
