// One-time backfill: generate embeddings for all events that don't have one yet.
// Run: node scripts/backfill-embeddings.mjs

const GOOGLE_KEY   = process.env.GOOGLE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!GOOGLE_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars — set GOOGLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const headers = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function embed(text) {
  const res = await fetch(
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
  if (!res.ok) throw new Error(`Embed API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

// Fetch events without embeddings
const listRes = await fetch(
  `${SUPABASE_URL}/rest/v1/events?select=id,title,summary&embedding=is.null`,
  { headers }
);
const events = await listRes.json();
console.log(`Found ${events.length} events to backfill`);

for (const event of events) {
  const text = `${event.title} ${event.summary}`;
  process.stdout.write(`  Embedding "${event.title}"... `);
  const vector = await embed(text);

  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/events?id=eq.${event.id}`,
    {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({ embedding: `[${vector.join(",")}]` }),
    }
  );
  console.log(patchRes.ok ? "ok" : `error ${patchRes.status}`);
}

console.log("Done.");
