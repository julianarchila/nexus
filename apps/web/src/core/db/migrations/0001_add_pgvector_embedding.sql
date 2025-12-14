-- NOTE: pgvector extension must be enabled via PlanetScale Dashboard first
-- (pgvector requires superuser privileges on PlanetScale)
-- Go to: Database > Extensions > Enable "pgvector"

-- Add embedding column to inbound_event table
-- Using 768 dimensions for Gemini embedding model
ALTER TABLE inbound_event
ADD COLUMN embedding vector(768);

-- Create HNSW index for fast similarity search
-- HNSW is recommended for production use with pgvector
CREATE INDEX inbound_event_embedding_idx
ON inbound_event
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add index on merchant_id + embedding for filtered similarity searches
-- This helps when searching within a specific merchant's events
CREATE INDEX inbound_event_merchant_embedding_idx
ON inbound_event (merchant_id)
WHERE embedding IS NOT NULL;
