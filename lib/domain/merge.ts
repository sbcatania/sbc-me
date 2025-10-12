import { SystemData, Stock, Flow, Objective, Artifact, Snapshot } from "./types";

/**
 * Merge two SystemData objects by ID, with synced data taking precedence
 */
export function mergeSystemData(
  seed: SystemData,
  synced?: SystemData
): SystemData {
  if (!synced) {
    return seed;
  }

  // Helper to merge arrays by id
  function mergeById<T extends { id: string }>(
    seedItems: T[],
    syncedItems: T[]
  ): T[] {
    const map = new Map<string, T>();

    // Add all seed items
    seedItems.forEach((item) => map.set(item.id, item));

    // Merge or add synced items (last-write-wins)
    syncedItems.forEach((item) => {
      const existing = map.get(item.id);
      if (existing) {
        map.set(item.id, { ...existing, ...item });
      } else {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values());
  }

  // Helper to merge snapshots by date
  function mergeSnapshotsByDate(
    seedSnapshots: Snapshot[],
    syncedSnapshots: Snapshot[]
  ): Snapshot[] {
    const map = new Map<string, Snapshot>();

    // Add all seed snapshots
    seedSnapshots.forEach((snapshot) => map.set(snapshot.date, snapshot));

    // Merge or add synced snapshots (last-write-wins)
    syncedSnapshots.forEach((snapshot) => {
      const existing = map.get(snapshot.date);
      if (existing) {
        map.set(snapshot.date, { ...existing, ...snapshot });
      } else {
        map.set(snapshot.date, snapshot);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  return {
    stocks: mergeById(seed.stocks, synced.stocks),
    flows: mergeById(seed.flows, synced.flows),
    objectives: mergeById(seed.objectives, synced.objectives),
    artifacts: mergeById(seed.artifacts, synced.artifacts),
    snapshots: mergeSnapshotsByDate(seed.snapshots, synced.snapshots),
  };
}

/**
 * Apply snapshot overrides to system data
 */
export function applySnapshot(
  data: SystemData,
  snapshotIndex: number
): SystemData {
  if (snapshotIndex < 0 || snapshotIndex >= data.snapshots.length) {
    return data;
  }

  const snapshot = data.snapshots[snapshotIndex];

  return {
    ...data,
    stocks: data.stocks.map((stock) => {
      const override = snapshot.stockOverrides?.[stock.id];
      return override ? { ...stock, ...override } : stock;
    }),
    flows: data.flows.map((flow) => {
      const override = snapshot.flowOverrides?.[flow.id];
      return override ? { ...flow, ...override } : flow;
    }),
    objectives: data.objectives,
    artifacts: data.artifacts,
    snapshots: data.snapshots,
  };
}

