"use client";

import React, { useEffect, useState, useRef } from "react";
import { Box, ExternalLink, Frame, FileText } from "lucide-react";
import { useDiagramStore } from "@/lib/store/diagrams";
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from "@/lib/model/schema";

interface QuickAddMenuProps {
  open: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { id: "stock", label: "Add Stock", icon: Box, shortcut: "S" },
  { id: "external", label: "Add External Stock", icon: ExternalLink, shortcut: "E" },
  { id: "frame", label: "Add Frame", icon: Frame, shortcut: "F" },
  { id: "note", label: "Add Note", icon: FileText, shortcut: "N" },
];

export function QuickAddMenu({ open, onClose }: QuickAddMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { addNode, addFrame, currentDiagram, setSelectedNodeIds, clearSelection } =
    useDiagramStore();

  const filteredItems = MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleSelect = (itemId: string) => {
    if (!currentDiagram) return;

    // Calculate center position
    const viewport = currentDiagram.viewport || { x: 0, y: 0, zoom: 1 };
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

    switch (itemId) {
      case "stock": {
        const nodeId = addNode({
          type: "stock",
          kind: "internal",
          label: "New Stock",
          x: centerX - DEFAULT_NODE_WIDTH / 2,
          y: centerY - DEFAULT_NODE_HEIGHT / 2,
          width: DEFAULT_NODE_WIDTH,
          height: DEFAULT_NODE_HEIGHT,
        });
        clearSelection();
        setSelectedNodeIds(new Set([nodeId]));
        break;
      }
      case "external": {
        const nodeId = addNode({
          type: "stock",
          kind: "external",
          label: "External",
          x: centerX - DEFAULT_NODE_WIDTH / 2,
          y: centerY - DEFAULT_NODE_HEIGHT / 2,
          width: DEFAULT_NODE_WIDTH,
          height: DEFAULT_NODE_HEIGHT,
        });
        clearSelection();
        setSelectedNodeIds(new Set([nodeId]));
        break;
      }
      case "frame": {
        addFrame({
          label: "Frame",
          x: centerX - 200,
          y: centerY - 150,
          width: 400,
          height: 300,
        });
        break;
      }
      case "note": {
        // Notes are optional in V1, just add as a stock with different styling
        const nodeId = addNode({
          type: "stock",
          kind: "internal",
          label: "Note",
          x: centerX - 100,
          y: centerY - 50,
          width: 200,
          height: 100,
        });
        clearSelection();
        setSelectedNodeIds(new Set([nodeId]));
        break;
      }
    }

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="relative z-10 w-full max-w-md bg-background border border-border shadow-2xl">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add element..."
          className="w-full px-4 py-3 text-sm border-b border-border bg-transparent outline-none"
        />

        <div className="py-2">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => handleSelect(item.id)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {item.shortcut}
                </span>
              </button>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
