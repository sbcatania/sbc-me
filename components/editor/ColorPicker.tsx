"use client";

import React from "react";
import { ColorOptions, COLOR_PALETTE, Color } from "@/lib/model/schema";
import { Check } from "lucide-react";

interface ColorPickerProps {
  currentColor: Color;
  onColorSelect: (color: Color) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export function ColorPicker({
  currentColor,
  onColorSelect,
  onClose,
  position,
}: ColorPickerProps) {
  const handleClick = (color: Color) => {
    onColorSelect(color);
    onClose();
  };

  return (
    <>
      {/* Backdrop to close when clicking outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Color picker popup */}
      <div
        className="fixed z-50 border border-border bg-background p-2 shadow-md"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-3 gap-1">
          {ColorOptions.map((colorName) => {
            const palette = COLOR_PALETTE[colorName];
            const isSelected = (currentColor || "default") === colorName;
            const isDefault = colorName === "default";

            return (
              <button
                key={colorName}
                onClick={() => handleClick(colorName === "default" ? undefined : colorName)}
                className="relative flex h-6 w-6 items-center justify-center border transition-transform hover:scale-110"
                style={{
                  backgroundColor: palette.fill,
                  borderColor: isDefault ? "hsl(var(--border))" : palette.stroke,
                }}
                title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
              >
                {isSelected && (
                  <Check
                    className="h-3 w-3"
                    style={{ color: isDefault ? "currentColor" : palette.stroke }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
