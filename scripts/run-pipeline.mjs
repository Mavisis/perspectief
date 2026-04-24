/**
 * Local pipeline runner — same logic as api/pipeline/ingest.ts.
 * Run: node scripts/run-pipeline.mjs
 * Env: GOOGLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const GOOGLE_KEY   = process.env.GOOGLE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!GOOGLE_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars: GOOGLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const sbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ── Supabase helpers ──────────────────────────────────────────
async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders });
  return r.json();
}
async function sbPost(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST", headers: sbHeaders, body: JSON.stringify(body),
  });
  return r.json();
}
async function sbPatch(path, body) {
  await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
}
async function sbRpc(fn, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers: sbHeaders, body: JSON.stringify(body),
  });
  return r.json();
}

// ── Google Gemini (text) ──────────────────────────────────────
async function gemini(prompt, maxTokens = 200) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
      }),
    }
  );
  const d = await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// ── Google embedding ──────────────────────────────────────────
async function embed(text) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GOOGLE_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
      }),
    }
  );
  const d = await r.json();
  return d.embedding.values;
}

// ── RSS parser ────────────────────────────────────────────────
function parseRss(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) =>
      (block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i")) ??
        block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i")))?.[1]?.trim() ?? "";
    const title = get("title");
    const link = (get("link") || block.match(/<link\s*\/?>\s*([^<]+)/i)?.[1]?.trim()) ?? "";
    if (title && link) items.push({ title, description: get("description"), link, pubDate: get("pubDate") });
  }
  return items;
}

// ── Three-tier event matching ─────────────────────────────────
async function matchEvent(headline, summary) {
  const articleEmbedding = await embed(`${headline} ${summary}`);
  const vectorStr = `[${articleEmbedding.join(",")}]`;

  const matches = await sbRpc("match_event", {
    query_embedding: vectorStr,
    match_threshold: 0.60,
    match_count: 1,
  });
  const best = Array.isArray(matches) ? matches[0] : null;

  if (best?.similarity >= 0.85) {
    return { eventId: best.id, articleEmbedding };
  }

  if (best?.similarity >= 0.60) {
    const raw = await gemini(
      `Is dit artikel over hetzelfde nieuwsonderwerp als de volgende gebeurtenis?\nArtikel kop: "${headline}"\nGebeurtenis: "${best.title}"\nAntwoord ALLEEN met JSON: {"match": true} of {"match": false}`,
      50
    );
    try {
      const p = JSON.parse(raw.replace(/```json?|```/g, "").trim());
      if (p.match === true) return { eventId: best.id, articleEmbedding };
    } catch {}
  }

  const raw = await gemini(
    `Je bent een Nederlandse nieuwsredacteur. Geef een korte titel en samenvatting voor dit nieuwsonderwerp.\nKop: "${headline}"\nSamenvatting: "${summary}"\nAntwoord ALLEEN met JSON: {"title": "...", "summary": "..."}`,
    150
  );
  try {
    const p = JSON.parse(raw.replace(/```json?|```/g, "").trim());
    return { eventId: null, newTitle: p.title, newSummary: p.summary, articleEmbedding };
  } catch {
    return { eventId: null, newTitle: headline, newSummary: summary, articleEmbedding };
  }
}

// ── Main ──────────────────────────────────────────────────────
const outlets = await sbGet("outlets?select=id,name,rss_url");
console.log(`Running pipeline for ${outlets.length} outlets…\n`);

const stats = { fetched: 0, skipped: 0, inserted: 0, errors: [] };

for (const outlet of outlets) {
  if (!outlet.rss_url) continue;
  process.stdout.write(`[${outlet.name}] fetching RSS… `);

  try {
    const rssRes = await fetch(outlet.rss_url, {
      headers: { "User-Agent": "Perspectief-Bot/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!rssRes.ok) throw new Error(`HTTP ${rssRes.status}`);

    const items = parseRss(await rssRes.text()).slice(0, 5);
    console.log(`${items.length} items`);

    for (const item of items) {
      stats.fetched++;

      // Dedup by source URL
      const existing = await sbGet(`articles?select=id&source_url=eq.${encodeURIComponent(item.link)}&limit=1`);
      if (existing?.length) { stats.skipped++; continue; }

      process.stdout.write(`  → "${item.title.slice(0, 60)}"… `);
      const { eventId, newTitle, newSummary, articleEmbedding } =
        await matchEvent(item.title, item.description);

      let resolvedEventId = eventId;
      if (!resolvedEventId && newTitle) {
        const eventEmbedding = await embed(`${newTitle} ${newSummary ?? newTitle}`);
        const [newEvent] = await sbPost("events", {
          title: newTitle,
          date: new Date().toISOString().slice(0, 10),
          summary: newSummary ?? newTitle,
          shared_facts: [],
          embedding: `[${eventEmbedding.join(",")}]`,
        });
        resolvedEventId = newEvent?.id ?? null;
        process.stdout.write(`[new event: "${newTitle.slice(0, 40)}"] `);
      } else {
        process.stdout.write(`[event: ${resolvedEventId}] `);
      }

      const inserted = await sbPost("articles", {
        headline: item.title,
        summary: item.description.slice(0, 500),
        content: item.description,
        outlet_id: outlet.id,
        event_id: resolvedEventId,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source_url: item.link,
      });

      if (inserted?.code) {
        stats.errors.push(`${outlet.id}: ${inserted.message}`);
        console.log("error:", inserted.message);
      } else {
        stats.inserted++;
        console.log("ok");
      }
    }
  } catch (err) {
    stats.errors.push(`${outlet.id}: ${err.message}`);
    console.log(`error: ${err.message}`);
  }
}

console.log("\n── Summary ──────────────────────────────");
console.log(`Fetched:  ${stats.fetched}`);
console.log(`Skipped:  ${stats.skipped} (already in DB)`);
console.log(`Inserted: ${stats.inserted}`);
if (stats.errors.length) {
  console.log(`Errors:   ${stats.errors.length}`);
  stats.errors.forEach(e => console.log("  •", e));
}
