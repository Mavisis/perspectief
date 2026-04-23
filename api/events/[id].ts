export const config = { runtime: "edge" };

import { makeSupabase } from "../lib/supabase";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  if (!id) return json({ error: "Missing id" }, 400);

  const db = makeSupabase();
  const { data: event, error: eventErr } = await db
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (eventErr || !event) return json({ error: "Event not found" }, 404);

  const { data: articles, error: artErr } = await db
    .from("articles")
    .select(`
      id, headline, summary, content, published_at,
      outlets(id, name, bias, ideology_x, ideology_y)
    `)
    .eq("event_id", id)
    .order("published_at", { ascending: true });

  if (artErr) return json({ error: artErr.message }, 500);

  const payload = {
    id: event.id,
    title: event.title,
    date: event.date,
    summary: event.summary,
    sharedFacts: event.shared_facts,
    articles: (articles ?? []).map((a: any) => ({
      id: a.id,
      headline: a.headline,
      summary: a.summary,
      content: a.content,
      publishedAt: a.published_at,
      outletId: a.outlets?.id,
      outlet: a.outlets
        ? {
            id: a.outlets.id,
            name: a.outlets.name,
            bias: a.outlets.bias,
            ideology: { x: a.outlets.ideology_x, y: a.outlets.ideology_y },
          }
        : null,
    })),
  };

  return json(payload, 200, { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" });
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}
