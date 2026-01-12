"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxCellProps {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}

export function CheckboxCell({ value, onChange }: CheckboxCellProps) {
  return (
    <button
      className={cn(
        "w-5 h-5 border rounded flex items-center justify-center transition-colors",
        value
          ? "bg-foreground border-foreground"
          : "border-border hover:border-foreground"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!value);
      }}
    >
      {value && <Check className="h-3 w-3 text-background" />}
    </button>
  );
}
