"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
  ArrowLeft,
  Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefsStore } from "@/lib/store/prefs";
import { useDiagramStore } from "@/lib/store/diagrams";
import { SystemListItem } from "./SystemListItem";
import { SidebarTooltip } from "./SidebarTooltip";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const { prefs, toggleSidebar } = usePrefsStore();
  const { diagrams, currentDiagramId, createDiagram } = useDiagramStore();
  const isCollapsed = prefs.sidebarCollapsed;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoHovered, setLogoHovered] = useState(false);

  const handleCreateDiagram = () => {
    const id = createDiagram("New System");
    router.push(`/d/${id}`);
  };

  const sortedDiagrams = React.useMemo(() => {
    const all = Object.values(diagrams);
    const filtered = searchQuery
      ? all.filter((d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : all;
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [diagrams, searchQuery]);

  const pinnedDiagrams = sortedDiagrams.filter((d) => d.pinned);
  const unpinnedDiagrams = sortedDiagrams.filter((d) => !d.pinned);

  // Collapsed sidebar
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex h-full w-12 flex-col border-r border-border bg-background",
          className
        )}
      >
        {/* Logo / Expand button */}
        <div className="flex h-12 items-center justify-center">
          <SidebarTooltip label="Open sidebar" shortcut="⌘/">
            <button
              onClick={toggleSidebar}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              className="flex h-8 w-8 items-center justify-center rounded hover:bg-muted transition-colors"
            >
              {logoHovered ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-foreground" />
              )}
            </button>
          </SidebarTooltip>
        </div>

        {/* New system */}
        <div className="flex justify-center py-1">
          <SidebarTooltip label="New system" shortcut="⇧⌘N">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateDiagram}
              className="h-10 w-10"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </SidebarTooltip>
        </div>

        {/* Search */}
        <div className="flex justify-center py-1">
          <SidebarTooltip label="Search systems" shortcut="⌘F">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                toggleSidebar();
                setSearchOpen(true);
              }}
              className="h-10 w-10"
            >
              <Search className="h-5 w-5" />
            </Button>
          </SidebarTooltip>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Return to main site */}
        <div className="flex justify-center py-3">
          <SidebarTooltip label="Return to Sam's main site">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </SidebarTooltip>
        </div>
      </div>
    );
  }

  // Expanded sidebar
  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-background",
        className
      )}
    >
      {/* Header with logo and collapse */}
      <div className="flex h-12 items-center justify-between px-3">
        {/* Logo */}
        <div className="h-6 w-6 rounded-full bg-foreground" />

        {/* Collapse button */}
        <SidebarTooltip label="Close sidebar" shortcut="⌘/">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </SidebarTooltip>
      </div>

      {/* Action rows */}
      <div className="border-b border-border px-2 pb-2">
        {/* New system */}
        <button
          onClick={handleCreateDiagram}
          className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New system</span>
          <span className="ml-auto text-xs text-muted-foreground">⇧⌘N</span>
        </button>

        {/* Search systems */}
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search systems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false);
              }}
              autoFocus
              className="w-full rounded border border-border bg-background py-2 pl-10 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Search systems</span>
            <span className="ml-auto text-xs text-muted-foreground">⌘F</span>
          </button>
        )}
      </div>

      {/* Systems list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Pinned section */}
        {pinnedDiagrams.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Pin className="h-3 w-3" />
              Pinned
            </div>
            {pinnedDiagrams.map((diagram) => (
              <SystemListItem
                key={diagram.id}
                diagram={diagram}
                isActive={diagram.id === currentDiagramId}
              />
            ))}
          </div>
        )}

        {/* All systems */}
        {pinnedDiagrams.length > 0 && unpinnedDiagrams.length > 0 && (
          <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
            All Systems
          </div>
        )}
        {unpinnedDiagrams.map((diagram) => (
          <SystemListItem
            key={diagram.id}
            diagram={diagram}
            isActive={diagram.id === currentDiagramId}
          />
        ))}

        {/* Empty state */}
        {sortedDiagrams.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? "No systems found" : "No systems yet"}
          </div>
        )}
      </div>

      {/* Bottom link */}
      <div className="border-t border-border p-2">
        <button className="flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Sam&apos;s main site</span>
        </button>
      </div>
    </div>
  );
}
