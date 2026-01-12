"use client";

import React, { useCallback } from "react";
import {
  Download,
  Upload,
  Settings,
  Layout,
  Maximize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabBar, TabType } from "@/components/layout/TabBar";
import { useDiagramStore } from "@/lib/store/diagrams";
import { autoLayout } from "@/lib/layout/autolayout";
import { calculateZoomToFit } from "@/lib/layout/geometry";

interface TopBarProps {
  settingsOpen: boolean;
  onSettingsToggle: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onExportClick: () => void;
  onImportClick: () => void;
}

export function TopBar({
  settingsOpen,
  onSettingsToggle,
  activeTab,
  onTabChange,
  onExportClick,
  onImportClick,
}: TopBarProps) {
  const { currentDiagram, updateDiagram, setViewport } = useDiagramStore();

  const handleAutoLayout = useCallback(() => {
    if (!currentDiagram) return;

    const nodes = currentDiagram.nodes;
    const edges = Object.values(currentDiagram.edges);

    const layout = autoLayout(nodes, edges);

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

  const handleZoomToFit = () => {
    if (!currentDiagram) return;

    const nodes = Object.values(currentDiagram.nodes);
    if (nodes.length === 0) return;

    const viewWidth = window.innerWidth - 300;
    const viewHeight = window.innerHeight - 100;

    const viewport = calculateZoomToFit(nodes, viewWidth, viewHeight);
    setViewport(viewport);
  };

  return (
    <>
      <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-4">
          {/* Tab navigation */}
          <TabBar activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        <div className="flex items-center gap-1">
          {/* Layout controls - only show on System tab */}
          {activeTab === "system" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAutoLayout}
                title="Auto Layout — Arrange nodes automatically"
              >
                <Layout className="h-4 w-4" />
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
            </>
          )}

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
    </>
  );
}
