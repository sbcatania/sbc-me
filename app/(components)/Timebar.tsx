"use client"

import { useStore } from "@/lib/state/store";
import { useEffect, useState } from "react";

export function Timebar() {
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const setSnapshotIndex = useStore((state) => state.setSnapshotIndex);
  
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!systemData) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSnapshotIndex(Math.max(0, snapshotIndex - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSnapshotIndex(Math.min(systemData.snapshots.length - 1, snapshotIndex + 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setSnapshotIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setSnapshotIndex(systemData.snapshots.length - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [systemData, snapshotIndex, setSnapshotIndex]);

  if (!systemData || systemData.snapshots.length === 0) return null;

  const snapshots = systemData.snapshots;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-11 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-black/10 dark:border-white/10 flex items-center px-6 z-40">
      <div className="flex-1 relative">
        {/* Timeline track */}
        <div className="h-0.5 bg-black/10 dark:bg-white/10 relative">
          {/* Milestones */}
          {snapshots.map((snapshot, i) => {
            const hasMillestones = snapshot.milestones && snapshot.milestones.length > 0;
            const position = (i / (snapshots.length - 1)) * 100;

            return (
              <div
                key={snapshot.date}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                {hasMillestones && (
                  <>
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white cursor-pointer"
                      onMouseEnter={() => setHoveredMilestone(snapshot.date)}
                      onMouseLeave={() => setHoveredMilestone(null)}
                    />
                    
                    {hoveredMilestone === snapshot.date && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black dark:bg-white text-white dark:text-black text-xs rounded whitespace-nowrap">
                        {snapshot.milestones!.map((m) => m.label).join(", ")}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Current position handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
            style={{ left: `${(snapshotIndex / (snapshots.length - 1)) * 100}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-black dark:bg-white" />
          </div>
        </div>

        {/* Date labels */}
        <div className="flex justify-between mt-2 text-xs opacity-60">
          {snapshots.map((snapshot, i) => {
            // Only show labels for first, last, and current
            if (i !== 0 && i !== snapshots.length - 1 && i !== snapshotIndex) {
              return <div key={snapshot.date} />;
            }

            return (
              <button
                key={snapshot.date}
                onClick={() => setSnapshotIndex(i)}
                className="hover:opacity-100"
              >
                {snapshot.date}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrubber (invisible but draggable) */}
      <input
        type="range"
        min={0}
        max={snapshots.length - 1}
        value={snapshotIndex}
        onChange={(e) => setSnapshotIndex(parseInt(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
        aria-label="Snapshot timeline"
      />
    </div>
  );
}

