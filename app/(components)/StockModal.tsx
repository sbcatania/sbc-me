"use client"

import { useEffect } from "react";
import { useStore } from "@/lib/state/store";
import { formatValue } from "@/lib/util/format";

export function StockModal() {
  const systemData = useStore((state) => state.systemData);
  const selectedItem = useStore((state) => state.selectedItem);
  const setSelectedItem = useStore((state) => state.setSelectedItem);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedItem?.kind === "stock") {
        setSelectedItem(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedItem, setSelectedItem]);

  if (!systemData || selectedItem?.kind !== "stock") return null;

  const stock = systemData.stocks.find((s) => s.id === selectedItem.id);
  if (!stock) return null;

  const artifacts = systemData.artifacts.filter((a) =>
    a.stockIds?.includes(stock.id)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[100] pointer-events-auto"
        onClick={() => setSelectedItem(null)}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-white dark:bg-black border-2 border-black dark:border-white p-8 min-w-[400px] max-w-[600px] max-h-[80vh] overflow-y-auto pointer-events-auto">
        {/* Close button */}
        <button
          onClick={() => setSelectedItem(null)}
          className="absolute top-4 right-4 text-xl hover:opacity-60 transition-opacity"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Content */}
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

        {artifacts.length === 0 && (
          <div className="text-sm opacity-40 text-center py-8">
            No artifacts linked to this stock
          </div>
        )}

        <div className="pt-4 mt-6 border-t border-black/10 dark:border-white/10 text-xs opacity-40">
          Press ESC to close
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

