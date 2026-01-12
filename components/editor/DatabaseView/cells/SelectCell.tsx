"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyOption } from "@/lib/model/schema";

interface SelectCellProps {
  value: string | undefined;
  options: PropertyOption[];
  onChange: (value: string | undefined) => void;
}

const COLOR_MAP: Record<string, string> = {
  gray: "#6b7280",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
  purple: "#a855f7",
  pink: "#ec4899",
};

const COLOR_BG_MAP: Record<string, string> = {
  gray: "#f3f4f6",
  blue: "#dbeafe",
  green: "#dcfce7",
  yellow: "#fef9c3",
  orange: "#ffedd5",
  red: "#fee2e2",
  purple: "#f3e8ff",
  pink: "#fce7f3",
};

export function SelectCell({ value, options, onChange }: SelectCellProps) {
  const selectedOption = options.find((o) => o.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="text-sm text-left w-full truncate hover:bg-muted/50 px-1 py-0.5 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          {selectedOption ? (
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
              style={{
                backgroundColor: COLOR_BG_MAP[selectedOption.color || "gray"],
                color: COLOR_MAP[selectedOption.color || "gray"],
              }}
            >
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => onChange(undefined)}>
          <span className="text-muted-foreground">Clear</span>
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onChange(option.id)}
          >
            <span
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
              style={{
                backgroundColor: COLOR_BG_MAP[option.color || "gray"],
                color: COLOR_MAP[option.color || "gray"],
              }}
            >
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
