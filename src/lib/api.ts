import type { Article, NewsEvent, Outlet } from "./types";

// ── Types returned by the API ────────────────────────────────

export interface ApiArticle extends Article {
  outlet?: Outlet;
}

export interface ApiEvent extends NewsEvent {
  articleCount?: number;
  articles?: ApiArticle[];
}

// ── Fetch helper ─────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── API surface ──────────────────────────────────────────────

export const api = {
  events: {
    list: (): Promise<ApiEvent[]> => get("/api/events"),
    get: (id: string): Promise<ApiEvent> => get(`/api/events/${id}`),
  },
  articles: {
    get: (id: string): Promise<ApiArticle> => get(`/api/articles/${id}`),
  },
  outlets: {
    list: (): Promise<Outlet[]> => get("/api/outlets"),
  },
} as const;
