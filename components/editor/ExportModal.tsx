"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDiagramStore } from "@/lib/store/diagrams";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { currentDiagram } = useDiagramStore();
  const [copied, setCopied] = useState(false);

  const json = currentDiagram ? JSON.stringify(currentDiagram, null, 2) : "";

  // Reset copied state when modal opens
  useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open]);

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="export-modal" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Diagram</DialogTitle>
          <DialogDescription>
            Copy the JSON to your clipboard or download as a file.
          </DialogDescription>
        </DialogHeader>

        {/* JSON Preview */}
        <div className="relative">
          <textarea
            data-testid="export-json-textarea"
            value={json}
            readOnly
            className="h-[250px] w-full resize-none rounded border border-border bg-muted/50 p-3 font-mono text-xs focus:outline-none"
          />
          <div className="absolute right-2 top-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              data-testid="export-copy-button"
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

        {/* Download button */}
        <Button
          onClick={handleDownload}
          className="w-full"
          data-testid="export-download-button"
        >
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </DialogContent>
    </Dialog>
  );
}
