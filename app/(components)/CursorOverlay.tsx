"use client"

import { useEffect, useState } from "react";
import { useStore } from "@/lib/state/store";

export function CursorOverlay() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOverValve, setIsOverValve] = useState(false);
  const reducedMotion = useStore((state) => state.reducedMotion);

  useEffect(() => {
    // Detect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    useStore.getState().setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      useStore.getState().setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Check if hovering over valve
      const target = e.target as Element;
      const isValve = target.closest(".valves-layer circle") !== null;
      setIsOverValve(isValve);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Hide default cursor
  useEffect(() => {
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        transition: reducedMotion ? "none" : "transform 0.05s ease-out",
      }}
    >
      {isOverValve ? <WrenchCursor /> : <PointerCursor />}
    </div>
  );
}

function PointerCursor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Pixelated pointer */}
      <path
        d="M4 4 L4 20 L8 16 L12 24 L16 22 L12 14 L18 14 L4 4Z"
        fill="currentColor"
        className="text-black dark:text-white"
        style={{ imageRendering: "pixelated" }}
      />
    </svg>
  );
}

function WrenchCursor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Pixelated wrench */}
      <rect x="4" y="10" width="4" height="10" fill="currentColor" className="text-black dark:text-white" />
      <rect x="8" y="8" width="4" height="4" fill="currentColor" className="text-black dark:text-white" />
      <rect x="12" y="6" width="4" height="4" fill="currentColor" className="text-black dark:text-white" />
      <rect x="16" y="4" width="4" height="4" fill="currentColor" className="text-black dark:text-white" />
    </svg>
  );
}

