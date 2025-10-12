import { lerp, clamp } from "@/lib/util/math";

export type Particle = {
  id: string;
  flowId: string;
  progress: number; // 0..1 along the path
  opacity: number;
};

export type ParticleEmitter = {
  flowId: string;
  path: { x: number; y: number }[];
  thickness: number; // normalized weight
  lastEmitTime: number;
  particles: Particle[];
};

/**
 * Compute emission interval based on thickness
 */
export function getEmissionInterval(normalizedThickness: number): number {
  return clamp(1200 - 900 * normalizedThickness, 250, 1200);
}

/**
 * Compute particle speed based on thickness
 */
export function getParticleSpeed(normalizedThickness: number): number {
  return lerp(40, 140, normalizedThickness); // px/sec
}

/**
 * Update particles for one frame
 */
export function updateParticles(
  emitter: ParticleEmitter,
  dt: number, // seconds
  pathLength: number
): ParticleEmitter {
  const now = Date.now();
  const emitInterval = getEmissionInterval(emitter.thickness);
  const speed = getParticleSpeed(emitter.thickness);
  
  // Update existing particles
  const updatedParticles = emitter.particles
    .map((particle) => {
      const progressDelta = (speed * dt) / Math.max(pathLength, 1);
      const newProgress = particle.progress + progressDelta;
      
      // Fade in/out
      let opacity = particle.opacity;
      if (newProgress < 0.1) {
        opacity = newProgress / 0.1;
      } else if (newProgress > 0.9) {
        opacity = (1 - newProgress) / 0.1;
      } else {
        opacity = 1;
      }
      
      return {
        ...particle,
        progress: newProgress,
        opacity: clamp(opacity, 0, 1),
      };
    })
    .filter((p) => p.progress <= 1); // Remove completed particles
  
  // Emit new particle if needed
  let lastEmitTime = emitter.lastEmitTime;
  let particles = updatedParticles;
  
  if (now - lastEmitTime > emitInterval) {
    particles.push({
      id: `${emitter.flowId}_${now}`,
      flowId: emitter.flowId,
      progress: 0,
      opacity: 0,
    });
    lastEmitTime = now;
  }
  
  return {
    ...emitter,
    lastEmitTime,
    particles,
  };
}

/**
 * Get position along a path for a given progress (0..1)
 */
export function getPositionOnPath(
  path: { x: number; y: number }[],
  progress: number
): { x: number; y: number } {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];
  
  // Compute cumulative lengths
  const lengths: number[] = [0];
  let totalLength = 0;
  
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    totalLength += len;
    lengths.push(totalLength);
  }
  
  const targetDist = progress * totalLength;
  
  // Find segment
  for (let i = 1; i < lengths.length; i++) {
    if (targetDist <= lengths[i]) {
      const segmentProgress = (targetDist - lengths[i - 1]) / (lengths[i] - lengths[i - 1]);
      return {
        x: lerp(path[i - 1].x, path[i].x, segmentProgress),
        y: lerp(path[i - 1].y, path[i].y, segmentProgress),
      };
    }
  }
  
  return path[path.length - 1];
}

/**
 * Calculate total path length
 */
export function calculatePathLength(path: { x: number; y: number }[]): number {
  if (path.length < 2) return 0;
  
  let totalLength = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  
  return totalLength;
}

