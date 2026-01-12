"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, MoreHorizontal, Pin, PinOff, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDiagramStore } from "@/lib/store/diagrams";
import { cn } from "@/lib/utils";

interface SystemListItemProps {
  diagram: {
    id: string;
    title: string;
    updatedAt: number;
    pinned?: boolean;
  };
  isActive: boolean;
}

export function SystemListItem({ diagram, isActive }: SystemListItemProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(diagram.title);

  const {
    diagrams,
    renameDiagram,
    togglePinned,
    duplicateDiagram,
    deleteDiagram,
    createDiagram,
  } = useDiagramStore();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing) {
      router.push(`/d/${diagram.id}`);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(diagram.title);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      renameDiagram(diagram.id, editValue.trim());
    } else {
      setEditValue(diagram.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditValue(diagram.title);
      setIsEditing(false);
    }
  };

  const handleDuplicate = async () => {
    const newId = await duplicateDiagram(diagram.id);
    router.push(`/d/${newId}`);
  };

  const handleDelete = async () => {
    const diagramIds = Object.keys(diagrams);
    const wasActive = isActive;

    await deleteDiagram(diagram.id);

    if (wasActive) {
      const remainingDiagrams = diagramIds.filter((id) => id !== diagram.id);
      if (remainingDiagrams.length > 0) {
        router.push(`/d/${remainingDiagrams[0]}`);
      } else {
        const newId = createDiagram("My System");
        router.push(`/d/${newId}`);
      }
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-1 px-2 py-1 mx-1 rounded cursor-pointer",
        isActive ? "bg-accent" : "hover:bg-muted"
      )}
      onClick={handleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-6 px-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      ) : (
        <span className="flex-1 text-sm truncate">{diagram.title}</span>
      )}

      {!isEditing && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleStartEdit}
            title="Rename"
          >
            <Pencil className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => togglePinned(diagram.id)}>
                {diagram.pinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
