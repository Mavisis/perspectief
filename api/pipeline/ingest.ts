// Node.js runtime — needs longer timeout for RSS + Gemini API calls
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { makeSupabase } from "../lib/supabase.js";

// ── Auth guard ────────────────────────────────────────────────
function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.PIPELINE_SECRET;
  if (!secret) return false;
  return req.headers["authorization"] === `Bearer ${secret}`;
}

// ── Google Gemini helper ──────────────────────────────────────
async function gemini(prompt: string, maxTokens = 200): Promise<string> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// ── RSS parser ────────────────────────────────────────────────
interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) =>
      (block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i")) ??
        block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i")))?.[1]?.trim() ?? "";

    const title = get("title");
    const link = (get("link") || block.match(/<link\s*\/?>\s*([^<]+)/i)?.[1]?.trim()) ?? "";
    if (title && link) {
      items.push({ title, description: get("description"), link, pubDate: get("pubDate") });
    }
  }
  return items;
}

// ── Classify ideology via Gemini ──────────────────────────────
async function classifyIdeology(
  outletName: string,
  headline: string,
  summary: string
): Promise<{ x: number; y: number }> {
  const text = await gemini(
    `Je bent een Nederlandse media-analist. Classificeer dit artikel op een 2D ideologische schaal.
X-as: -1.0 (extreem links) tot +1.0 (extreem rechts)
Y-as: -1.0 (progressief/liberaal) tot +1.0 (conservatief)

Medium: ${outletName}
Kop: ${headline}
Samenvatting: ${summary}

Antwoord ALLEEN met geldig JSON: {"x": getal, "y": getal}`,
    100
  );

  try {
    const p = JSON.parse(text.replace(/```json?|```/g, "").trim());
    const clamp = (v: number) => Math.max(-1, Math.min(1, Number(v) || 0));
    return { x: clamp(p.x), y: clamp(p.y) };
  } catch {
    return { x: 0, y: 0 };
  }
}

// ── Match or create event via Gemini ─────────────────────────
async function matchEvent(
  headline: string,
  summary: string,
  existing: Array<{ id: string; title: string }>
): Promise<{ eventId: string | null; newTitle?: string; newSummary?: string }> {
  const list = existing
    .slice(0, 10)
    .map((e) => `- id:${e.id} titel:"${e.title}"`)
    .join("\n");

  const text = await gemini(
    `Je bent een Nederlandse nieuwsredacteur. Hoort dit artikel bij een van de recente nieuwsgebeurtenissen?

Kop: "${headline}"
Samenvatting: "${summary}"

Recente gebeurtenissen:
${list || "(nog geen)"}

Antwoord ALLEEN met geldig JSON:
- Bij match: {"match": "EVENT_ID"}
- Nieuw event: {"new": true, "title": "Korte Nederlandse titel", "summary": "Één zin samenvatting"}`,
    200
  );

  try {
    const p = JSON.parse(text.replace(/```json?|```/g, "").trim());
    if (p.match) return { eventId: p.match };
    if (p.new) return { eventId: null, newTitle: p.title, newSummary: p.summary };
  } catch { /* fall through */ }
  return { eventId: null };
}

// ── Main handler ──────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });

  const db = makeSupabase(true);
  const stats = { outlets: 0, fetched: 0, inserted: 0, errors: [] as string[] };

  const { data: outlets } = await db.from("outlets").select("id, name, rss_url");
  if (!outlets?.length) return res.status(500).json({ error: "No outlets found" });

  const since = new Date(Date.now() - 14 * 86400_000).toISOString();
  const { data: recentEvents } = await db
    .from("events")
    .select("id, title, summary")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);

  const eventCache = (recentEvents ?? []) as Array<{ id: string; title: string; summary: string }>;

  for (const outlet of outlets) {
    if (!outlet.rss_url) continue;
    stats.outlets++;

    try {
      const rssRes = await fetch(outlet.rss_url, {
        headers: { "User-Agent": "Perspectief-Bot/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!rssRes.ok) throw new Error(`RSS ${rssRes.status}`);

      const items = parseRss(await rssRes.text()).slice(0, 5);

      for (const item of items) {
        stats.fetched++;

        const { data: existing } = await db
          .from("articles")
          .select("id")
          .eq("source_url", item.link)
          .maybeSingle();
        if (existing) continue;

        const [ideology, eventResult] = await Promise.all([
          classifyIdeology(outlet.name, item.title, item.description),
          matchEvent(item.title, item.description, eventCache),
        ]);

        let eventId = eventResult.eventId;
        if (!eventId && eventResult.newTitle) {
          const { data: newEvent } = await db
            .from("events")
            .insert({
              title: eventResult.newTitle,
              date: new Date().toISOString().slice(0, 10),
              summary: eventResult.newSummary ?? eventResult.newTitle,
              shared_facts: [],
            })
            .select("id, title, summary")
            .single();
          if (newEvent) {
            eventId = newEvent.id;
            eventCache.unshift(newEvent as any);
          }
        }

        const { error: insertErr } = await db.from("articles").insert({
          headline: item.title,
          summary: item.description.slice(0, 500),
          content: item.description,
          outlet_id: outlet.id,
          event_id: eventId,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          source_url: item.link,
        });

        if (insertErr) stats.errors.push(`${outlet.id}: ${insertErr.message}`);
        else stats.inserted++;
      }
    } catch (err: any) {
      stats.errors.push(`${outlet.id}: ${err.message}`);
    }
  }

  return res.status(200).json({ ok: true, stats });
}
