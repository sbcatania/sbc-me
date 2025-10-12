import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { SystemData } from "@/lib/domain/types";

export type ItemSelection = {
  kind: "stock" | "flow" | "objective";
  id: string;
} | null;

export type SessionState = {
  // Data
  systemData: SystemData | null;
  setSystemData: (data: SystemData) => void;

  // Selection & hover
  selectedItem: ItemSelection;
  hoveredItem: ItemSelection;
  setSelectedItem: (item: ItemSelection) => void;
  setHoveredItem: (item: ItemSelection) => void;

  // Time
  snapshotIndex: number;
  setSnapshotIndex: (i: number) => void;

  // Preferences
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;

  // Visibility toggles
  showStocks: boolean;
  showFlows: boolean;
  setShowStocks: (val: boolean) => void;
  setShowFlows: (val: boolean) => void;

  // Stock positions (overrides from dragging)
  stockPositions: Record<string, { x: number; y: number }>;
  setStockPosition: (stockId: string, x: number, y: number) => void;
  resetStockPositions: () => void;

  // Pan/Zoom
  viewTransform: { x: number; y: number; scale: number };
  setViewTransform: (transform: { x: number; y: number; scale: number }) => void;
};

export const useStore = create<SessionState>()(
  immer((set) => ({
    // Data
    systemData: null,
    setSystemData: (data) =>
      set((state) => {
        state.systemData = data;
      }),

    // Selection & hover
    selectedItem: null,
    hoveredItem: null,
    setSelectedItem: (item) =>
      set((state) => {
        state.selectedItem = item;
      }),
    setHoveredItem: (item) =>
      set((state) => {
        state.hoveredItem = item;
      }),

    // Time
    snapshotIndex: 0,
    setSnapshotIndex: (i) =>
      set((state) => {
        state.snapshotIndex = i;
      }),

    // Preferences
    reducedMotion: false,
    setReducedMotion: (val) =>
      set((state) => {
        state.reducedMotion = val;
      }),

    // Visibility toggles
    showStocks: true,
    showFlows: true,
    setShowStocks: (val) =>
      set((state) => {
        state.showStocks = val;
      }),
    setShowFlows: (val) =>
      set((state) => {
        state.showFlows = val;
      }),

    // Stock positions
    stockPositions: {},
    setStockPosition: (stockId, x, y) =>
      set((state) => {
        state.stockPositions[stockId] = { x, y };
      }),
    resetStockPositions: () =>
      set((state) => {
        state.stockPositions = {};
      }),

    // Pan/Zoom
    viewTransform: { x: 0, y: 0, scale: 1 },
    setViewTransform: (transform) =>
      set((state) => {
        state.viewTransform = transform;
      }),
  }))
);

