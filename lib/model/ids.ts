import { nanoid } from "nanoid";

export function generateId(): string {
  return nanoid(12);
}

export function generateDiagramId(): string {
  return `d_${nanoid(12)}`;
}

export function generateNodeId(): string {
  return `n_${nanoid(12)}`;
}

export function generateEdgeId(): string {
  return `e_${nanoid(12)}`;
}

export function generateFrameId(): string {
  return `f_${nanoid(12)}`;
}

export function generateNoteId(): string {
  return `note_${nanoid(12)}`;
}
