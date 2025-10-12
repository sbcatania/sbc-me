"use client"

import { Canvas } from "./(components)/Canvas"
import { Timebar } from "./(components)/Timebar"
import { ObjectivesChips } from "./(components)/ObjectivesChips"
import { SettingsPanel } from "./(components)/SettingsPanel"
import { StockModal } from "./(components)/StockModal"
import { useEffect, useState } from "react"
import { useStore } from "@/lib/state/store"
import { loadSystemData } from "@/lib/io/load"

export default function Home() {
  const setSystemData = useStore((state) => state.setSystemData)
  const setSnapshotIndex = useStore((state) => state.setSnapshotIndex)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    // Load data on mount
    loadSystemData().then((data) => {
      setSystemData(data)
      // Set to latest snapshot by default
      if (data.snapshots.length > 0) {
        setSnapshotIndex(data.snapshots.length - 1)
      }
    })
  }, [setSystemData, setSnapshotIndex])

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-white dark:bg-black">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 pointer-events-none">
        <div className="text-sm font-medium pointer-events-auto">
          <span className="font-semibold">Sam Catania</span> — Life as a System
        </div>
        <div className="flex gap-4 text-sm pointer-events-auto">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="hover:opacity-60 transition-opacity"
          >
            Settings
          </button>
          <span className="opacity-30">·</span>
          <button
            onClick={() => {
              document.documentElement.classList.toggle("dark")
            }}
            className="hover:opacity-60 transition-opacity"
          >
            Light/Dark
          </button>
        </div>
      </div>

      {/* Main canvas */}
      <Canvas />

      {/* Objective chips (top-right) */}
      <ObjectivesChips />

      {/* Timebar (bottom) */}
      <Timebar />

      {/* Settings panel */}
      <SettingsPanel isOpen={settingsOpen} onToggle={() => setSettingsOpen(!settingsOpen)} />

      {/* Stock modal */}
      <StockModal />
    </main>
  )
}

