// Node.js runtime — needs longer timeout for RSS + Gemini API calls
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { makeSupabase } from "../lib/supabase.js";

// ── Auth guard ────────────────────────────────────────────────
function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.PIPELINE_SECRET;
  if (!secret) return false;
  return req.headers["authorization"] === `Bearer ${secret}`;
}

const GOOGLE_KEY = () => {
  const k = process.env.GOOGLE_API_KEY;
  if (!k) throw new Error("GOOGLE_API_KEY not set");
  return k;
};

// ── Embedding (gemini-embedding-2, 768-dim truncation) ────────
async function embed(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GOOGLE_KEY()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
      }),
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) throw new Error(`Embed ${res.status}`);
  const data: any = await res.json();
  return data.embedding.values as number[];
}

// ── Gemini text generation ────────────────────────────────────
async function gemini(prompt: string, maxTokens = 200): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_KEY()}`,
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
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data: any = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// ── RSS parser ────────────────────────────────────────────────
interface RssItem { title: string; description: string; link: string; pubDate: string; }

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
    if (title && link) items.push({ title, description: get("description"), link, pubDate: get("pubDate") });
  }
  return items;
}

// ── Three-tier event matching ─────────────────────────────────
//
//  1. Vector search (cosine similarity via pgvector)
//     ≥ 0.85  → confident match, skip LLM entirely
//     0.60–0.85 → ambiguous, ask Gemini to confirm
//     < 0.60  → clearly new event, ask Gemini to name it
//
interface MatchResult {
  eventId: string | null;
  newTitle?: string;
  newSummary?: string;
  articleEmbedding: number[];
}

async function matchEvent(
  db: ReturnType<typeof makeSupabase>,
  headline: string,
  summary: string
): Promise<MatchResult> {
  const articleEmbedding = await embed(`${headline} ${summary}`);
  const vectorStr = `[${articleEmbedding.join(",")}]`;

  const { data: matches } = await db.rpc("match_event", {
    query_embedding: vectorStr,
    match_threshold: 0.60,
    match_count: 1,
  });

  const best = (matches as Array<{ id: string; title: string; similarity: number }> | null)?.[0];

  // Tier 1 — high confidence match
  if (best && best.similarity >= 0.85) {
    return { eventId: best.id, articleEmbedding };
  }

  // Tier 2 — ambiguous: let Gemini confirm against the single candidate
  if (best && best.similarity >= 0.60) {
    const raw = await gemini(
      `Is dit artikel over hetzelfde nieuwsonderwerp als de volgende gebeurtenis?\n\nArtikel kop: "${headline}"\nGebeurtenis: "${best.title}"\n\nAntwoord ALLEEN met JSON: {"match": true} of {"match": false}`,
      50
    );
    try {
      const parsed = JSON.parse(raw.replace(/```json?|```/g, "").trim());
      if (parsed.match === true) return { eventId: best.id, articleEmbedding };
    } catch { /* fall through to new event */ }
  }

  // Tier 3 — new event: ask Gemini to generate title + summary
  const raw = await gemini(
    `Je bent een Nederlandse nieuwsredacteur. Geef een korte titel en samenvatting voor dit nieuwsonderwerp.\n\nKop: "${headline}"\nSamenvatting: "${summary}"\n\nAntwoord ALLEEN met JSON: {"title": "...", "summary": "..."}`,
    150
  );
  try {
    const parsed = JSON.parse(raw.replace(/```json?|```/g, "").trim());
    return { eventId: null, newTitle: parsed.title, newSummary: parsed.summary, articleEmbedding };
  } catch {
    return { eventId: null, newTitle: headline, newSummary: summary, articleEmbedding };
  }
}

// ── Main handler ──────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });

  const db = makeSupabase(true);
  const stats = { outlets: 0, fetched: 0, skipped: 0, inserted: 0, errors: [] as string[] };

  const { data: outlets } = await db.from("outlets").select("id, name, rss_url");
  if (!outlets?.length) return res.status(500).json({ error: "No outlets found" });

  // Auto-backfill any events without embeddings (idempotent)
  const { data: unembedded } = await db.from("events").select("id, title, summary").is("embedding", null);
  for (const ev of unembedded ?? []) {
    const vec = await embed(`${ev.title} ${ev.summary}`);
    await db.from("events").update({ embedding: `[${vec.join(",")}]` }).eq("id", ev.id);
  }

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
          .from("articles").select("id").eq("source_url", item.link).maybeSingle();
        if (existing) { stats.skipped++; continue; }

        const { eventId, newTitle, newSummary, articleEmbedding } =
          await matchEvent(db, item.title, item.description);

        let resolvedEventId = eventId;

        if (!resolvedEventId && newTitle) {
          const eventEmbedding = await embed(`${newTitle} ${newSummary ?? newTitle}`);
          const { data: newEvent } = await db
            .from("events")
            .insert({
              title: newTitle,
              date: new Date().toISOString().slice(0, 10),
              summary: newSummary ?? newTitle,
              shared_facts: [],
              embedding: `[${eventEmbedding.join(",")}]`,
            })
            .select("id")
            .single();
          resolvedEventId = newEvent?.id ?? null;
        }

        const { error: insertErr } = await db.from("articles").insert({
          headline: item.title,
          summary: item.description.slice(0, 500),
          content: item.description,
          outlet_id: outlet.id,
          event_id: resolvedEventId,
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
