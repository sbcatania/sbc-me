"use client";

import React, { useState } from "react";
import { Filter, ArrowUpDown, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddPropertyPopover } from "./AddPropertyPopover";
import { NotionExportModal } from "./NotionExportModal";

export type FilterType = "all" | "stocks" | "flows";

export type SortConfig = {
  column: string;
  direction: "asc" | "desc";
};

interface FilterBarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  itemCount: number;
}

export function FilterBar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  itemCount,
}: FilterBarProps) {
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [notionExportOpen, setNotionExportOpen] = useState(false);

  const filterLabel = {
    all: "All",
    stocks: "Stocks",
    flows: "Flows",
  }[filter];

  const sortLabel = sort.column.charAt(0).toUpperCase() + sort.column.slice(1);

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2">
      <div className="flex items-center gap-2">
        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-2 h-3.5 w-3.5" />
              {filterLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onFilterChange("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("stocks")}>
              Stocks only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("flows")}>
              Flows only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
              {sortLabel} {sort.direction === "asc" ? "A-Z" : "Z-A"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => onSortChange({ column: "label", direction: "asc" })}
            >
              Label A-Z
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange({ column: "label", direction: "desc" })}
            >
              Label Z-A
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange({ column: "type", direction: "asc" })}
            >
              Type A-Z
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange({ column: "type", direction: "desc" })}
            >
              Type Z-A
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-sm text-muted-foreground">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Add property button */}
        <AddPropertyPopover
          open={addPropertyOpen}
          onOpenChange={setAddPropertyOpen}
        >
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Property
          </Button>
        </AddPropertyPopover>

        {/* Export to Notion button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setNotionExportOpen(true)}
        >
          <Upload className="mr-2 h-3.5 w-3.5" />
          Export to Notion
        </Button>
      </div>

      {/* Notion Export Modal */}
      <NotionExportModal
        open={notionExportOpen}
        onOpenChange={setNotionExportOpen}
      />
    </div>
  );
}
