"use client"

import { useStore } from "@/lib/state/store";
import { LayoutResult } from "@/lib/layout/elk";
import { getActiveObjectives } from "@/lib/state/selectors";

type ObjectiveSpotlightOverlayProps = {
  layout: LayoutResult;
};

export function ObjectiveSpotlightOverlay({ layout }: ObjectiveSpotlightOverlayProps) {
  const systemData = useStore((state) => state.systemData);
  const snapshotIndex = useStore((state) => state.snapshotIndex);
  const hoveredItem = useStore((state) => state.hoveredItem);

  if (!systemData || !hoveredItem || hoveredItem.kind !== "objective") {
    return null;
  }

  const activeObjectives = getActiveObjectives(systemData, snapshotIndex);
  const objective = activeObjectives.find((o) => o.id === hoveredItem.id);

  if (!objective) return null;

  // Find all nodes that belong to this objective
  const memberNodes = layout.nodes.filter((node) =>
    objective.stocks.includes(node.id)
  );

  if (memberNodes.length === 0) return null;

  // Compute bounding box
  const minX = Math.min(...memberNodes.map((n) => n.x));
  const minY = Math.min(...memberNodes.map((n) => n.y));
  const maxX = Math.max(...memberNodes.map((n) => n.x + n.width));
  const maxY = Math.max(...memberNodes.map((n) => n.y + n.height));

  const padding = 16;

  return (
    <rect
      x={minX - padding}
      y={minY - padding}
      width={maxX - minX + padding * 2}
      height={maxY - minY + padding * 2}
      rx={12}
      className="fill-black dark:fill-white pointer-events-none"
      opacity={0.12}
    />
  );
}

