"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarTooltipProps {
  children: React.ReactNode;
  label: string;
  shortcut?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function SidebarTooltip({
  children,
  label,
  shortcut,
  side = "right",
}: SidebarTooltipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <span className="text-xs text-muted-foreground">{shortcut}</span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
