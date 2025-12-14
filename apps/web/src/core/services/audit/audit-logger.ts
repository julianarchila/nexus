import { db } from "@/core/db/client";
import {
  auditLog,
  type ActorType,
  type ChangeType,
  type SourceType,
} from "@/core/db/schema";
import { nanoid } from "nanoid";

export interface AuditLogEntry {
  merchantId: string;
  targetTable: string;
  targetId: string;
  targetField?: string;
  changeType: ChangeType;
  oldValue?: unknown;
  newValue?: unknown;
  actorType: ActorType;
  actorId?: string;
  sourceType?: SourceType;
  sourceId?: string;
  reason?: string;
  aiExtractionId?: string;
}

/**
 * Creates an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  const id = nanoid();

  await db.insert(auditLog).values({
    id,
    merchant_id: entry.merchantId,
    target_table: entry.targetTable,
    target_id: entry.targetId,
    target_field: entry.targetField ?? null,
    change_type: entry.changeType,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    actor_type: entry.actorType,
    actor_id: entry.actorId ?? null,
    source_type: entry.sourceType ?? null,
    source_id: entry.sourceId ?? null,
    reason: entry.reason ?? null,
    ai_extraction_id: entry.aiExtractionId ?? null,
  });

  return id;
}
