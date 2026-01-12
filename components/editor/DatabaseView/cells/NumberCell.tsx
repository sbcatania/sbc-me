"use client";

import React, { useState } from "react";

interface NumberCellProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function NumberCell({ value, onChange }: NumberCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || "");

  const handleSave = () => {
    const num = parseFloat(editValue);
    if (!isNaN(num)) {
      onChange(num);
    } else if (editValue === "") {
      onChange(undefined);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value?.toString() || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        autoFocus
        className="w-full px-1 py-0.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
      />
    );
  }

  return (
    <button
      className="text-sm text-left w-full truncate hover:bg-muted/50 px-1 py-0.5 rounded"
      onClick={(e) => {
        e.stopPropagation();
        setEditValue(value?.toString() || "");
        setIsEditing(true);
      }}
    >
      {value !== undefined ? value : <span className="text-muted-foreground">-</span>}
    </button>
  );
}
