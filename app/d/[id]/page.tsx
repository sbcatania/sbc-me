"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useDiagramStore } from "@/lib/store/diagrams";
import { usePrefsStore } from "@/lib/store/prefs";
import { Canvas } from "@/components/editor/Canvas";
import { TopBar } from "@/components/editor/TopBar";
import { Breadcrumb } from "@/components/editor/Breadcrumb";
import { SettingsPanel } from "@/components/editor/SettingsPanel";
import { QuickAddMenu } from "@/components/editor/QuickAddMenu";
import { SearchPanel } from "@/components/editor/SearchPanel";
import { Sidebar } from "@/components/layout/Sidebar";
import { DatabaseView } from "@/components/editor/DatabaseView";
import { TabType } from "@/components/layout/TabBar";
import { ImportExportModal } from "@/components/editor/ImportExportModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Modal configuration for different use cases
interface ModalConfig {
  defaultTab: "export" | "import";
  showTabs: boolean;
  autoCopy: boolean;
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
    toggleSidebar,
  } = usePrefsStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("system");

  // Unified import/export modal state
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    defaultTab: "export",
    showTabs: true,
    autoCopy: false,
  });

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

  // Helper to open modal with specific config
  const openModal = (config: Partial<ModalConfig>) => {
    setModalConfig({
      defaultTab: config.defaultTab ?? "export",
      showTabs: config.showTabs ?? true,
      autoCopy: config.autoCopy ?? false,
    });
    setImportExportModalOpen(true);
  };

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

      const hasModifier = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K: Quick add
      if (hasModifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickAddOpen((prev) => !prev);
        setSearchOpen(false);
      }

      // Cmd/Ctrl + F: Search
      if (hasModifier && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setQuickAddOpen(false);
      }

      // Cmd/Ctrl + /: Toggle sidebar
      // Check multiple ways to detect the slash key for cross-platform compatibility
      if (hasModifier && (e.key === "/" || e.code === "Slash" || e.code === "NumpadDivide")) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
      }

      // Shift + Cmd/Ctrl + N: New system
      if (e.shiftKey && hasModifier && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const newId = createDiagram("New System");
        router.push(`/d/${newId}`);
      }

      // Cmd/Ctrl + 1: System tab
      if (hasModifier && e.key === "1") {
        e.preventDefault();
        setActiveTab("system");
      }

      // Cmd/Ctrl + 2: Database tab
      if (hasModifier && e.key === "2") {
        e.preventDefault();
        setActiveTab("database");
      }

      // Cmd/Ctrl + . : Toggle settings
      if (hasModifier && e.key === ".") {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      }

      // Cmd/Ctrl + E: Export (single tab, auto-copy)
      if (hasModifier && e.key.toLowerCase() === "e") {
        e.preventDefault();
        openModal({ defaultTab: "export", showTabs: false, autoCopy: true });
      }

      // Cmd/Ctrl + I: Import (single tab)
      if (hasModifier && e.key.toLowerCase() === "i") {
        e.preventDefault();
        openModal({ defaultTab: "import", showTabs: false });
      }

      // Cmd/Ctrl + S or Cmd/Ctrl + Shift + S: Full import/export modal with tabs
      if (hasModifier && e.key.toLowerCase() === "s") {
        e.preventDefault();
        openModal({ defaultTab: "export", showTabs: true });
      }

      // Escape: Close panels
      if (e.key === "Escape") {
        setSettingsOpen(false);
        setQuickAddOpen(false);
        setSearchOpen(false);
        setImportExportModalOpen(false);
      }
    };

    // Use capture phase to intercept before browser handles it
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [toggleSidebar, createDiagram, router]);

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
    <div className="flex h-screen">
      {/* Sidebar - extends full height */}
      <Sidebar onSearchOpen={() => setSearchOpen(true)} />

      {/* Right side - TopBar + content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          settingsOpen={settingsOpen}
          onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onExportClick={() => openModal({ defaultTab: "export", showTabs: false, autoCopy: true })}
          onImportClick={() => openModal({ defaultTab: "import", showTabs: false })}
        />

        {/* Main content area */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          {activeTab === "system" && <Breadcrumb />}

          <div className="relative flex-1 overflow-hidden">
            {activeTab === "system" ? (
              <Canvas />
            ) : (
              <DatabaseView />
            )}

            <SettingsPanel
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
            />
          </div>
        </div>
      </div>

      <QuickAddMenu open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <ImportExportModal
        open={importExportModalOpen}
        onClose={() => setImportExportModalOpen(false)}
        defaultTab={modalConfig.defaultTab}
        showTabs={modalConfig.showTabs}
        autoCopy={modalConfig.autoCopy}
      />
    </div>
  );
}
