"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useDiagramStore } from "@/lib/store/diagrams";
import { get as idbGet } from "idb-keyval";
import { DiagramDoc } from "@/lib/model/schema";

interface BreadcrumbItem {
  id: string;
  title: string;
  viaStockLabel?: string;
}

async function fetchParentDiagram(parentId: string): Promise<DiagramDoc | null> {
  try {
    const key = `diagram:${parentId}`;
    const data = await idbGet<DiagramDoc>(key);
    return data || null;
  } catch {
    return null;
  }
}

export function Breadcrumb() {
  const router = useRouter();
  const { currentDiagram } = useDiagramStore();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    async function buildBreadcrumbs() {
      if (!currentDiagram) {
        setBreadcrumbs([]);
        return;
      }

      const items: BreadcrumbItem[] = [];

      // Add current diagram first
      items.push({
        id: currentDiagram.id,
        title: currentDiagram.title,
      });

      // Walk up the parent chain
      let parentRef = currentDiagram.parent;
      let lastParentStockId = parentRef?.viaStockId;

      while (parentRef) {
        const parentDiagram = await fetchParentDiagram(parentRef.diagramId);

        if (!parentDiagram) {
          break;
        }

        // Set the via label on the previous item (child)
        if (lastParentStockId && items.length > 0) {
          const viaStock = parentDiagram.nodes[lastParentStockId];
          items[0].viaStockLabel = viaStock?.label;
        }

        // Add this parent to the beginning
        items.unshift({
          id: parentDiagram.id,
          title: parentDiagram.title,
        });

        // Move to next parent
        lastParentStockId = parentDiagram.parent?.viaStockId;
        parentRef = parentDiagram.parent;
      }

      setBreadcrumbs(items);
    }

    buildBreadcrumbs();
  }, [currentDiagram]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 text-sm border-b border-border bg-muted/30">
      <button
        onClick={() => router.push(`/d/${breadcrumbs[0]?.id}`)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-3 w-3" />
      </button>

      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <button
            onClick={() => router.push(`/d/${item.id}`)}
            className={`hover:text-foreground ${
              index === breadcrumbs.length - 1
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            {item.viaStockLabel ? (
              <span>
                <span className="opacity-60">{item.viaStockLabel}</span>
                {" → "}
                {item.title}
              </span>
            ) : (
              item.title
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
