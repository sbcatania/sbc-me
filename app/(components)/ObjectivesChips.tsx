"use client"

import { useStore } from "@/lib/state/store";
import { getActiveObjectives } from "@/lib/state/selectors";
import { objectiveAriaLabel } from "@/lib/a11y/aria";

export function ObjectivesChips() {
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const hoveredItem = useStore((state) => state.hoveredItem);
  const setHoveredItem = useStore((state) => state.setHoveredItem);
  const setSelectedItem = useStore((state) => state.setSelectedItem);

  if (!systemData) return null;

  const activeObjectives = getActiveObjectives(systemData, snapshotIndex);

  if (activeObjectives.length === 0) return null;

  return (
    <div className="absolute top-20 right-6 z-40 flex flex-col gap-2 pointer-events-none">
      {activeObjectives.map((objective) => {
        const isHovered = hoveredItem?.kind === "objective" && hoveredItem.id === objective.id;

        return (
          <button
            key={objective.id}
            className="px-3 py-1.5 text-[11px] rounded-full bg-black/15 dark:bg-white/15 hover:bg-black/30 dark:hover:bg-white/30 transition-colors pointer-events-auto"
            style={{ opacity: isHovered ? 1 : 0.5 }}
            onMouseEnter={() => setHoveredItem({ kind: "objective", id: objective.id })}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => setSelectedItem({ kind: "objective", id: objective.id })}
            aria-label={objectiveAriaLabel(objective.title)}
          >
            {objective.title}
          </button>
        );
      })}
    </div>
  );
}

