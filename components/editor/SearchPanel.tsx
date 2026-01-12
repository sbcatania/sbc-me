"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Pin } from "lucide-react";
import { useDiagramStore } from "@/lib/store/diagrams";
import { cn } from "@/lib/utils";

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  updatedAt: number;
  pinned?: boolean;
}

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { diagrams, currentDiagramId } = useDiagramStore();

  // Get all diagrams sorted by recency
  const allDiagrams = useMemo(() => {
    return Object.values(diagrams).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [diagrams]);

  // Filter diagrams based on search query
  const results = useMemo(() => {
    if (!query.trim()) {
      return allDiagrams;
    }
    const searchTerm = query.toLowerCase();
    return allDiagrams.filter((d) =>
      d.title.toLowerCase().includes(searchTerm)
    );
  }, [query, allDiagrams]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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
    router.push(`/d/${result.id}`);
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
            placeholder="Search systems..."
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
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2 text-sm",
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted",
                  result.id === currentDiagramId && "font-medium"
                )}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {result.pinned && (
                  <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
                <span className="flex-1 text-left truncate">{result.title}</span>
                {result.id === currentDiagramId && (
                  <span className="text-xs text-muted-foreground">Current</span>
                )}
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No systems found for &quot;{query}&quot;
          </div>
        )}

        {!query && allDiagrams.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No systems yet
          </div>
        )}
      </div>
    </div>
  );
}
