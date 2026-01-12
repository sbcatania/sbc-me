"use client";

import React, { useState } from "react";

interface TextCellProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function TextCell({ value, onChange }: TextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
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
        setEditValue(value || "");
        setIsEditing(true);
      }}
    >
      {value || <span className="text-muted-foreground">-</span>}
    </button>
  );
}
