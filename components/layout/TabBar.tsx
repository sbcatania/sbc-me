"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type TabType = "system" | "database";

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded transition-colors",
          activeTab === "system"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        onClick={() => onTabChange("system")}
      >
        System
      </button>
      <button
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded transition-colors",
          activeTab === "database"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        onClick={() => onTabChange("database")}
      >
        Database
      </button>
    </div>
  );
}
