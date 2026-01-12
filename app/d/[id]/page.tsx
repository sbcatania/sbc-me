"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDiagramStore } from "@/lib/store/diagrams";
import { usePrefsStore } from "@/lib/store/prefs";
import { Canvas } from "@/components/editor/Canvas";
import { TopBar } from "@/components/editor/TopBar";
import { Breadcrumb } from "@/components/editor/Breadcrumb";
import { SettingsPanel } from "@/components/editor/SettingsPanel";
import { QuickAddMenu } from "@/components/editor/QuickAddMenu";
import { SearchPanel } from "@/components/editor/SearchPanel";
import { ImportModal } from "@/components/editor/ImportModal";
import { ExportModal } from "@/components/editor/ExportModal";
import { DataModal } from "@/components/editor/DataModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DiagramPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const {
    initialized: diagramsInitialized,
    initialize: initializeDiagrams,
    loadDiagram,
    currentDiagram,
    createDiagram,
  } = useDiagramStore();

  const {
    initialized: prefsInitialized,
    initialize: initializePrefs,
    prefs,
  } = usePrefsStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [dataModalDefaultTab, setDataModalDefaultTab] = useState<"export" | "import">("export");
  const [loading, setLoading] = useState(true);

  // Initialize stores
  useEffect(() => {
    initializeDiagrams();
    initializePrefs();
  }, [initializeDiagrams, initializePrefs]);

  // Load diagram when ID changes or after initialization
  useEffect(() => {
    if (!diagramsInitialized) return;

    async function load() {
      setLoading(true);
      const diagram = await loadDiagram(id);

      if (!diagram) {
        // Diagram not found, create new or redirect
        const newId = createDiagram("New System");
        router.replace(`/d/${newId}`);
      }

      setLoading(false);
    }

    load();
  }, [id, diagramsInitialized, loadDiagram, createDiagram, router]);

  // Copy diagram to clipboard
  const copyDiagramToClipboard = useCallback(async () => {
    const diagram = useDiagramStore.getState().currentDiagram;
    if (diagram) {
      const json = JSON.stringify(diagram, null, 2);
      await navigator.clipboard.writeText(json);
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when editing text
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K: Quick add
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setQuickAddOpen((prev) => !prev);
        setSearchOpen(false);
      }

      // Cmd/Ctrl + F: Search
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setQuickAddOpen(false);
      }

      // Cmd/Ctrl + . : Toggle settings
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      }

      // Cmd/Ctrl + E: Export + copy to clipboard
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        copyDiagramToClipboard();
        setExportModalOpen(true);
      }

      // Cmd/Ctrl + I: Import modal
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        setImportModalOpen(true);
      }

      // Cmd/Ctrl + S or Cmd/Ctrl + Shift + S: Universal data modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setDataModalDefaultTab("export");
        setDataModalOpen(true);
      }

      // Escape: Close panels
      if (e.key === "Escape") {
        setSettingsOpen(false);
        setQuickAddOpen(false);
        setSearchOpen(false);
        setImportModalOpen(false);
        setExportModalOpen(false);
        setDataModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copyDiagramToClipboard]);

  // Apply font preference
  useEffect(() => {
    if (!prefsInitialized) return;

    const fontClass = {
      inter: "font-sans",
      "ibm-plex-mono": "font-mono",
      system: "font-sans",
    }[prefs.theme.fontFamily];

    document.body.className = `${fontClass} antialiased`;
  }, [prefsInitialized, prefs.theme.fontFamily]);

  if (!diagramsInitialized || !prefsInitialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!currentDiagram) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Diagram not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        settingsOpen={settingsOpen}
        onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
        importModalOpen={importModalOpen}
        onImportModalToggle={() => setImportModalOpen(!importModalOpen)}
        exportModalOpen={exportModalOpen}
        onExportModalToggle={() => setExportModalOpen(!exportModalOpen)}
      />
      <Breadcrumb />

      <div className="relative flex-1 overflow-hidden">
        <Canvas />

        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>

      <QuickAddMenu open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
      <DataModal
        open={dataModalOpen}
        onClose={() => setDataModalOpen(false)}
        defaultTab={dataModalDefaultTab}
      />
    </div>
  );
}
