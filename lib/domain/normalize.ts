import { Stock, Flow } from "./types";
import { clamp01, quantile, lerp, easeOutQuad } from "@/lib/util/math";

// Node size constants (px)
export const NODE_MIN = 54;
export const NODE_MAX = 110;

// Edge thickness constants (px)
export const EDGE_MIN = 1.0;
export const EDGE_MAX = 6.0;

/**
 * Compute normalized weight (0..1) for a value given a domain
 */
export function weight(
  realValue: number,
  displayDomain?: [number, number],
  observedValues?: number[]
): number {
  let min: number;
  let max: number;

  if (displayDomain) {
    [min, max] = displayDomain;
  } else if (observedValues && observedValues.length > 0) {
    // Use robust quantiles to avoid outliers
    const sorted = [...observedValues].sort((a, b) => a - b);
    min = quantile(sorted, 0.1);
    max = quantile(sorted, 0.9);
    
    // Fallback if range is too narrow
    if (max - min < 1e-6) {
      min = Math.min(...sorted);
      max = Math.max(...sorted);
    }
  } else {
    // Default domain
    min = 0;
    max = 1;
  }

  if (max - min < 1e-9) {
    return 0.5; // Avoid division by zero
  }

  return clamp01((realValue - min) / (max - min));
}

/**
 * Map a normalized weight to a node size (px)
 */
export function nodeSize(w: number): number {
  return NODE_MIN + w * (NODE_MAX - NODE_MIN);
}

/**
 * Map a normalized weight to an edge thickness (px) with ease-out
 */
export function edgeThickness(w: number): number {
  return EDGE_MIN + easeOutQuad(w) * (EDGE_MAX - EDGE_MIN);
}

/**
 * Compute valve multiplier from valve position (0..1)
 * 0.5 = neutral (1.0x), 0 = 0.2x, 1 = 1.8x
 */
export function valveMultiplier(valvePosition: number): number {
  return lerp(0.2, 1.8, clamp01(valvePosition));
}

/**
 * Get effective rate for a flow, applying valve position
 */
export function getEffectiveRate(flow: Flow, valvePosition?: number): number {
  const pos = valvePosition ?? flow.valvePosition ?? 0.5;
  return flow.rate * valveMultiplier(pos);
}

