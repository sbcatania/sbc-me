"use client";

import React, { useState } from "react";
import { GripVertical, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDiagramStore } from "@/lib/store/diagrams";
import { PropertyDefinition } from "@/lib/model/schema";
import { cn } from "@/lib/utils";

interface TableHeaderProps {
  properties: PropertyDefinition[];
}

export function TableHeader({ properties }: TableHeaderProps) {
  const { deleteProperty, reorderProperties } = useDiagramStore();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, propId: string) => {
    setDraggedId(propId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", propId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, propId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (propId !== draggedId) {
      setDragOverId(propId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");

    if (sourceId && sourceId !== targetId) {
      const currentOrder = properties.map((p) => p.id);
      const sourceIndex = currentOrder.indexOf(sourceId);
      const targetIndex = currentOrder.indexOf(targetId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        // Remove from old position
        currentOrder.splice(sourceIndex, 1);
        // Insert at new position
        currentOrder.splice(targetIndex, 0, sourceId);
        reorderProperties(currentOrder);
      }
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <thead className="sticky top-0 bg-background border-b border-border">
      <tr>
        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
          Type
        </th>
        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[200px]">
          Label
        </th>
        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
          Source
        </th>
        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
          Target
        </th>
        {properties.map((prop) => (
          <th
            key={prop.id}
            draggable
            onDragStart={(e) => handleDragStart(e, prop.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, prop.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, prop.id)}
            className={cn(
              "px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px] group cursor-grab active:cursor-grabbing transition-colors",
              draggedId === prop.id && "opacity-50",
              dragOverId === prop.id && "bg-muted"
            )}
          >
            <div className="flex items-center gap-1">
              <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
              <span className="flex-1 truncate">{prop.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => deleteProperty(prop.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete property
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
