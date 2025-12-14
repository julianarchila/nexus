import { inngest } from "@/lib/inngest";
import type { GongReceivedPayload } from "../events";
import type { NormalizedInboundEvent } from "./types";
import { resolveMerchant } from "../services/merchant-resolver";
import { createInboundEvent } from "../services/inbound-event.repo";

/**
 * Extracts the external party's email from Gong meeting parties
 */
function getExternalContactEmail(
  parties: GongReceivedPayload["parties"],
): string | null {
  const externalParty = parties.find((p) => p.affiliation === "External");
  return externalParty?.emailAddress ?? null;
}

/**
 * Inngest function: Handles Gong webhook events
 * Trigger: "ingest/gong.received"
 *
 * Steps:
 * 1. Extract external party email from parties
 * 2. Resolve merchant by email
 * 3. Create inbound_event record
 * 4. Emit "ingest/event.created"
 */
export const gongAdapter = inngest.createFunction(
  { id: "ingest-gong-adapter", name: "Gong Adapter" },
  { event: "ingest/gong.received" },
  async ({ event, step }) => {
    const { callId, title, transcript, parties, duration, recordedAt } =
      event.data;

    // Step 1: Extract external contact email
    const contactEmail = await step.run(
      "extract-external-contact",
      async () => {
        const email = getExternalContactEmail(parties);
        if (!email) {
          throw new Error("No external party found in meeting participants");
        }
        return email;
      },
    );

    // Step 2: Resolve merchant
    const merchant = await step.run("resolve-merchant", async () => {
      const resolved = await resolveMerchant({ email: contactEmail });
      if (!resolved) {
        throw new Error(`Merchant not found for email: ${contactEmail}`);
      }
      return resolved;
    });

    // Step 3: Create normalized inbound event
    const normalizedEvent: NormalizedInboundEvent = {
      sourceType: "MEETING",
      sourceId: callId,
      rawContent: transcript,
      metadata: {
        title,
        parties: parties.map((p: GongReceivedPayload["parties"][number]) => ({
          name: p.name,
          email: p.emailAddress,
          affiliation: p.affiliation,
          title: p.title,
        })),
        duration,
        recordedAt,
      },
      merchantHints: {
        email: contactEmail,
      },
    };

    // Step 4: Create inbound event record
    const inboundEventId = await step.run("create-inbound-event", async () => {
      return await createInboundEvent(normalizedEvent, merchant.id);
    });

    // Step 5: Emit event for processing
    await step.sendEvent("emit-event-created", {
      name: "ingest/event.created",
      data: {
        inboundEventId,
      },
    });

    return {
      success: true,
      merchantId: merchant.id,
      merchantName: merchant.name,
      inboundEventId,
    };
  },
);
