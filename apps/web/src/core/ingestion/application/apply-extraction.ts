import { inngest } from "@/lib/inngest";
import { db } from "@/core/db/client";
import { aiExtraction, scopeInDoc } from "@/core/db/schema";
import { eq, inArray } from "drizzle-orm";
import { applyExtractionToScope } from "../services/applicator";
import { createAuditLog } from "@/core/services/audit/audit-logger";

/**
 * Inngest function: Applies AI extractions to scope_in_doc
 * Trigger: "extraction/completed"
 *
 * Steps:
 * 1. Load extractions by IDs
 * 2. Separate HIGH confidence (auto-apply)
 * 3. For each HIGH confidence extraction:
 *    a. Apply to scope_in_doc
 *    b. Create audit_log entry (actor_type: "AI")
 *    c. Update ai_extraction status to "AUTO_APPLIED"
 */
export const applyExtraction = inngest.createFunction(
  { id: "apply-extraction", name: "Apply AI Extractions" },
  { event: "extraction/completed" },
  async ({ event, step }) => {
    const { merchantId, extractionIds, inboundEventId } = event.data;

    // Step 1: Load extractions
    const extractions = await step.run("load-extractions", async () => {
      return await db
        .select()
        .from(aiExtraction)
        .where(inArray(aiExtraction.id, extractionIds));
    });

    // Step 2: Find scope_in_doc for merchant
    const scope = await step.run("load-scope", async () => {
      const [s] = await db
        .select()
        .from(scopeInDoc)
        .where(eq(scopeInDoc.merchant_id, merchantId))
        .limit(1);

      if (!s) {
        throw new Error(`Scope not found for merchant: ${merchantId}`);
      }

      return s;
    });

    // Step 3: Process HIGH confidence extractions
    const highConfidenceExtractions = extractions.filter(
      (e) => e.confidence === "HIGH",
    );

    const appliedCount = await step.run(
      "apply-high-confidence",
      async (): Promise<number> => {
        let count = 0;

        for (const extraction of highConfidenceExtractions) {
          try {
            // Apply the extraction
            const result = await applyExtractionToScope(
              merchantId,
              scope.id,
              extraction.target_field,
              extraction.extracted_value,
            );

            // Create audit log
            await createAuditLog({
              merchantId,
              targetTable: extraction.target_table,
              targetId: scope.id,
              targetField: extraction.target_field,
              changeType: "UPDATE",
              oldValue: result.oldValue,
              newValue: result.newValue,
              actorType: "AI",
              sourceType: "MEETING", // TODO: Get from inbound_event
              sourceId: inboundEventId,
              reason: `AI extraction with HIGH confidence: ${extraction.reasoning}`,
              aiExtractionId: extraction.id,
            });

            // Mark extraction as AUTO_APPLIED
            await db
              .update(aiExtraction)
              .set({
                status: "AUTO_APPLIED",
                applied_at: new Date(),
              })
              .where(eq(aiExtraction.id, extraction.id));

            count++;
          } catch (error) {
            console.error(
              `Failed to apply extraction ${extraction.id}:`,
              error,
            );
            // Continue with other extractions
          }
        }

        return count;
      },
    );

    return {
      success: true,
      merchantId,
      totalExtractions: extractions.length,
      highConfidenceCount: highConfidenceExtractions.length,
      appliedCount,
    };
  },
);
