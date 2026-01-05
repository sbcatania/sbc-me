"use client";

import React, { useState } from "react";
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
  RotateCcw,
  X,
} from "lucide-react";
import { ImportModal } from "./ImportModal";
import { ExportModal } from "./ExportModal";
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
import { autoLayout, applyLayout } from "@/lib/layout/autolayout";
import { calculateZoomToFit } from "@/lib/layout/geometry";

interface TopBarProps {
  settingsOpen: boolean;
  onSettingsToggle: () => void;
}

export function TopBar({ settingsOpen, onSettingsToggle }: TopBarProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [diagramToDelete, setDiagramToDelete] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

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
        // Create a new default diagram
        const newId = createDiagram("My System");
        router.push(`/d/${newId}`);
      }
    }

    setDeleteDialogOpen(false);
    setDiagramToDelete(null);
  };

  const handleAutoLayout = () => {
    if (!currentDiagram) return;

    const nodes = currentDiagram.nodes;
    const edges = Object.values(currentDiagram.edges);

    const layout = autoLayout(nodes, edges);
    const newNodes = applyLayout(nodes, layout);

    // Update all nodes
    Object.entries(newNodes).forEach(([id, node]) => {
      useDiagramStore.getState().updateNode(id, { x: node.x, y: node.y });
    });

    // Update UI flag
    updateDiagram(currentDiagram.id, {
      ui: {
        ...currentDiagram.ui,
        hasRunInitialAutoLayout: true,
      },
    });
  };

  const handleZoomToFit = () => {
    if (!currentDiagram) return;

    const nodes = Object.values(currentDiagram.nodes);
    if (nodes.length === 0) return;

    // Get container dimensions (assuming full viewport minus some padding)
    const viewWidth = window.innerWidth - 300; // Account for panels
    const viewHeight = window.innerHeight - 100; // Account for top bar

    const viewport = calculateZoomToFit(nodes, viewWidth, viewHeight);
    setViewport(viewport);
  };

  const handleResetZoom = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const sortedDiagrams = Object.values(diagrams).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  return (
    <>
      <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          {/* Diagram selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <span className="max-w-[200px] truncate">
                  {currentDiagram?.title || "Select Diagram"}
                </span>
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
              <DropdownMenuItem onClick={handleCreateDiagram}>
                <Plus className="mr-2 h-4 w-4" />
                New Diagram
              </DropdownMenuItem>
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
            title="Auto Layout"
          >
            <Layout className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomToFit}
            title="Zoom to Fit"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            title="Reset Zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="mx-2 h-6 w-px bg-border" />

          {/* Import/Export */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExportModalOpen(true)}
            title="Export JSON"
            data-testid="export-button"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setImportModalOpen(true)}
            title="Import JSON"
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
            title={settingsOpen ? "Close Settings" : "Settings"}
          >
            {settingsOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

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
    </>
  );
}
