import { eq } from "drizzle-orm";

import { db } from "@/core/db/client";
import { inboundEvent } from "@/core/db/schema";
import {
  generateEmbedding,
  prepareEventTextForEmbedding,
} from "@/lib/embedding";
import { inngest } from "@/lib/inngest";

/**
 * Inngest function: Generates embedding for an inbound event
 * Trigger: "embedding/generate"
 * Retries: 3
 *
 * Steps:
 * 1. Load inbound event
 * 2. Prepare text for embedding (combine content + metadata)
 * 3. Generate embedding using Gemini
 * 4. Save embedding to database
 */
export const generateEventEmbedding = inngest.createFunction(
  {
    id: "embedding-generate",
    name: "Generate Event Embedding",
    retries: 3,
  },
  { event: "embedding/generate" },
  async ({ event, step }) => {
    const { inboundEventId } = event.data;

    // Step 1: Load inbound event
    const inboundEventData = await step.run("load-inbound-event", async () => {
      const [evt] = await db
        .select()
        .from(inboundEvent)
        .where(eq(inboundEvent.id, inboundEventId))
        .limit(1);

      if (!evt) {
        throw new Error(`Inbound event not found: ${inboundEventId}`);
      }

      return evt;
    });

    // Step 2: Skip if already has embedding
    if (inboundEventData.embedding) {
      return {
        success: true,
        inboundEventId,
        skipped: true,
        reason: "Embedding already exists",
      };
    }

    // Step 3: Generate embedding
    const embedding = await step.run("generate-embedding", async () => {
      const text = prepareEventTextForEmbedding(
        inboundEventData.raw_content,
        inboundEventData.metadata as Record<string, unknown> | null,
      );

      return await generateEmbedding(text);
    });

    // Step 4: Save embedding to database
    await step.run("save-embedding", async () => {
      await db
        .update(inboundEvent)
        .set({ embedding })
        .where(eq(inboundEvent.id, inboundEventId));
    });

    return {
      success: true,
      inboundEventId,
      embeddingDimensions: embedding.length,
    };
  },
);
