"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Download, Copy, Check, Upload, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { get as idbGet, set as idbSet, keys as idbKeys, del as idbDel } from "idb-keyval";
import { DiagramDoc, DiagramDocSchema, UserPrefsSchema } from "@/lib/model/schema";
import { usePrefsStore } from "@/lib/store/prefs";
import { useDiagramStore } from "@/lib/store/diagrams";
import { z } from "zod";

const DIAGRAM_PREFIX = "diagram:";
const DIAGRAMS_INDEX_KEY = "diagrams:index";
const PREFS_KEY = "prefs";

// Backup schema
const FullBackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  preferences: UserPrefsSchema,
  diagrams: z.array(DiagramDocSchema),
});

type FullBackup = z.infer<typeof FullBackupSchema>;

interface FullBackupModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = "export" | "import";

export function FullBackupModal({ open, onClose }: FullBackupModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("export");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupJson, setBackupJson] = useState("");
  const [confirmImport, setConfirmImport] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<FullBackup | null>(null);

  const { prefs } = usePrefsStore();
  const { diagrams } = useDiagramStore();

  // Generate export JSON when modal opens in export mode
  useEffect(() => {
    if (open && mode === "export") {
      generateBackup();
    }
  }, [open, mode]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCopied(false);
      setPasteValue("");
      setError(null);
      setConfirmImport(false);
      setParsedBackup(null);
    }
  }, [open]);

  const generateBackup = async () => {
    setLoading(true);
    try {
      // Get all diagram IDs from the index
      const diagramIds = Object.keys(diagrams);

      // Fetch each diagram
      const diagramDocs: DiagramDoc[] = [];
      for (const id of diagramIds) {
        const doc = await idbGet<DiagramDoc>(`${DIAGRAM_PREFIX}${id}`);
        if (doc) {
          diagramDocs.push(doc);
        }
      }

      const backup: FullBackup = {
        version: 1,
        exportedAt: Date.now(),
        preferences: prefs,
        diagrams: diagramDocs,
      };

      setBackupJson(JSON.stringify(backup, null, 2));
    } catch (err) {
      console.error("Failed to generate backup:", err);
      setError("Failed to generate backup");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!backupJson) return;
    await navigator.clipboard.writeText(backupJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [backupJson]);

  const handleDownload = useCallback(() => {
    if (!backupJson) return;

    const blob = new Blob([backupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-builder-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [backupJson]);

  const validateBackup = useCallback((text: string): FullBackup | null => {
    setError(null);
    try {
      const json = JSON.parse(text);
      const validated = FullBackupSchema.parse(json);
      return validated;
    } catch (err) {
      console.error("Failed to validate backup:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Invalid backup file. Please check the format."
      );
      return null;
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const text = await file.text();
      setPasteValue(text);
      const backup = validateBackup(text);
      if (backup) {
        setParsedBackup(backup);
        setConfirmImport(true);
      }
    },
    [validateBackup]
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

  const handleValidateImport = useCallback(() => {
    if (pasteValue.trim()) {
      const backup = validateBackup(pasteValue);
      if (backup) {
        setParsedBackup(backup);
        setConfirmImport(true);
      }
    }
  }, [pasteValue, validateBackup]);

  const handleConfirmImport = useCallback(async () => {
    if (!parsedBackup) return;

    setLoading(true);
    try {
      // Clear existing diagrams
      const allKeys = await idbKeys();
      for (const key of allKeys) {
        if (typeof key === "string" && key.startsWith(DIAGRAM_PREFIX)) {
          await idbDel(key);
        }
      }

      // Restore preferences
      await idbSet(PREFS_KEY, parsedBackup.preferences);

      // Restore diagrams
      const newIndex: Record<string, { id: string; title: string; updatedAt: number }> = {};
      for (const diagram of parsedBackup.diagrams) {
        await idbSet(`${DIAGRAM_PREFIX}${diagram.id}`, diagram);
        newIndex[diagram.id] = {
          id: diagram.id,
          title: diagram.title,
          updatedAt: diagram.updatedAt,
        };
      }

      // Update diagrams index
      await idbSet(DIAGRAMS_INDEX_KEY, newIndex);

      // Reload the page to apply changes
      window.location.reload();
    } catch (err) {
      console.error("Failed to import backup:", err);
      setError("Failed to import backup. Please try again.");
      setLoading(false);
    }
  }, [parsedBackup]);

  const handleClose = useCallback(() => {
    setError(null);
    setPasteValue("");
    setConfirmImport(false);
    setParsedBackup(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Full Backup</DialogTitle>
          <DialogDescription>
            Export or import all diagrams and settings.
          </DialogDescription>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={mode === "export" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("export");
              setError(null);
              setConfirmImport(false);
              setParsedBackup(null);
            }}
          >
            Export
          </Button>
          <Button
            variant={mode === "import" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("import");
              setError(null);
            }}
          >
            Import
          </Button>
        </div>

        {error && (
          <div className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {mode === "export" ? (
          <>
            {/* Export view */}
            <div className="text-xs text-muted-foreground">
              {Object.keys(diagrams).length} diagram{Object.keys(diagrams).length !== 1 ? "s" : ""} will be exported
            </div>

            <div className="relative">
              <textarea
                value={backupJson}
                readOnly
                className="h-[200px] w-full resize-none rounded border border-border bg-muted/50 p-3 font-mono text-xs focus:outline-none"
              />
              <div className="absolute right-2 top-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!backupJson || loading}
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
              disabled={!backupJson || loading}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Backup
            </Button>
          </>
        ) : confirmImport && parsedBackup ? (
          <>
            {/* Confirmation view */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded border border-yellow-500 bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">This will replace all existing data</p>
                  <p className="text-xs mt-1">
                    All current diagrams and settings will be overwritten.
                  </p>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p><strong>Backup date:</strong> {new Date(parsedBackup.exportedAt).toLocaleString()}</p>
                <p><strong>Diagrams:</strong> {parsedBackup.diagrams.length}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmImport(false);
                  setParsedBackup(null);
                }}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                className="flex-1"
                disabled={loading}
              >
                {loading ? "Importing..." : "Confirm Import"}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Import view */}
            <textarea
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setError(null);
              }}
              placeholder="Paste your backup JSON here..."
              className="h-[150px] w-full resize-none rounded border border-border bg-background p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div
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
                Drop a backup file here or click to select
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              onClick={handleValidateImport}
              disabled={!pasteValue.trim()}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Validate & Import
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
