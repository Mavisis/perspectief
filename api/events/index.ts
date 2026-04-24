export const config = { runtime: "edge" };

import { makeSupabase } from "../lib/supabase.js";

export default async function handler(_req: Request): Promise<Response> {
  const db = makeSupabase();
  const { data, error } = await db
    .from("events")
    .select(`
      id, title, date, summary, shared_facts, created_at,
      articles(count)
    `)
    .order("date", { ascending: false });

  if (error) {
    return json({ error: error.message }, 500);
  }

  const events = (data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    summary: e.summary,
    sharedFacts: e.shared_facts,
    articleCount: e.articles?.[0]?.count ?? 0,
  }));

  return json(events, 200, { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" });
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}
