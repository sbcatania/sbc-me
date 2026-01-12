"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import ControlPanel from "@/components/favicon-designer/ControlPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Dynamically import the canvas to avoid SSR issues with Three.js
const SpiralCanvas = dynamic(
  () => import("@/components/favicon-designer/SpiralCanvas"),
  { ssr: false }
);

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

const defaultConfig: SpiralConfig = {
  turns: 3,
  radius: 0.8,
  height: 2,
  tubeRadius: 0.1,
  segments: 32,
  colorStart: "#3b82f6",
  colorEnd: "#8b5cf6",
  autoRotate: true,
  wireframe: false,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
};

export default function FaviconDesignerPage() {
  const [config, setConfig] = useState<SpiralConfig>(defaultConfig);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleExportSVG = useCallback(() => {
    // Get the canvas element
    const canvasContainer = canvasRef.current;
    if (!canvasContainer) return;

    const canvas = canvasContainer.querySelector("canvas");
    if (!canvas) return;

    // Create a data URL from the canvas
    const dataUrl = canvas.toDataURL("image/png");

    // For a true SVG export, we'll create an SVG that embeds the PNG
    // This gives better quality than trying to convert 3D to 2D SVG paths
    const svgSize = 64; // Standard favicon size
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <image x="0" y="0" width="${svgSize}" height="${svgSize}" xlink:href="${dataUrl}"/>
</svg>`;

    // Create and download the SVG
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spiral-favicon.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [backgroundColor]);

  const handleExportPNG = useCallback(() => {
    const canvasContainer = canvasRef.current;
    if (!canvasContainer) return;

    const canvas = canvasContainer.querySelector("canvas");
    if (!canvas) return;

    // Create a temporary canvas for the final favicon
    const faviconSize = 512; // High-res for quality
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = faviconSize;
    tempCanvas.height = faviconSize;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, faviconSize, faviconSize);

    // Draw the 3D canvas content
    const img = new Image();
    img.onload = () => {
      // Calculate square crop from center
      const size = Math.min(canvas.width, canvas.height);
      const x = (canvas.width - size) / 2;
      const y = (canvas.height - size) / 2;

      ctx.drawImage(img, x, y, size, size, 0, 0, faviconSize, faviconSize);

      // Download
      const dataUrl = tempCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "spiral-favicon.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = canvas.toDataURL();
  }, [backgroundColor]);

  const handleReset = () => {
    setConfig(defaultConfig);
    setBackgroundColor("#ffffff");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-sm font-medium">Favicon Designer</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPNG}>
            Export PNG
          </Button>
          <Button size="sm" onClick={handleExportSVG}>
            Export SVG
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div ref={canvasRef} className="flex-1 relative">
          <SpiralCanvas spiralConfig={config} backgroundColor={backgroundColor} />

          {/* Favicon preview overlay */}
          <div className="absolute bottom-4 left-4 p-3 bg-background border border-border">
            <p className="text-xs text-muted-foreground mb-2">Preview (actual sizes)</p>
            <div className="flex items-end gap-3">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="border border-border overflow-hidden"
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor,
                  }}
                >
                  <PreviewThumbnail canvasRef={canvasRef} size={16} />
                </div>
                <span className="text-[10px] text-muted-foreground">16px</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="border border-border overflow-hidden"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor,
                  }}
                >
                  <PreviewThumbnail canvasRef={canvasRef} size={32} />
                </div>
                <span className="text-[10px] text-muted-foreground">32px</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="border border-border overflow-hidden"
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor,
                  }}
                >
                  <PreviewThumbnail canvasRef={canvasRef} size={64} />
                </div>
                <span className="text-[10px] text-muted-foreground">64px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Control panel */}
        <ControlPanel
          config={config}
          backgroundColor={backgroundColor}
          onConfigChange={setConfig}
          onBackgroundChange={setBackgroundColor}
          onExportSVG={handleExportSVG}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}

// Live preview thumbnail component
function PreviewThumbnail({
  canvasRef,
  size,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  size: number;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Update preview periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const container = canvasRef.current;
      if (!container) return;

      const canvas = container.querySelector("canvas");
      if (!canvas) return;

      try {
        setImgSrc(canvas.toDataURL());
      } catch {
        // Canvas might not be ready
      }
    }, 500);

    return () => clearInterval(interval);
  }, [canvasRef]);

  if (!imgSrc) return null;

  return (
    <img
      src={imgSrc}
      alt="Preview"
      style={{
        width: size,
        height: size,
        objectFit: "cover",
      }}
    />
  );
}
