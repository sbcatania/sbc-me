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

  // Valve positions keyed by Flow.id (0..1, 0.5 = neutral)
  valves: Record<string, number>;
  setValve: (flowId: string, val: number) => void;
  resetValves: () => void;

  // Time
  snapshotIndex: number;
  setSnapshotIndex: (i: number) => void;

  // Preferences
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;

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

    // Valves
    valves: {},
    setValve: (flowId, val) =>
      set((state) => {
        state.valves[flowId] = val;
      }),
    resetValves: () =>
      set((state) => {
        state.valves = {};
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

    // Pan/Zoom
    viewTransform: { x: 0, y: 0, scale: 1 },
    setViewTransform: (transform) =>
      set((state) => {
        state.viewTransform = transform;
      }),
  }))
);

