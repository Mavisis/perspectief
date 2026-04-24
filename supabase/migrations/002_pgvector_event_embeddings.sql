-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding vector(768);

-- ANN index (cosine) — ivfflat is fast at this scale
CREATE INDEX IF NOT EXISTS events_embedding_idx
  ON events USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- RPC function used by the pipeline for similarity search
CREATE OR REPLACE FUNCTION match_event(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.6,
  match_count     int   DEFAULT 1
)
RETURNS TABLE(id text, title text, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT id, title, 1 - (embedding <=> query_embedding) AS similarity
  FROM events
  WHERE embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
