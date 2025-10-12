"use client"

import { useStore } from "@/lib/state/store";

type SettingsPanelProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function SettingsPanel({ isOpen, onToggle }: SettingsPanelProps) {
  const showStocks = useStore((state) => state.showStocks);
  const showFlows = useStore((state) => state.showFlows);
  const setShowStocks = useStore((state) => state.setShowStocks);
  const setShowFlows = useStore((state) => state.setShowFlows);

  return (
    <>
      {/* Settings panel */}
      {isOpen && (
        <div className="fixed top-16 right-4 z-50 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg shadow-lg p-4 min-w-[220px] pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Settings</h3>
            <button
              onClick={onToggle}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              Close
            </button>
          </div>

          {/* Visibility toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Show Stocks</span>
              <input
                type="checkbox"
                checked={showStocks}
                onChange={(e) => setShowStocks(e.target.checked)}
                className="ml-3 w-4 h-4 cursor-pointer accent-black dark:accent-white"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Show Flows</span>
              <input
                type="checkbox"
                checked={showFlows}
                onChange={(e) => setShowFlows(e.target.checked)}
                className="ml-3 w-4 h-4 cursor-pointer accent-black dark:accent-white"
              />
            </label>
          </div>

          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 text-xs opacity-60">
            Use these toggles to debug layout issues
          </div>
        </div>
      )}

      {/* Backdrop to close panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 pointer-events-auto"
          onClick={onToggle}
        />
      )}
    </>
  );
}

