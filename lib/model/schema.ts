import { z } from "zod";

// Viewport schema
export const ViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().min(0.1).max(4),
});

export type Viewport = z.infer<typeof ViewportSchema>;

// Curve control points for bezier edges
export const CurveSchema = z.object({
  type: z.literal("bezier"),
  c1: z.object({ x: z.number(), y: z.number() }).optional(),
  c2: z.object({ x: z.number(), y: z.number() }).optional(),
});

export type Curve = z.infer<typeof CurveSchema>;

// Ontology metadata (reserved for future)
export const OntologySchema = z.object({
  entityType: z.string().optional(),
  description: z.string().optional(),
});

export type Ontology = z.infer<typeof OntologySchema>;

// Node schema
export const NodeSchema = z.object({
  id: z.string(),
  type: z.literal("stock"),
  kind: z.enum(["internal", "external"]).optional(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  childDiagramId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  ontology: OntologySchema.optional(),
});

export type Node = z.infer<typeof NodeSchema>;

// Edge schema
export const EdgeSchema = z.object({
  id: z.string(),
  type: z.literal("flow"),
  kind: z.enum(["flow", "influence", "relationship"]).optional(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string(),
  curve: CurveSchema.optional(),
  directionality: z.enum(["directed", "undirected"]).optional(),
  relationshipType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
});

export type Edge = z.infer<typeof EdgeSchema>;

// Frame schema (visual grouping)
export const FrameSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type Frame = z.infer<typeof FrameSchema>;

// Note schema
export const NoteSchema = z.object({
  id: z.string(),
  content: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type Note = z.infer<typeof NoteSchema>;

// UI settings per diagram
export const DiagramUISchema = z.object({
  labelMode: z.enum(["hover", "always"]).optional(),
  themeOverride: z.record(z.any()).optional(),
  hasRunInitialAutoLayout: z.boolean().optional(),
  hasManualLayoutEdits: z.boolean().optional(),
});

export type DiagramUI = z.infer<typeof DiagramUISchema>;

// Parent reference for drill-down
export const ParentRefSchema = z.object({
  diagramId: z.string(),
  viaStockId: z.string(),
});

export type ParentRef = z.infer<typeof ParentRefSchema>;

// Full diagram document
export const DiagramDocSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  parent: ParentRefSchema.optional(),
  viewport: ViewportSchema.optional(),
  ui: DiagramUISchema.optional(),
  nodes: z.record(NodeSchema),
  edges: z.record(EdgeSchema),
  frames: z.record(FrameSchema).optional(),
  notes: z.record(NoteSchema).optional(),
});

export type DiagramDoc = z.infer<typeof DiagramDocSchema>;

// User preferences
export const ThemePrefsSchema = z.object({
  fontFamily: z.enum(["inter", "ibm-plex-mono", "system"]).default("inter"),
  accent: z.enum(["mono", "subtle"]).optional().default("mono"),
});

export type ThemePrefs = z.infer<typeof ThemePrefsSchema>;

export const UserPrefsSchema = z.object({
  version: z.literal(1),
  theme: ThemePrefsSchema,
  labelModeDefault: z.enum(["hover", "always"]).default("hover"),
  grid: z.object({
    enabled: z.boolean().default(true),
  }),
});

export type UserPrefs = z.infer<typeof UserPrefsSchema>;

// Diagram index entry (for listing diagrams)
export const DiagramIndexEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  updatedAt: z.number(),
  isRoot: z.boolean().optional(),
});

export type DiagramIndexEntry = z.infer<typeof DiagramIndexEntrySchema>;

// Default values
export const DEFAULT_NODE_WIDTH = 160;
export const DEFAULT_NODE_HEIGHT = 48;

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const DEFAULT_USER_PREFS: UserPrefs = {
  version: 1,
  theme: {
    fontFamily: "inter",
    accent: "mono",
  },
  labelModeDefault: "hover",
  grid: {
    enabled: true,
  },
};
