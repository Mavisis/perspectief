export type BiasLabel =
  | "left"
  | "center-left"
  | "center"
  | "center-right"
  | "right"
  | "religious";

export interface Outlet {
  id: string;
  name: string;
  bias: BiasLabel;
  ideology: { x: number; y: number };
}

export interface Article {
  id: string;
  headline: string;
  summary: string;
  content: string;
  outletId: string;
  publishedAt: string;
  eventId: string;
}

export interface NewsEvent {
  id: string;
  title: string;
  date: string;
  summary: string;
  articleIds: string[];
  sharedFacts?: string[];
}

export const BIAS_META: Record<BiasLabel, { label: string; description: string }> = {
  left: { label: "Links", description: "Progressief / links-liberaal perspectief" },
  "center-left": { label: "Centrum-links", description: "Gematigd progressief perspectief" },
  center: { label: "Centrum", description: "Breed / onafhankelijk perspectief" },
  "center-right": { label: "Centrum-rechts", description: "Gematigd conservatief perspectief" },
  right: { label: "Rechts", description: "Conservatief / populistisch perspectief" },
  religious: { label: "Religieus", description: "Christelijk-geïnspireerd perspectief" },
};
