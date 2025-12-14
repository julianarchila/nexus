import { inngest } from "@/lib/inngest";
import { db } from "@/core/db/client";
import { scopeInDoc, aiExtraction } from "@/core/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  getInboundEvent,
  updateInboundEventStatus,
} from "../services/inbound-event.repo";
import { extractFromContent, type CurrentScope } from "../services/extractor";

/**
 * Inngest function: Processes inbound events
 * Trigger: "ingest/event.created"
 * Retries: 3
 *
 * Steps:
 * 1. Load inbound event
 * 2. TODO: Implement idempotency check - prevent re-processing same source_id
 * 3. Load current scope_in_doc for context
 * 4. AI extraction (batch)
 * 5. Save ai_extraction records
 * 6. Update inbound_event status to PROCESSED
 * 7. Emit "extraction/completed"
 */
export const processEvent = inngest.createFunction(
  {
    id: "ingest-process-event",
    name: "Process Inbound Event",
    retries: 3,
  },
  { event: "ingest/event.created" },
  async ({ event, step }) => {
    const { inboundEventId } = event.data;

    // Step 1: Load inbound event
    const inboundEvent = await step.run("load-inbound-event", async () => {
      const evt = await getInboundEvent(inboundEventId);
      if (!evt) {
        throw new Error(`Inbound event not found: ${inboundEventId}`);
      }
      return evt;
    });

    // Step 2: Update status to PROCESSING
    await step.run("mark-processing", async () => {
      await updateInboundEventStatus(inboundEventId, "PROCESSING");
    });

    // Step 3: Load current scope for context
    const currentScope = await step.run(
      "load-current-scope",
      async (): Promise<CurrentScope | null> => {
        const [scope] = await db
          .select()
          .from(scopeInDoc)
          .where(eq(scopeInDoc.merchant_id, inboundEvent.merchant_id))
          .limit(1);

        if (!scope) return null;

        return {
          psps: (scope.psps as string[]) ?? [],
          countries: (scope.countries as string[]) ?? [],
          payment_methods: (scope.payment_methods as string[]) ?? [],
          expected_volume: scope.expected_volume ?? null,
          expected_approval_rate: scope.expected_approval_rate ?? null,
          restrictions: (scope.restrictions as string[]) ?? [],
          dependencies: (scope.dependencies as string[]) ?? [],
          compliance_requirements:
            (scope.compliance_requirements as string[]) ?? [],
          expected_go_live_date: scope.expected_go_live_date
            ? new Date(scope.expected_go_live_date)
            : null,
          comes_from_mor: scope.comes_from_mor ?? false,
          deal_closed_by: scope.deal_closed_by ?? null,
        };
      },
    );

    // Step 4: AI extraction
    const extractions = await step.run("ai-extraction", async () => {
      return await extractFromContent(
        inboundEvent.raw_content,
        inboundEvent.source_type,
        currentScope,
      );
    });

    // Step 5: Save ai_extraction records
    const extractionIds = await step.run(
      "save-extractions",
      async (): Promise<string[]> => {
        const ids: string[] = [];

        for (const extraction of extractions) {
          const id = nanoid();
          await db.insert(aiExtraction).values({
            id,
            inbound_event_id: inboundEventId,
            merchant_id: inboundEvent.merchant_id,
            target_table: "scope_in_doc",
            target_field: extraction.targetField,
            extracted_value: extraction.extractedValue as Record<
              string,
              unknown
            >,
            confidence: extraction.confidence,
            reasoning: extraction.reasoning,
            status: "PENDING",
          });
          ids.push(id);
        }

        return ids;
      },
    );

    // Step 6: Update inbound_event status to PROCESSED
    await step.run("mark-processed", async () => {
      await updateInboundEventStatus(inboundEventId, "PROCESSED");
    });

    // Step 7: Emit extraction/completed event if there are extractions
    if (extractionIds.length > 0) {
      await step.sendEvent("emit-extraction-completed", {
        name: "extraction/completed",
        data: {
          merchantId: inboundEvent.merchant_id,
          extractionIds,
          inboundEventId,
        },
      });
    }

    return {
      success: true,
      inboundEventId,
      merchantId: inboundEvent.merchant_id,
      extractionCount: extractionIds.length,
      extractionIds,
    };
  },
);
