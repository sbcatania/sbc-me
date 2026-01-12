"use client";

import React from "react";
import { PropertyDefinition } from "@/lib/model/schema";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableItem } from "./DatabaseView";

interface DataTableProps {
  items: TableItem[];
  properties: PropertyDefinition[];
  onRowSelect: (id: string, type: "stock" | "flow") => void;
  isSelected: (id: string, type: "stock" | "flow") => boolean;
}

export function DataTable({
  items,
  properties,
  onRowSelect,
  isSelected,
}: DataTableProps) {
  return (
    <div className="min-w-full">
      <table className="w-full border-collapse">
        <TableHeader properties={properties} />
        <tbody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              item={item}
              properties={properties}
              isSelected={isSelected(item.id, item.type)}
              onSelect={() => onRowSelect(item.id, item.type)}
            />
          ))}
          {items.length === 0 && (
            <tr>
              <td
                colSpan={4 + properties.length}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                No items to display
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
