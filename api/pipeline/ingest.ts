// Node.js runtime — needs longer timeout for RSS + Claude API calls
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { makeSupabase } from "../lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Auth guard ────────────────────────────────────────────────
function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.PIPELINE_SECRET;
  if (!secret) return false;
  const header = req.headers["authorization"] ?? "";
  return header === `Bearer ${secret}`;
}

// ── RSS parser (no external deps, Edge-compatible XML) ────────
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
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"))
        ?? block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i"));
      return m?.[1]?.trim() ?? "";
    };
    const title = get("title");
    const link = get("link") || block.match(/<link\s*\/?>[\s]*([^<]+)/i)?.[1]?.trim() ?? "";
    if (title && link) {
      items.push({ title, description: get("description"), link, pubDate: get("pubDate") });
    }
  }
  return items;
}

// ── Claude: classify article ideology ────────────────────────
interface IdeologyResult {
  x: number;
  y: number;
}

async function classifyIdeology(
  outletName: string,
  headline: string,
  summary: string
): Promise<IdeologyResult> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `You are a Dutch media bias analyst. Classify this article's ideological position on a 2D scale.
X axis: -1.0 (far left) to +1.0 (far right)
Y axis: -1.0 (progressive/liberal) to +1.0 (conservative)

Outlet: ${outletName}
Headline: ${headline}
Summary: ${summary}

Reply with ONLY valid JSON: {"x": float, "y": float}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  try {
    const parsed = JSON.parse(text.replace(/```json?|```/g, "").trim());
    const clamp = (v: number) => Math.max(-1, Math.min(1, Number(v) || 0));
    return { x: clamp(parsed.x), y: clamp(parsed.y) };
  } catch {
    return { x: 0, y: 0 };
  }
}

// ── Claude: match or create event ────────────────────────────
async function matchEvent(
  headline: string,
  summary: string,
  existingEvents: Array<{ id: string; title: string; summary: string }>
): Promise<{ eventId: string | null; newTitle?: string; newSummary?: string }> {
  const eventList = existingEvents
    .slice(0, 10)
    .map((e) => `- id:${e.id} title:"${e.title}"`)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `You are a Dutch news editor. Does this article cover the same news event as one of the recent events listed below?

Article headline: "${headline}"
Article summary: "${summary}"

Recent events:
${eventList || "(none yet)"}

Reply with ONLY valid JSON:
- If it matches: {"match": "EVENT_ID_HERE"}
- If it's a new event: {"new": true, "title": "Short Dutch event title", "summary": "One sentence Dutch summary"}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  try {
    const parsed = JSON.parse(text.replace(/```json?|```/g, "").trim());
    if (parsed.match) return { eventId: parsed.match };
    if (parsed.new) return { eventId: null, newTitle: parsed.title, newSummary: parsed.summary };
  } catch { /* fall through */ }
  return { eventId: null };
}

// ── Main handler ──────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });

  const db = makeSupabase(true); // service role for writes
  const stats = { outlets: 0, fetched: 0, inserted: 0, errors: [] as string[] };

  // 1. Load outlets
  const { data: outlets } = await db.from("outlets").select("id, name, rss_url");
  if (!outlets?.length) return res.status(500).json({ error: "No outlets found" });

  // 2. Load recent events for clustering (last 14 days)
  const since = new Date(Date.now() - 14 * 86400_000).toISOString();
  const { data: recentEvents } = await db
    .from("events")
    .select("id, title, summary")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);

  const eventCache = recentEvents ?? [];

  for (const outlet of outlets) {
    if (!outlet.rss_url) continue;
    stats.outlets++;

    try {
      const rssRes = await fetch(outlet.rss_url, {
        headers: { "User-Agent": "Perspectief-Bot/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!rssRes.ok) throw new Error(`RSS ${rssRes.status}`);

      const xml = await rssRes.text();
      const items = parseRss(xml).slice(0, 5); // max 5 per outlet per run

      for (const item of items) {
        stats.fetched++;

        // Skip already-ingested URLs
        const { data: existing } = await db
          .from("articles")
          .select("id")
          .eq("source_url", item.link)
          .maybeSingle();
        if (existing) continue;

        // Classify ideology
        const ideology = await classifyIdeology(outlet.name, item.title, item.description);

        // Match or create event
        const eventResult = await matchEvent(item.title, item.description, eventCache);

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
            eventCache.unshift({ id: newEvent.id, title: newEvent.title, summary: newEvent.summary });
          }
        }

        // Insert article
        const { error: insertErr } = await db.from("articles").insert({
          headline: item.title,
          summary: item.description.slice(0, 500),
          content: item.description,
          outlet_id: outlet.id,
          event_id: eventId,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          source_url: item.link,
          // Store ideology on outlet update if it drifts — for now store per-article via a jsonb column
          // (ideology already lives on the outlet row; article-level jitter happens client-side)
        });

        if (insertErr) {
          stats.errors.push(`${outlet.id}: ${insertErr.message}`);
        } else {
          stats.inserted++;
        }
      }
    } catch (err: any) {
      stats.errors.push(`${outlet.id}: ${err.message}`);
    }
  }

  return res.status(200).json({ ok: true, stats });
}
