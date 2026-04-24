export const config = { runtime: "edge" };

import { makeSupabase } from "../lib/supabase.js";

export default async function handler(_req: Request): Promise<Response> {
  const db = makeSupabase();
  const { data, error } = await db
    .from("outlets")
    .select("id, name, bias, ideology_x, ideology_y")
    .order("name");

  if (error) return json({ error: error.message }, 500);

  const outlets = (data ?? []).map((o: any) => ({
    id: o.id,
    name: o.name,
    bias: o.bias,
    ideology: { x: o.ideology_x, y: o.ideology_y },
  }));

  return json(outlets, 200, { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" });
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}
