"use client";

import React, { useState, useMemo } from "react";
import { useDiagramStore } from "@/lib/store/diagrams";
import { FilterBar, FilterType, SortConfig } from "./FilterBar";
import { DataTable } from "./DataTable";

export type TableItem = {
  id: string;
  type: "stock" | "flow";
  label: string;
  sourceId?: string;
  targetId?: string;
  sourceName?: string;
  targetName?: string;
  attributes?: Record<string, unknown>;
};

export function DatabaseView() {
  const { currentDiagram, selectedNodeIds, selectedEdgeIds, setSelectedNodeIds, setSelectedEdgeIds } =
    useDiagramStore();
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortConfig>({ column: "label", direction: "asc" });

  const items = useMemo(() => {
    if (!currentDiagram) return [];

    const nodes = Object.values(currentDiagram.nodes);
    const edges = Object.values(currentDiagram.edges);
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const stockItems: TableItem[] = nodes.map((node) => ({
      id: node.id,
      type: "stock" as const,
      label: node.label,
      attributes: node.attributes,
    }));

    const flowItems: TableItem[] = edges.map((edge) => ({
      id: edge.id,
      type: "flow" as const,
      label: edge.label,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      sourceName: nodeMap.get(edge.sourceId)?.label || "Unknown",
      targetName: nodeMap.get(edge.targetId)?.label || "Unknown",
      attributes: edge.attributes,
    }));

    let result = [...stockItems, ...flowItems];

    // Apply filter
    if (filter === "stocks") {
      result = result.filter((item) => item.type === "stock");
    } else if (filter === "flows") {
      result = result.filter((item) => item.type === "flow");
    }

    // Apply sort - stocks always before flows, then sort within each type
    result.sort((a, b) => {
      // First, always sort by type (stocks before flows)
      if (a.type !== b.type) {
        return a.type === "stock" ? -1 : 1;
      }

      // Then sort by the selected column within each type
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sort.column === "type") {
        // Already sorted by type above
        return 0;
      } else if (sort.column === "label") {
        aVal = a.label.toLowerCase();
        bVal = b.label.toLowerCase();
      } else if (sort.column === "source") {
        aVal = a.sourceName?.toLowerCase() || "";
        bVal = b.sourceName?.toLowerCase() || "";
      } else if (sort.column === "target") {
        aVal = a.targetName?.toLowerCase() || "";
        bVal = b.targetName?.toLowerCase() || "";
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [currentDiagram, filter, sort]);

  const properties = currentDiagram?.propertySchema?.properties || [];

  const handleRowSelect = (id: string, type: "stock" | "flow") => {
    if (type === "stock") {
      setSelectedNodeIds(new Set([id]));
      setSelectedEdgeIds(new Set());
    } else {
      setSelectedEdgeIds(new Set([id]));
      setSelectedNodeIds(new Set());
    }
  };

  const isSelected = (id: string, type: "stock" | "flow") => {
    return type === "stock"
      ? selectedNodeIds.has(id)
      : selectedEdgeIds.has(id);
  };

  if (!currentDiagram) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No system selected
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        itemCount={items.length}
      />
      <div className="flex-1 overflow-auto">
        <DataTable
          items={items}
          properties={properties}
          onRowSelect={handleRowSelect}
          isSelected={isSelected}
        />
      </div>
    </div>
  );
}
