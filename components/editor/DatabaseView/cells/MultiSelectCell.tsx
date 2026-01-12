"use client";

import React from "react";
import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyOption } from "@/lib/model/schema";
import { cn } from "@/lib/utils";

interface MultiSelectCellProps {
  value: string[] | undefined;
  options: PropertyOption[];
  onChange: (value: string[]) => void;
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

export function MultiSelectCell({ value = [], options, onChange }: MultiSelectCellProps) {
  const selectedOptions = options.filter((o) => value.includes(o.id));

  const toggleOption = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((id) => id !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="text-sm text-left w-full truncate hover:bg-muted/50 px-1 py-0.5 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: COLOR_BG_MAP[option.color || "gray"],
                    color: COLOR_MAP[option.color || "gray"],
                  }}
                >
                  {option.label}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map((option) => {
          const isSelected = value.includes(option.id);
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={(e) => {
                e.preventDefault();
                toggleOption(option.id);
              }}
              className="flex items-center gap-2"
            >
              <div
                className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isSelected ? "bg-foreground border-foreground" : "border-border"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-background" />}
              </div>
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
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
