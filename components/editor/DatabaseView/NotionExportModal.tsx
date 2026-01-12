"use client";

import React, { useState, useMemo } from "react";
import { Upload, ExternalLink, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDiagramStore } from "@/lib/store/diagrams";

interface NotionExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportStatus = "idle" | "exporting" | "success" | "error";

export function NotionExportModal({ open, onOpenChange }: NotionExportModalProps) {
  const { currentDiagram } = useDiagramStore();
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!currentDiagram) return { stocks: 0, flows: 0, properties: 0 };
    return {
      stocks: Object.keys(currentDiagram.nodes).length,
      flows: Object.keys(currentDiagram.edges).length,
      properties: currentDiagram.propertySchema?.properties.length || 0,
    };
  }, [currentDiagram]);

  const properties = currentDiagram?.propertySchema?.properties || [];

  const handleExport = async () => {
    setStatus("exporting");
    setError(null);

    // This is a placeholder - actual Notion export would use MCP tools
    // For now, we'll just show a message about the feature
    try {
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation, this would:
      // 1. Call mcp__plugin_Notion_notion__notion-create-database to create the database
      // 2. Call mcp__plugin_Notion_notion__notion-create-pages to create all items
      // 3. Update flow pages with Source/Target relations

      setStatus("error");
      setError("Notion export requires Claude Code to execute MCP commands. Please ask Claude to export this system to Notion.");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setResultUrl(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export to Notion</DialogTitle>
          <DialogDescription>
            Create a Notion database with all stocks and flows from this system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export summary */}
          <div className="rounded border border-border p-4 space-y-3">
            <h4 className="text-sm font-medium">Export Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold">{stats.stocks}</div>
                <div className="text-muted-foreground">Stocks</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.flows}</div>
                <div className="text-muted-foreground">Flows</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.properties}</div>
                <div className="text-muted-foreground">Properties</div>
              </div>
            </div>
          </div>

          {/* Database structure preview */}
          <div className="rounded border border-border p-4 space-y-3">
            <h4 className="text-sm font-medium">Database Structure</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Title:</span>
                <span>Label</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Select:</span>
                <span>Type (Stock, Flow)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Relation:</span>
                <span>Source (self-relation)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Relation:</span>
                <span>Target (self-relation)</span>
              </div>
              {properties.map((prop) => (
                <div key={prop.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground capitalize">
                    {prop.propertyType.type}:
                  </span>
                  <span>{prop.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status messages */}
          {status === "success" && resultUrl && (
            <div className="flex items-center gap-2 rounded bg-green-50 p-3 text-sm text-green-800">
              <Check className="h-4 w-4" />
              <span>Database created successfully!</span>
              <a
                href={resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-green-700 hover:underline"
              >
                Open in Notion
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {status === "error" && error && (
            <div className="flex items-start gap-2 rounded bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {status === "success" ? "Close" : "Cancel"}
          </Button>
          {status !== "success" && (
            <Button onClick={handleExport} disabled={status === "exporting"}>
              {status === "exporting" ? (
                <>Exporting...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Export to Notion
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
