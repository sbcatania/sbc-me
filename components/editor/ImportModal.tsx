"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText } from "lucide-react";
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

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { createDiagram } = useDiagramStore();

  const importDiagram = useCallback(
    (text: string) => {
      setError(null);
      try {
        const json = JSON.parse(text);
        const validated = DiagramDocSchema.parse(json);

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
      // Reset input
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="import-modal" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Diagram</DialogTitle>
          <DialogDescription>
            Paste JSON below or drag & drop a file.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            data-testid="import-error"
          >
            {error}
          </div>
        )}

        {/* Paste textarea at top */}
        <textarea
          data-testid="import-paste-textarea"
          value={pasteValue}
          onChange={(e) => {
            setPasteValue(e.target.value);
            setError(null);
          }}
          placeholder="Paste your diagram JSON here..."
          className="h-[200px] w-full resize-none rounded border border-border bg-background p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Drag/drop area below */}
        <div
          data-testid="import-dropzone"
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
          data-testid="import-file-input"
        />

        {/* Import button */}
        <Button
          onClick={handleImport}
          disabled={!pasteValue.trim()}
          className="w-full"
          data-testid="import-confirm-paste"
        >
          <FileText className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogContent>
    </Dialog>
  );
}
