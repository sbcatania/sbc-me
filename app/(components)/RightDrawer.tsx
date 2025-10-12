"use client"

import { useStore } from "@/lib/state/store";
import { formatValue, formatMetric } from "@/lib/util/format";
import { useEffect, useState } from "react";

export function RightDrawer() {
  const systemData = useStore((state) => state.systemData);
  const selectedItem = useStore((state) => state.selectedItem);
  const setSelectedItem = useStore((state) => state.setSelectedItem);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(selectedItem !== null);
  }, [selectedItem]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setSelectedItem(null), 200);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  if (!systemData || !selectedItem) return null;

  let content: JSX.Element | null = null;

  if (selectedItem.kind === "stock") {
    const stock = systemData.stocks.find((s) => s.id === selectedItem.id);
    if (stock) {
      const artifacts = systemData.artifacts.filter((a) =>
        a.stockIds?.includes(stock.id)
      );

      content = (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{stock.title}</h2>
            <div className="text-sm opacity-60">
              {formatValue(stock.value, stock.unit)} {stock.unit.key}
            </div>
          </div>

          {artifacts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 opacity-60">Artifacts</h3>
              <div className="grid gap-4">
                {artifacts.map((artifact) => (
                  <ArtifactCard key={artifact.id} artifact={artifact} />
                ))}
              </div>
            </div>
          )}
        </>
      );
    }
  } else if (selectedItem.kind === "objective") {
    const objective = systemData.objectives.find((o) => o.id === selectedItem.id);
    if (objective) {
      const artifacts = systemData.artifacts.filter((a) =>
        a.objectiveIds?.includes(objective.id)
      );

      const memberStocks = systemData.stocks.filter((s) =>
        objective.stocks.includes(s.id)
      );

      content = (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{objective.title}</h2>
            
            {objective.metric && (
              <div className="text-sm opacity-60 mb-4">
                {formatMetric(
                  objective.metric.key,
                  objective.metric.value,
                  objective.metric.unit,
                  objective.metric.ci
                )}
              </div>
            )}

            {objective.description && (
              <p className="text-sm opacity-80">{objective.description}</p>
            )}
          </div>

          {memberStocks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 opacity-60">Member Stocks</h3>
              <div className="flex flex-wrap gap-2">
                {memberStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="px-3 py-1.5 text-xs rounded-full bg-black/10 dark:bg-white/10"
                  >
                    {stock.title}: {formatValue(stock.value, stock.unit)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {artifacts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 opacity-60">Artifacts</h3>
              <div className="grid gap-4">
                {artifacts.map((artifact) => (
                  <ArtifactCard key={artifact.id} artifact={artifact} />
                ))}
              </div>
            </div>
          )}
        </>
      );
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-black border-l border-black/10 dark:border-white/10 z-50 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-sm opacity-60 hover:opacity-100"
          >
            ✕
          </button>
          {content}
        </div>
      </div>
    </>
  );
}

function ArtifactCard({ artifact }: { artifact: any }) {
  return (
    <a
      href={artifact.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
    >
      {artifact.coverImageUrl && (
        <img
          src={artifact.coverImageUrl}
          alt={artifact.title}
          className="w-full h-32 object-cover rounded mb-3"
        />
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
          {artifact.type}
        </span>
        {artifact.date && (
          <span className="text-xs opacity-50">{artifact.date}</span>
        )}
      </div>

      <h4 className="font-medium mb-1">{artifact.title}</h4>
      
      {artifact.summary && (
        <p className="text-sm opacity-60 line-clamp-2">{artifact.summary}</p>
      )}
    </a>
  );
}

