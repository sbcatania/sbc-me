"use client"

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/state/store";
import { LayoutResult } from "@/lib/layout/elk";
import { getActiveFlows, getActiveStocks, getFlowWeight } from "@/lib/state/selectors";
import {
  ParticleEmitter,
  updateParticles,
  getPositionOnPath,
  calculatePathLength,
} from "@/lib/anim/particles";
import * as PIXI from "pixi.js";

type ParticlesLayerProps = {
  layout: LayoutResult;
};

export function ParticlesLayer({ layout }: ParticlesLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const emittersRef = useRef<Map<string, ParticleEmitter>>(new Map());
  
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const valves = useStore((state) => state.valves);
  const reducedMotion = useStore((state) => state.reducedMotion);

  // Initialize Pixi app
  useEffect(() => {
    if (!containerRef.current || reducedMotion) return;

    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xffffff,
      backgroundAlpha: 0,
      antialias: true,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    return () => {
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, [reducedMotion]);

  // Animation loop
  useEffect(() => {
    if (!appRef.current || !systemData || reducedMotion) return;

    const app = appRef.current;
    const activeStocks = getActiveStocks(systemData, snapshotIndex);
    const activeFlows = getActiveFlows(systemData, snapshotIndex, activeStocks);

    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      app.stage.removeChildren();

      // Update emitters
      layout.edges.forEach((edge) => {
        const flow = activeFlows.find((f) => f.id === edge.id);
        if (!flow || edge.points.length < 2) return;

        const weight = getFlowWeight(flow, activeFlows, valves[flow.id]);
        const pathLength = calculatePathLength(edge.points);

        let emitter = emittersRef.current.get(flow.id);
        if (!emitter) {
          emitter = {
            flowId: flow.id,
            path: edge.points,
            thickness: weight,
            lastEmitTime: Date.now(),
            particles: [],
          };
        } else {
          emitter = {
            ...emitter,
            path: edge.points,
            thickness: weight,
          };
        }

        emitter = updateParticles(emitter, dt, pathLength);
        emittersRef.current.set(flow.id, emitter);

        // Draw particles
        emitter.particles.forEach((particle) => {
          const pos = getPositionOnPath(edge.points, particle.progress);
          
          const graphics = new PIXI.Graphics();
          graphics.beginFill(0x000000, particle.opacity);
          graphics.drawRect(pos.x - 1, pos.y - 1, 2, 2);
          graphics.endFill();
          
          app.stage.addChild(graphics);
        });
      });
    };

    const ticker = PIXI.Ticker.shared;
    ticker.add(animate);

    return () => {
      ticker.remove(animate);
    };
  }, [layout, systemData, snapshotIndex, valves, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

