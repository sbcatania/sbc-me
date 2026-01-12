"use client";

import React, { useState } from "react";
import {
  Download,
  Upload,
  Settings,
  Layout,
  Maximize2,
  X,
} from "lucide-react";
import { ImportModal } from "./ImportModal";
import { ExportModal } from "./ExportModal";
import { Button } from "@/components/ui/button";
import { TabBar, TabType } from "@/components/layout/TabBar";
import { useDiagramStore } from "@/lib/store/diagrams";
import { autoLayout, applyLayout } from "@/lib/layout/autolayout";
import { calculateZoomToFit } from "@/lib/layout/geometry";

interface TopBarProps {
  settingsOpen: boolean;
  onSettingsToggle: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TopBar({
  settingsOpen,
  onSettingsToggle,
  activeTab,
  onTabChange,
}: TopBarProps) {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { currentDiagram, updateDiagram, setViewport } = useDiagramStore();

  const handleAutoLayout = () => {
    if (!currentDiagram) return;

    const nodes = currentDiagram.nodes;
    const edges = Object.values(currentDiagram.edges);

    const layout = autoLayout(nodes, edges);
    const newNodes = applyLayout(nodes, layout);

    Object.entries(newNodes).forEach(([id, node]) => {
      useDiagramStore.getState().updateNode(id, { x: node.x, y: node.y });
    });

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
            onClick={() => setExportModalOpen(true)}
            title="Export — Save diagram as JSON"
            data-testid="export-button"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setImportModalOpen(true)}
            title="Import — Load diagram from JSON"
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
            title={settingsOpen ? "Close Settings" : "Settings — Preferences & shortcuts"}
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
    </>
  );
}
