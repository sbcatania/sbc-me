"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDiagramStore } from "@/lib/store/diagrams";
import { PropertyType, PropertyOption } from "@/lib/model/schema";
import { generateOptionId } from "@/lib/model/ids";

interface AddPropertyPopoverProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROPERTY_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Select" },
  { value: "multi-select", label: "Multi-select" },
] as const;

const OPTION_COLORS = [
  "gray",
  "blue",
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "pink",
] as const;

export function AddPropertyPopover({
  children,
  open,
  onOpenChange,
}: AddPropertyPopoverProps) {
  const { addProperty } = useDiagramStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType["type"]>("text");
  const [options, setOptions] = useState<PropertyOption[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const resetForm = () => {
    setName("");
    setType("text");
    setOptions([]);
    setNewOptionLabel("");
  };

  const handleAddOption = () => {
    if (newOptionLabel.trim()) {
      const colorIndex = options.length % OPTION_COLORS.length;
      setOptions([
        ...options,
        {
          id: generateOptionId(),
          label: newOptionLabel.trim(),
          color: OPTION_COLORS[colorIndex],
        },
      ]);
      setNewOptionLabel("");
    }
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    let propertyType: PropertyType;
    if (type === "select" || type === "multi-select") {
      propertyType = { type, options };
    } else {
      propertyType = { type } as PropertyType;
    }

    addProperty({
      name: name.trim(),
      propertyType,
    });

    resetForm();
    onOpenChange(false);
  };

  const needsOptions = type === "select" || type === "multi-select";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Property name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Status, Priority"
              className="w-full px-3 py-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PropertyType["type"])}
              className="w-full px-3 py-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Options</label>
              <div className="space-y-2">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-2 px-2 py-1 border border-border rounded"
                  >
                    <span
                      className={`w-3 h-3 rounded-full bg-${option.color}-500`}
                      style={{
                        backgroundColor: getColorValue(option.color),
                      }}
                    />
                    <span className="flex-1 text-sm">{option.label}</span>
                    <button
                      onClick={() => handleRemoveOption(option.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Add option..."
                    className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddOption}
                    disabled={!newOptionLabel.trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!name.trim() || (needsOptions && options.length === 0)}
            >
              Add Property
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getColorValue(
  color?: "gray" | "blue" | "green" | "yellow" | "orange" | "red" | "purple" | "pink"
): string {
  const colors: Record<string, string> = {
    gray: "#6b7280",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    red: "#ef4444",
    purple: "#a855f7",
    pink: "#ec4899",
  };
  return colors[color || "gray"] || colors.gray;
}
