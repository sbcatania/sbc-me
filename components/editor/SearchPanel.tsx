"use client";

import React, { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { useDiagramStore } from "@/lib/store/diagrams";
import { Node } from "@/lib/model/schema";

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: "node" | "edge";
  label: string;
  node?: Node;
}

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    currentDiagram,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    clearSelection,
    setViewport,
  } = useDiagramStore();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!currentDiagram || !query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search nodes
    Object.values(currentDiagram.nodes).forEach((node) => {
      if (node.label.toLowerCase().includes(searchTerm)) {
        newResults.push({
          id: node.id,
          type: "node",
          label: node.label || "Untitled Stock",
          node,
        });
      }
    });

    // Search edges
    Object.values(currentDiagram.edges).forEach((edge) => {
      if (edge.label.toLowerCase().includes(searchTerm)) {
        newResults.push({
          id: edge.id,
          type: "edge",
          label: edge.label || "Untitled Flow",
        });
      }
    });

    setResults(newResults);
    setSelectedIndex(0);
  }, [query, currentDiagram]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    clearSelection();

    if (result.type === "node") {
      setSelectedNodeIds(new Set([result.id]));

      // Pan to node
      if (result.node && currentDiagram) {
        const viewport = currentDiagram.viewport || { x: 0, y: 0, zoom: 1 };
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const nodeX = result.node.x + result.node.width / 2;
        const nodeY = result.node.y + result.node.height / 2;

        setViewport({
          x: centerX - nodeX * viewport.zoom,
          y: centerY - nodeY * viewport.zoom,
          zoom: viewport.zoom,
        });
      }
    } else {
      setSelectedEdgeIds(new Set([result.id]));
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

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-background border border-border shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes and flows..."
            className="flex-1 text-sm bg-transparent outline-none"
          />
          <button onClick={onClose}>
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto py-2">
            {results.map((result, index) => (
              <button
                key={result.id}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span
                  className={`text-xs px-1.5 py-0.5 border ${
                    result.type === "node"
                      ? "border-foreground"
                      : "border-muted-foreground"
                  }`}
                >
                  {result.type === "node" ? "Stock" : "Flow"}
                </span>
                <span className="flex-1 text-left truncate">{result.label}</span>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results found for &quot;{query}&quot;
          </div>
        )}

        {!query && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Start typing to search...
          </div>
        )}
      </div>
    </div>
  );
}
