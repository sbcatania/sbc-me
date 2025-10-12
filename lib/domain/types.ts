export type UnitFormat = "number" | "percent" | "integer" | "decimal";

export type Unit = {
  key: string;            // e.g., "hours/night", "arbUnits", "probability"
  format: UnitFormat;     // how to format displayed numbers
  decimals?: number;      // default 2
};

export type Interval = { start?: string; end?: string | null }; // ISO dates

export type Metric = {
  key: string;            // e.g., "P(girlfriend)", "ShareholderValue"
  value: number;          // displayed number (in its Unit)
  unit?: Unit;
  ci?: number;            // half-width for ± display (optional)
};

export type Stock = {
  id: string;
  title: string;
  unit: Unit;             // real-world units for display (not normalized)
  value: number;          // real value (e.g., Sleep = 7.4 hours/night)
  displayDomain?: [number, number];   // optional (min,max) for normalization
  active: Interval;       // global active range
  driftPerSec?: number;   // small signed delta to make the displayed number gently move
  parentStockId?: string; // optional nesting support (v1: not rendered as nested boxes)
};

export type Flow = {
  id: string;
  from: string;           // Stock.id
  to: string;             // Stock.id
  rate: number;           // real value in flow's own units (arbitrary)
  displayDomain?: [number, number]; // for thickness normalization
  valvePosition?: number; // 0..1 local tweak (session only, default 0.5 meaning "no change")
  active?: Interval;      // global active range
};

export type Objective = {
  id: string;
  title: string;
  description?: string;
  metric?: Metric;        // optional objective metric with CI
  stocks: string[];       // Stock ids enclosed by this objective
  flows: string[];        // Flow ids enclosed by this objective
  parentObjectiveId?: string; // optional nesting (v1: chips rendered flat)
  active?: Interval;
};

export type ArtifactType = "Essay" | "Project" | "Video" | "Image" | "Doc" | "Book";

export type Artifact = {
  id: string;
  title: string;
  type: ArtifactType;
  url?: string;
  date?: string;
  summary?: string;
  coverImageUrl?: string;
  stockIds?: string[];
  objectiveIds?: string[];
};

export type Snapshot = {
  date: string; // "YYYY-MM"
  stockOverrides?: Record<string, Partial<Pick<Stock,"value"|"displayDomain"|"active">>>;
  flowOverrides?: Record<string, Partial<Pick<Flow,"rate"|"displayDomain"|"active">>>;
  objectiveActive?: Record<string, boolean>; // show/hide objective for the snapshot
  milestones?: { id: string; label: string }[];
};

export type SystemData = {
  stocks: Stock[];
  flows: Flow[];
  objectives: Objective[];
  artifacts: Artifact[];
  snapshots: Snapshot[]; // include a "current" snapshot month
};

