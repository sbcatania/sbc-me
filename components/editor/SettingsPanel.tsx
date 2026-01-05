"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { usePrefsStore } from "@/lib/store/prefs";
import { useDiagramStore } from "@/lib/store/diagrams";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose: _onClose }: SettingsPanelProps) {
  const { prefs, setLabelMode, setFontFamily, setGridEnabled } = usePrefsStore();
  const { currentDiagram, updateDiagram } = useDiagramStore();

  if (!open) return null;

  // Get current label mode from diagram or fallback to prefs
  const currentLabelMode = currentDiagram?.ui?.labelMode || prefs.labelModeDefault;

  const handleLabelModeChange = (mode: "hover" | "always") => {
    // Update both diagram-level and global preference
    setLabelMode(mode);
    if (currentDiagram) {
      updateDiagram(currentDiagram.id, {
        ui: { ...currentDiagram.ui, labelMode: mode },
      });
    }
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10 w-72 border-l border-border bg-background shadow-lg overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Label Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Flow Label Display</label>
          <div className="flex gap-2">
            <Button
              variant={currentLabelMode === "hover" ? "default" : "outline"}
              size="sm"
              onClick={() => handleLabelModeChange("hover")}
            >
              Hover
            </Button>
            <Button
              variant={currentLabelMode === "always" ? "default" : "outline"}
              size="sm"
              onClick={() => handleLabelModeChange("always")}
            >
              Always
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Show flow labels on hover/selection or always visible
          </p>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Font</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={prefs.theme.fontFamily === "inter" ? "default" : "outline"}
              size="sm"
              onClick={() => setFontFamily("inter")}
            >
              Inter
            </Button>
            <Button
              variant={prefs.theme.fontFamily === "ibm-plex-mono" ? "default" : "outline"}
              size="sm"
              onClick={() => setFontFamily("ibm-plex-mono")}
            >
              IBM Plex Mono
            </Button>
            <Button
              variant={prefs.theme.fontFamily === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setFontFamily("system")}
            >
              System
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Canvas Grid</label>
          <div className="flex gap-2">
            <Button
              variant={prefs.grid.enabled ? "default" : "outline"}
              size="sm"
              onClick={() => setGridEnabled(true)}
            >
              Show
            </Button>
            <Button
              variant={!prefs.grid.enabled ? "default" : "outline"}
              size="sm"
              onClick={() => setGridEnabled(false)}
            >
              Hide
            </Button>
          </div>
        </div>

        {/* Keyboard shortcuts reference */}
        <div className="space-y-2 pt-4 border-t border-border">
          <label className="text-sm font-medium">Keyboard Shortcuts</label>
          <div className="text-xs space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>Create stock</span>
              <span className="font-mono">Double-click</span>
            </div>
            <div className="flex justify-between">
              <span>Create flow</span>
              <span className="font-mono">Drag handle</span>
            </div>
            <div className="flex justify-between">
              <span>Pan canvas</span>
              <span className="font-mono">Space + Drag</span>
            </div>
            <div className="flex justify-between">
              <span>Delete</span>
              <span className="font-mono">Backspace</span>
            </div>
            <div className="flex justify-between">
              <span>Undo</span>
              <span className="font-mono">⌘Z</span>
            </div>
            <div className="flex justify-between">
              <span>Redo</span>
              <span className="font-mono">⌘⇧Z</span>
            </div>
            <div className="flex justify-between">
              <span>Select all</span>
              <span className="font-mono">⌘A</span>
            </div>
            <div className="flex justify-between">
              <span>Search</span>
              <span className="font-mono">⌘F</span>
            </div>
            <div className="flex justify-between">
              <span>Quick add</span>
              <span className="font-mono">⌘K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
