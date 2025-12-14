import { searchEventsBySimilarity } from "@/core/repositories/inbound-event.repo";
import { generateEmbedding } from "@/lib/embedding";

export interface SearchResult {
  id: string;
  merchant_id: string;
  source_type: string;
  source_id: string | null;
  raw_content: string;
  metadata: Record<string, unknown> | null;
  processing_status: string;
  processed_at: Date | null;
  created_at: Date;
  similarity: number;
}

/**
 * Semantic search service for inbound events
 * Combines embedding generation with vector similarity search
 */
export async function searchEvents(
  merchantId: string,
  query: string,
  options?: {
    limit?: number;
    similarityThreshold?: number;
  },
): Promise<SearchResult[]> {
  const { limit = 20, similarityThreshold = 0.3 } = options ?? {};

  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(query);

  // Search for similar events
  const results = await searchEventsBySimilarity(
    merchantId,
    queryEmbedding,
    limit,
    similarityThreshold,
  );

  return results as SearchResult[];
}
