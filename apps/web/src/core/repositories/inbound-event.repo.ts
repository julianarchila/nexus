import { db } from "@/core/db/client";
import { inboundEvent, type ProcessingStatus } from "@/core/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
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
