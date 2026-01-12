"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Download,
  Upload,
  Settings,
  Layout,
  Maximize2,
  X,
  Pencil,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDiagramStore } from "@/lib/store/diagrams";
import { autoLayout, applyLayout, type LayoutConfig } from "@/lib/layout/autolayout";
import { calculateZoomToFit } from "@/lib/layout/geometry";

// Default config values for tuning panel
const DEFAULT_CONFIG: LayoutConfig = {
  ITERATIONS: 150,
  OPTIMAL_DISTANCE: 36,
  REPULSION_STRENGTH: 1000,
  ATTRACTION_STRENGTH: 0.02,
  FLOW_BIAS: 20,
  INITIAL_TEMPERATURE: 80,
  COOLING_RATE: 0.95,
  MIN_DISTANCE: 10,
  INITIAL_SPREAD: 150,
  COMPONENT_SPACING: 50,
  HORIZONTAL_STRETCH: 2,
};

interface TopBarProps {
  settingsOpen: boolean;
  onSettingsToggle: () => void;
  onExportClick: () => void;
  onImportClick: () => void;
}

export function TopBar({
  settingsOpen,
  onSettingsToggle,
  onExportClick,
  onImportClick,
}: TopBarProps) {
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [diagramToDelete, setDiagramToDelete] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [layoutTunerOpen, setLayoutTunerOpen] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(DEFAULT_CONFIG);

  const {
    diagrams,
    currentDiagram,
    currentDiagramId,
    createDiagram,
    deleteDiagram,
    duplicateDiagram,
    updateDiagram,
    setViewport,
  } = useDiagramStore();

  // Sync title value when diagram changes
  useEffect(() => {
    if (currentDiagram) {
      setTitleValue(currentDiagram.title);
    }
  }, [currentDiagram?.title]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const handleTitleClick = () => {
    setEditingTitle(true);
  };

  const handleTitleBlur = () => {
    if (currentDiagram && titleValue.trim()) {
      updateDiagram(currentDiagram.id, { title: titleValue.trim() });
    } else if (currentDiagram) {
      setTitleValue(currentDiagram.title);
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    } else if (e.key === "Escape") {
      setTitleValue(currentDiagram?.title || "");
      setEditingTitle(false);
    }
  };

  const handleCreateDiagram = () => {
    const id = createDiagram("New Diagram");
    router.push(`/d/${id}`);
  };

  const handleDuplicateDiagram = async () => {
    if (!currentDiagramId) return;
    const newId = await duplicateDiagram(currentDiagramId);
    router.push(`/d/${newId}`);
  };

  const handleDeleteDiagram = (id: string) => {
    setDiagramToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!diagramToDelete) return;

    const diagramIds = Object.keys(diagrams);
    const isCurrentDiagram = diagramToDelete === currentDiagramId;

    await deleteDiagram(diagramToDelete);

    if (isCurrentDiagram) {
      const remainingDiagrams = diagramIds.filter((id) => id !== diagramToDelete);
      if (remainingDiagrams.length > 0) {
        router.push(`/d/${remainingDiagrams[0]}`);
      } else {
        const newId = createDiagram("My System");
        router.push(`/d/${newId}`);
      }
    }

    setDeleteDialogOpen(false);
    setDiagramToDelete(null);
  };

  const runAutoLayout = useCallback((config?: Partial<LayoutConfig>) => {
    if (!currentDiagram) return;

    const nodes = currentDiagram.nodes;
    const edges = Object.values(currentDiagram.edges);

    const layout = autoLayout(nodes, edges, config);

    // Push history once before all updates (makes this a single undoable action)
    useDiagramStore.getState().pushHistory();

    // Update each node position
    const store = useDiagramStore.getState();
    for (const [nodeId, layoutNode] of Object.entries(layout.nodes)) {
      store.updateNode(nodeId, { x: layoutNode.x, y: layoutNode.y });
    }

    updateDiagram(currentDiagram.id, {
      ui: {
        ...currentDiagram.ui,
        hasRunInitialAutoLayout: true,
      },
    });
  }, [currentDiagram, updateDiagram]);

  const handleAutoLayout = () => runAutoLayout();

  const handleConfigChange = (key: keyof LayoutConfig, value: number) => {
    const newConfig = { ...layoutConfig, [key]: value };
    setLayoutConfig(newConfig);
    runAutoLayout(newConfig);
  };

  const handleCopyConfig = () => {
    const configStr = JSON.stringify(layoutConfig, null, 2);
    navigator.clipboard.writeText(configStr);
    alert("Config copied to clipboard!");
  };

  const handleZoomToFit = () => {
    if (!currentDiagram) return;

    const nodes = Object.values(currentDiagram.nodes);
    if (nodes.length === 0) return;

    const viewWidth = window.innerWidth - 300;
    const viewHeight = window.innerHeight - 100;

    const viewport = calculateZoomToFit(nodes, viewWidth, viewHeight);
    setViewport(viewport);
  };

  const sortedDiagrams = Object.values(diagrams).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  return (
    <>
      <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          {/* New Diagram button - Primary CTA */}
          <Button
            size="icon"
            onClick={handleCreateDiagram}
            title="New Diagram"
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Editable diagram title - fixed width to prevent layout shift */}
          <div className="relative w-48">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="h-8 w-full rounded border border-border bg-background px-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <button
                onClick={handleTitleClick}
                className="group flex h-8 w-full items-center gap-1 rounded px-2 text-sm font-medium hover:bg-muted"
                title="Click to rename"
              >
                <span className="flex-1 truncate text-left">
                  {currentDiagram?.title || "Untitled"}
                </span>
                <Pencil className="h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-50" />
              </button>
            )}
          </div>

          {/* Diagram switcher dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Switch Diagram"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {sortedDiagrams.map((diagram) => (
                <DropdownMenuItem
                  key={diagram.id}
                  className="flex items-center justify-between"
                  onClick={() => router.push(`/d/${diagram.id}`)}
                >
                  <span className="truncate">{diagram.title}</span>
                  {diagram.id === currentDiagramId && (
                    <span className="text-muted-foreground">•</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicateDiagram}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Current
              </DropdownMenuItem>
              {currentDiagramId && (
                <DropdownMenuItem
                  onClick={() => handleDeleteDiagram(currentDiagramId)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Current
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1">
          {/* Layout controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAutoLayout}
            title="Auto Layout — Arrange nodes automatically"
          >
            <Layout className="h-4 w-4" />
          </Button>

          <Button
            variant={layoutTunerOpen ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setLayoutTunerOpen(!layoutTunerOpen)}
            title="Layout Tuner — Adjust layout parameters"
          >
            <Sliders className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomToFit}
            title="Zoom to Fit — Show all nodes"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <div className="mx-2 h-6 w-px bg-border" />

          {/* Import/Export */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onExportClick}
            title="Export — Save diagram as JSON (⌘E)"
            data-testid="export-button"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onImportClick}
            title="Import — Load diagram from JSON (⌘I)"
            data-testid="import-button"
          >
            <Upload className="h-4 w-4" />
          </Button>

          <div className="mx-2 h-6 w-px bg-border" />

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsToggle}
            title={settingsOpen ? "Close Settings (⌘.)" : "Settings — Preferences & shortcuts (⌘.)"}
          >
            {settingsOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Diagram</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this diagram? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Layout Tuner Panel */}
      {layoutTunerOpen && (
        <div className="fixed right-4 top-16 z-50 w-80 rounded-lg border border-border bg-background p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Layout Tuner</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setLayoutTunerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-muted-foreground">
                Optimal Distance: {layoutConfig.OPTIMAL_DISTANCE}
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={layoutConfig.OPTIMAL_DISTANCE}
                onChange={(e) => handleConfigChange("OPTIMAL_DISTANCE", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-muted-foreground">
                Repulsion: {layoutConfig.REPULSION_STRENGTH}
              </label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={layoutConfig.REPULSION_STRENGTH}
                onChange={(e) => handleConfigChange("REPULSION_STRENGTH", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-muted-foreground">
                Attraction: {layoutConfig.ATTRACTION_STRENGTH.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={layoutConfig.ATTRACTION_STRENGTH}
                onChange={(e) => handleConfigChange("ATTRACTION_STRENGTH", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-muted-foreground">
                Horizontal Stretch: {layoutConfig.HORIZONTAL_STRETCH.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={layoutConfig.HORIZONTAL_STRETCH}
                onChange={(e) => handleConfigChange("HORIZONTAL_STRETCH", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-muted-foreground">
                Flow Bias: {layoutConfig.FLOW_BIAS}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={layoutConfig.FLOW_BIAS}
                onChange={(e) => handleConfigChange("FLOW_BIAS", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-muted-foreground">
                Min Distance: {layoutConfig.MIN_DISTANCE}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={layoutConfig.MIN_DISTANCE}
                onChange={(e) => handleConfigChange("MIN_DISTANCE", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-muted-foreground">
                Component Spacing: {layoutConfig.COMPONENT_SPACING}
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={layoutConfig.COMPONENT_SPACING}
                onChange={(e) => handleConfigChange("COMPONENT_SPACING", Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-muted-foreground">
                Iterations: {layoutConfig.ITERATIONS}
              </label>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={layoutConfig.ITERATIONS}
                onChange={(e) => handleConfigChange("ITERATIONS", Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setLayoutConfig(DEFAULT_CONFIG);
                runAutoLayout(DEFAULT_CONFIG);
              }}
            >
              Reset
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleCopyConfig}
            >
              <Copy className="mr-2 h-3 w-3" />
              Copy Config
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
