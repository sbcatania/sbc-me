"use client";

import React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDiagramStore } from "@/lib/store/diagrams";
import { PropertyDefinition } from "@/lib/model/schema";

interface TableHeaderProps {
  properties: PropertyDefinition[];
}

export function TableHeader({ properties }: TableHeaderProps) {
  const { deleteProperty } = useDiagramStore();

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
            className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px] group"
          >
            <div className="flex items-center justify-between">
              <span>{prop.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
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
