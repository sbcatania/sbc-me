import { lerp, clamp } from "@/lib/util/math";

export type DriftState = {
  base: number;
  phase: number;
  omega: number; // radians per second
  amplitude: number;
  displayed: number;
  biasOffset: number;
  nextBiasTime: number;
};

/**
 * Initialize drift state for a value
 */
export function initDriftState(baseValue: number): DriftState {
  const amplitude = clamp(
    0.0005 * Math.abs(baseValue),
    0.0003,
    0.005
  );
  
  const omega = 0.6 + Math.random() * 0.4; // 0.6-1.0 rad/s
  
  return {
    base: baseValue,
    phase: Math.random() * Math.PI * 2,
    omega,
    amplitude,
    displayed: baseValue,
    biasOffset: 0,
    nextBiasTime: Date.now() + 8000 + Math.random() * 4000,
  };
}

/**
 * Update drift state for one frame
 */
export function updateDriftState(
  state: DriftState,
  dt: number, // seconds
  reducedMotion: boolean
): DriftState {
  const now = Date.now();
  
  // Update phase
  const newPhase = state.phase + dt * state.omega;
  
  // Check if we should add a new bias offset
  let biasOffset = state.biasOffset;
  let nextBiasTime = state.nextBiasTime;
  
  if (now > nextBiasTime) {
    biasOffset = (Math.random() - 0.5) * state.amplitude * 0.66;
    nextBiasTime = now + 8000 + Math.random() * 4000;
  }
  
  // Compute target value
  const amplitude = reducedMotion ? state.amplitude * 0.2 : state.amplitude;
  const target = state.base + amplitude * Math.sin(newPhase) + biasOffset;
  
  // Smooth lerp toward target
  const newDisplayed = lerp(state.displayed, target, 0.08);
  
  return {
    ...state,
    phase: newPhase,
    displayed: newDisplayed,
    biasOffset,
    nextBiasTime,
  };
}

/**
 * Update the base value (when snapshot changes)
 */
export function updateDriftBase(state: DriftState, newBase: number): DriftState {
  return {
    ...state,
    base: newBase,
  };
}

