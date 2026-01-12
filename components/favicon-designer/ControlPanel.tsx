"use client";

import { Button } from "@/components/ui/button";
import { Download, Copy, RotateCcw } from "lucide-react";

interface SpiralConfig {
  turns: number;
  radius: number;
  height: number;
  tubeRadius: number;
  segments: number;
  colorStart: string;
  colorEnd: string;
  autoRotate: boolean;
  wireframe: boolean;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

interface ControlPanelProps {
  config: SpiralConfig;
  backgroundColor: string;
  onConfigChange: (config: SpiralConfig) => void;
  onBackgroundChange: (color: string) => void;
  onExportSVG: () => void;
  onReset: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-border appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-none"
      />
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-6 border border-border cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs font-mono bg-transparent border border-border"
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div
        className={`w-8 h-4 border border-border relative transition-colors ${
          checked ? "bg-foreground" : "bg-background"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-2.5 h-2.5 transition-transform ${
            checked ? "translate-x-[18px] bg-background" : "translate-x-0.5 bg-foreground"
          }`}
        />
      </div>
    </label>
  );
}

export default function ControlPanel({
  config,
  backgroundColor,
  onConfigChange,
  onBackgroundChange,
  onExportSVG,
  onReset,
}: ControlPanelProps) {
  const updateConfig = (key: keyof SpiralConfig, value: number | string | boolean) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="w-72 h-full border-l border-border bg-background p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Spiral Controls</h2>
          <Button variant="ghost" size="icon" onClick={onReset} title="Reset to defaults">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Geometry */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Geometry
          </h3>
          <Slider
            label="Turns"
            value={config.turns}
            min={1}
            max={10}
            step={0.5}
            onChange={(v) => updateConfig("turns", v)}
          />
          <Slider
            label="Radius"
            value={config.radius}
            min={0.2}
            max={2}
            step={0.1}
            onChange={(v) => updateConfig("radius", v)}
          />
          <Slider
            label="Height"
            value={config.height}
            min={0.5}
            max={5}
            step={0.1}
            onChange={(v) => updateConfig("height", v)}
          />
          <Slider
            label="Tube Radius"
            value={config.tubeRadius}
            min={0.02}
            max={0.3}
            step={0.01}
            onChange={(v) => updateConfig("tubeRadius", v)}
          />
          <Slider
            label="Segments"
            value={config.segments}
            min={8}
            max={64}
            step={1}
            onChange={(v) => updateConfig("segments", v)}
          />
        </div>

        {/* Rotation / Orientation */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Orientation
          </h3>
          <Slider
            label="Tilt X (Forward/Back)"
            value={config.rotationX}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => updateConfig("rotationX", v)}
          />
          <Slider
            label="Tilt Y (Spin)"
            value={config.rotationY}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => updateConfig("rotationY", v)}
          />
          <Slider
            label="Tilt Z (Side to Side)"
            value={config.rotationZ}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => updateConfig("rotationZ", v)}
          />
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Colors
          </h3>
          <ColorPicker
            label="Start Color"
            value={config.colorStart}
            onChange={(v) => updateConfig("colorStart", v)}
          />
          <ColorPicker
            label="End Color"
            value={config.colorEnd}
            onChange={(v) => updateConfig("colorEnd", v)}
          />
          <ColorPicker
            label="Background"
            value={backgroundColor}
            onChange={onBackgroundChange}
          />
        </div>

        {/* Display */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Display
          </h3>
          <Toggle
            label="Auto Rotate"
            checked={config.autoRotate}
            onChange={(v) => updateConfig("autoRotate", v)}
          />
          <Toggle
            label="Wireframe"
            checked={config.wireframe}
            onChange={(v) => updateConfig("wireframe", v)}
          />
        </div>

        {/* Export */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Export
          </h3>
          <p className="text-xs text-muted-foreground">
            Export the current view as an SVG favicon. Position your spiral first using mouse drag.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onExportSVG}>
              <Download className="w-4 h-4 mr-2" />
              Export SVG
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Controls
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>Left drag: Rotate view</li>
            <li>Right drag: Pan view</li>
            <li>Scroll: Zoom in/out</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
