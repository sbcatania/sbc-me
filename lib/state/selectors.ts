import { SystemData, Stock, Flow, Objective, Snapshot } from "@/lib/domain/types";
import { weight, nodeSize, edgeThickness, getEffectiveRate } from "@/lib/domain/normalize";

/**
 * Check if an interval is active at a given snapshot date
 */
function isActiveAtDate(
  active: { start?: string; end?: string | null } | undefined,
  snapshotDate: string
): boolean {
  if (!active) return true;
  
  const { start, end } = active;
  
  if (start && snapshotDate < start) return false;
  if (end && snapshotDate > end) return false;
  
  return true;
}

/**
 * Get active stocks for a snapshot
 */
export function getActiveStocks(
  data: SystemData,
  snapshotIndex: number
): Stock[] {
  if (!data.snapshots[snapshotIndex]) return data.stocks;
  
  const snapshot = data.snapshots[snapshotIndex];
  
  return data.stocks.filter((stock) => {
    // Apply stock overrides if present
    const override = snapshot.stockOverrides?.[stock.id];
    const effectiveActive = override?.active ?? stock.active;
    
    return isActiveAtDate(effectiveActive, snapshot.date);
  });
}

/**
 * Get active flows for a snapshot
 */
export function getActiveFlows(
  data: SystemData,
  snapshotIndex: number,
  activeStocks: Stock[]
): Flow[] {
  if (!data.snapshots[snapshotIndex]) return data.flows;
  
  const snapshot = data.snapshots[snapshotIndex];
  const activeStockIds = new Set(activeStocks.map((s) => s.id));
  
  return data.flows.filter((flow) => {
    // Both endpoints must be active
    if (!activeStockIds.has(flow.from) || !activeStockIds.has(flow.to)) {
      return false;
    }
    
    // Check flow's own active interval
    const override = snapshot.flowOverrides?.[flow.id];
    const effectiveActive = override?.active ?? flow.active;
    
    return isActiveAtDate(effectiveActive, snapshot.date);
  });
}

/**
 * Get active objectives for a snapshot
 */
export function getActiveObjectives(
  data: SystemData,
  snapshotIndex: number
): Objective[] {
  if (!data.snapshots[snapshotIndex]) return data.objectives;
  
  const snapshot = data.snapshots[snapshotIndex];
  
  return data.objectives.filter((objective) => {
    // Check snapshot's explicit objective active flag
    const explicitActive = snapshot.objectiveActive?.[objective.id];
    if (explicitActive !== undefined) {
      return explicitActive;
    }
    
    // Otherwise check objective's own active interval
    return isActiveAtDate(objective.active, snapshot.date);
  });
}

/**
 * Get display weight for a stock (0..1)
 */
export function getStockWeight(
  stock: Stock,
  allStocks: Stock[]
): number {
  const values = allStocks.map((s) => s.value);
  return weight(stock.value, stock.displayDomain, values);
}

/**
 * Get display weight for a flow (0..1)
 */
export function getFlowWeight(
  flow: Flow,
  allFlows: Flow[]
): number {
  const values = allFlows.map((f) => f.rate);
  return weight(flow.rate, flow.displayDomain, values);
}

/**
 * Get display size for a stock (px)
 */
export function getStockSize(
  stock: Stock,
  allStocks: Stock[]
): number {
  const w = getStockWeight(stock, allStocks);
  return nodeSize(w);
}

/**
 * Get display thickness for a flow (px)
 */
export function getFlowThickness(
  flow: Flow,
  allFlows: Flow[]
): number {
  const w = getFlowWeight(flow, allFlows);
  return edgeThickness(w);
}

/**
 * Get items that should be highlighted (100% opacity) given a hover/selection
 */
export function getHighlightedItems(
  item: { kind: "stock" | "flow" | "objective"; id: string } | null,
  data: SystemData
): {
  stocks: Set<string>;
  flows: Set<string>;
  objectives: Set<string>;
} {
  const result = {
    stocks: new Set<string>(),
    flows: new Set<string>(),
    objectives: new Set<string>(),
  };

  if (!item) return result;

  if (item.kind === "stock") {
    result.stocks.add(item.id);
    // Add connected flows
    data.flows.forEach((flow) => {
      if (flow.from === item.id || flow.to === item.id) {
        result.flows.add(flow.id);
        // Add other endpoint
        result.stocks.add(flow.from);
        result.stocks.add(flow.to);
      }
    });
  } else if (item.kind === "flow") {
    const flow = data.flows.find((f) => f.id === item.id);
    if (flow) {
      result.flows.add(flow.id);
      result.stocks.add(flow.from);
      result.stocks.add(flow.to);
    }
  } else if (item.kind === "objective") {
    const objective = data.objectives.find((o) => o.id === item.id);
    if (objective) {
      result.objectives.add(objective.id);
      objective.stocks.forEach((sid) => result.stocks.add(sid));
      objective.flows.forEach((fid) => result.flows.add(fid));
    }
  }

  return result;
}

