"use client";

import React, { useState } from "react";
import { useDiagramStore } from "@/lib/store/diagrams";
import { PropertyDefinition } from "@/lib/model/schema";
import { TableItem } from "./DatabaseView";
import { PropertyCell } from "./cells";
import { cn } from "@/lib/utils";

interface TableRowProps {
  item: TableItem;
  properties: PropertyDefinition[];
  isSelected: boolean;
  onSelect: () => void;
}

export function TableRow({ item, properties, isSelected, onSelect }: TableRowProps) {
  const { updateNode, updateEdge } = useDiagramStore();
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(item.label);

  const handleLabelSave = () => {
    if (labelValue.trim() && labelValue !== item.label) {
      if (item.type === "stock") {
        updateNode(item.id, { label: labelValue.trim() });
      } else {
        updateEdge(item.id, { label: labelValue.trim() });
      }
    } else {
      setLabelValue(item.label);
    }
    setEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLabelSave();
    } else if (e.key === "Escape") {
      setLabelValue(item.label);
      setEditingLabel(false);
    }
  };

  const handleAttributeChange = (propId: string, value: unknown) => {
    const newAttributes = { ...item.attributes, [propId]: value };
    if (item.type === "stock") {
      updateNode(item.id, { attributes: newAttributes });
    } else {
      updateEdge(item.id, { attributes: newAttributes });
    }
  };

  return (
    <tr
      className={cn(
        "border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-accent"
      )}
      onClick={onSelect}
    >
      {/* Type column */}
      <td className="px-4 py-2">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded",
            item.type === "stock"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          )}
        >
          {item.type === "stock" ? "Stock" : "Flow"}
        </span>
      </td>

      {/* Label column */}
      <td className="px-4 py-2">
        {editingLabel ? (
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={handleLabelKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full px-1 py-0.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        ) : (
          <button
            className="text-sm text-left hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setLabelValue(item.label);
              setEditingLabel(true);
            }}
          >
            {item.label}
          </button>
        )}
      </td>

      {/* Source column */}
      <td className="px-4 py-2 text-sm text-muted-foreground">
        {item.type === "flow" ? item.sourceName : "-"}
      </td>

      {/* Target column */}
      <td className="px-4 py-2 text-sm text-muted-foreground">
        {item.type === "flow" ? item.targetName : "-"}
      </td>

      {/* Property columns */}
      {properties.map((prop) => (
        <td key={prop.id} className="px-4 py-2">
          <PropertyCell
            property={prop}
            value={item.attributes?.[prop.id]}
            onChange={(value) => handleAttributeChange(prop.id, value)}
          />
        </td>
      ))}
    </tr>
  );
}
