"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Copy, Check, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDiagramStore } from "@/lib/store/diagrams";
import { DiagramDocSchema } from "@/lib/model/schema";

interface ImportExportModalProps {
  open: boolean;
  onClose: () => void;
  /** Which tab to show when modal opens. Defaults to "export". */
  defaultTab?: "export" | "import";
  /** Whether to show tab switcher. If false, only shows the defaultTab content. */
  showTabs?: boolean;
  /** Whether to auto-copy to clipboard when opening on export tab. */
  autoCopy?: boolean;
}

export function ImportExportModal({
  open,
  onClose,
  defaultTab = "export",
  showTabs = true,
  autoCopy = false,
}: ImportExportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"export" | "import">(defaultTab);
  const [dragOver, setDragOver] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { currentDiagram, createDiagram } = useDiagramStore();

  const json = currentDiagram ? JSON.stringify(currentDiagram, null, 2) : "";

  // Reset state when modal opens and sync tab
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setCopied(false);
      setError(null);
      setPasteValue("");

      // Auto-copy if requested
      if (autoCopy && defaultTab === "export" && json) {
        navigator.clipboard.writeText(json).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }
    }
  }, [open, defaultTab, autoCopy, json]);

  // Export handlers
  const handleCopy = useCallback(async () => {
    if (!json) return;
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [json]);

  const handleDownload = useCallback(() => {
    if (!currentDiagram) return;

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDiagram.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentDiagram, json]);

  // Import handlers
  const importDiagram = useCallback(
    (text: string) => {
      setError(null);
      try {
        const parsed = JSON.parse(text);
        const validated = DiagramDocSchema.parse(parsed);

        const newId = createDiagram(validated.title, undefined, {
          nodes: validated.nodes,
          edges: validated.edges,
          frames: validated.frames,
          notes: validated.notes,
          viewport: validated.viewport,
          ui: validated.ui,
        });

        onClose();
        setPasteValue("");
        router.push(`/d/${newId}`);
      } catch (err) {
        console.error("Failed to import diagram:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to import diagram. Please check the JSON format."
        );
      }
    },
    [createDiagram, onClose, router]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      const text = await file.text();
      importDiagram(text);
    },
    [importDiagram]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/json") {
        handleFileSelect(file);
      } else {
        setError("Please drop a JSON file");
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleImport = useCallback(() => {
    if (pasteValue.trim()) {
      importDiagram(pasteValue);
    }
  }, [pasteValue, importDiagram]);

  const handleClose = useCallback(() => {
    setError(null);
    setPasteValue("");
    onClose();
  }, [onClose]);

  // Determine title based on mode
  const getTitle = () => {
    if (!showTabs) {
      return defaultTab === "export" ? "Export Diagram" : "Import Diagram";
    }
    return "Import / Export";
  };

  const getDescription = () => {
    if (!showTabs) {
      return defaultTab === "export"
        ? "Copy the JSON to your clipboard or download as a file."
        : "Paste JSON below or drag & drop a file.";
    }
    return "Export or import your diagram as JSON.";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="import-export-modal" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {/* Tab buttons - only show if showTabs is true */}
        {showTabs && (
          <div className="flex gap-1 rounded-lg border border-border p-1">
            <button
              onClick={() => setActiveTab("export")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "export"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="import-export-modal-export-tab"
            >
              Export
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "import"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="import-export-modal-import-tab"
            >
              Import
            </button>
          </div>
        )}

        {activeTab === "export" ? (
          <>
            {/* Export content */}
            <div className="relative">
              <textarea
                data-testid="import-export-modal-export-textarea"
                value={json}
                readOnly
                className="h-[250px] w-full resize-none rounded border border-border bg-muted/50 p-3 font-mono text-xs focus:outline-none"
              />
              <div className="absolute right-2 top-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  data-testid="import-export-modal-copy-button"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleDownload}
              className="w-full"
              data-testid="import-export-modal-download-button"
            >
              <Download className="mr-2 h-4 w-4" />
              Download File
            </Button>
          </>
        ) : (
          <>
            {/* Import content */}
            {error && (
              <div
                className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
                data-testid="import-export-modal-error"
              >
                {error}
              </div>
            )}

            <textarea
              data-testid="import-export-modal-import-textarea"
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setError(null);
              }}
              placeholder="Paste your diagram JSON here..."
              className="h-[200px] w-full resize-none rounded border border-border bg-background p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div
              data-testid="import-export-modal-dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed p-4 transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Drop a JSON file here or click to select
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
              data-testid="import-export-modal-file-input"
            />

            <Button
              onClick={handleImport}
              disabled={!pasteValue.trim()}
              className="w-full"
              data-testid="import-export-modal-import-button"
            >
              <FileText className="mr-2 h-4 w-4" />
              Import
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
