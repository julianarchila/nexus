import { and, eq, isNotNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/core/db/client";
import { inboundEvent, type ProcessingStatus } from "@/core/db/schema";
import type { NormalizedInboundEvent } from "@/core/workflows/adapters/types";

/**
 * Creates a new inbound event record in the database
 */
export async function createInboundEvent(
  event: NormalizedInboundEvent,
  merchantId: string,
): Promise<string> {
  const id = nanoid();

  await db.insert(inboundEvent).values({
    id,
    merchant_id: merchantId,
    source_type: event.sourceType,
    source_id: event.sourceId,
    raw_content: event.rawContent,
    metadata: event.metadata,
    processing_status: "PENDING",
  });

  return id;
}

/**
 * Retrieves an inbound event by ID
 */
export async function getInboundEvent(id: string) {
  const [event] = await db
    .select()
    .from(inboundEvent)
    .where(eq(inboundEvent.id, id))
    .limit(1);

  return event;
}

/**
 * Updates the processing status of an inbound event
 */
export async function updateInboundEventStatus(
  id: string,
  status: ProcessingStatus,
  errorMessage?: string,
): Promise<void> {
  const updateData: {
    processing_status: ProcessingStatus;
    processed_at?: Date;
    metadata?: Record<string, unknown>;
  } = {
    processing_status: status,
  };

  if (status === "PROCESSED" || status === "FAILED") {
    updateData.processed_at = new Date();
  }

  if (errorMessage) {
    updateData.metadata = { error: errorMessage };
  }

  await db.update(inboundEvent).set(updateData).where(eq(inboundEvent.id, id));
}

/**
 * Search events by semantic similarity using pgvector
 * @param merchantId - The merchant to search within
 * @param queryEmbedding - The embedding vector of the search query
 * @param limit - Maximum number of results to return (default: 20)
 * @param similarityThreshold - Minimum similarity score (0-1, default: 0.3)
 * @returns Events sorted by similarity (most similar first)
 */
export async function searchEventsBySimilarity(
  merchantId: string,
  queryEmbedding: number[],
  limit = 20,
  similarityThreshold = 0.3,
) {
  // Convert embedding array to pgvector format
  const embeddingVector = `[${queryEmbedding.join(",")}]`;

  // Use raw SQL for cosine similarity with pgvector
  // 1 - cosine_distance gives us similarity (0 to 1, higher is more similar)
  const results = await db
    .select({
      id: inboundEvent.id,
      merchant_id: inboundEvent.merchant_id,
      source_type: inboundEvent.source_type,
      source_id: inboundEvent.source_id,
      raw_content: inboundEvent.raw_content,
      metadata: inboundEvent.metadata,
      processing_status: inboundEvent.processing_status,
      processed_at: inboundEvent.processed_at,
      created_at: inboundEvent.created_at,
      similarity:
        sql<number>`1 - (embedding <=> ${embeddingVector}::vector)`.as(
          "similarity",
        ),
    })
    .from(inboundEvent)
    .where(
      and(
        eq(inboundEvent.merchant_id, merchantId),
        isNotNull(inboundEvent.embedding),
        sql`1 - (embedding <=> ${embeddingVector}::vector) >= ${similarityThreshold}`,
      ),
    )
    .orderBy(sql`embedding <=> ${embeddingVector}::vector`)
    .limit(limit);

  return results;
}

/**
 * Update the embedding for an inbound event
 */
export async function updateEventEmbedding(
  id: string,
  embedding: number[],
): Promise<void> {
  await db
    .update(inboundEvent)
    .set({ embedding })
    .where(eq(inboundEvent.id, id));
}
