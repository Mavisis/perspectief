export const config = { runtime: "edge" };

import { makeSupabase } from "../lib/supabase";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  if (!id) return json({ error: "Missing id" }, 400);

  const db = makeSupabase();
  const { data, error } = await db
    .from("articles")
    .select(`
      id, headline, summary, content, published_at, event_id,
      outlets(id, name, bias, ideology_x, ideology_y)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return json({ error: "Article not found" }, 404);

  const article = {
    id: data.id,
    headline: data.headline,
    summary: data.summary,
    content: data.content,
    publishedAt: data.published_at,
    eventId: data.event_id,
    outletId: (data as any).outlets?.id,
    outlet: (data as any).outlets
      ? {
          id: (data as any).outlets.id,
          name: (data as any).outlets.name,
          bias: (data as any).outlets.bias,
          ideology: { x: (data as any).outlets.ideology_x, y: (data as any).outlets.ideology_y },
        }
      : null,
  };

  return json(article, 200, { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" });
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}
