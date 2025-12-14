import { inngest } from "@/lib/inngest";
import type { NormalizedInboundEvent } from "./types";
import { resolveMerchant } from "@/core/services/merchant-resolver.service";
import { createInboundEvent } from "@/core/repositories/inbound-event.repo";

/**
 * Extracts the sender's email from Composio Gmail payload
 */
function getSenderEmail(sender: string | null): string | null {
    if (!sender) return null;

    // Extract email from format: "Name <email@example.com>" or just "email@example.com"
    const emailMatch = sender.match(/<(.+?)>/) || sender.match(/^(.+?)$/);
    return emailMatch ? emailMatch[1].trim() : null;
}

/**
 * Inngest function: Handles Gmail webhook events from Composio
 * Trigger: "ingest/gmail-composio.received"
 *
 * Steps:
 * 1. Extract sender email from metadata
 * 2. Resolve merchant by email
 * 3. Create inbound_event record
 * 4. Emit "ingest/event.created"
 */
export const gmailComposioAdapter = inngest.createFunction(
    { id: "ingest-gmail-composio-adapter", name: "Gmail Composio Adapter" },
    { event: "ingest/gmail-composio.received" },
    async ({ event, step }) => {
        // Composio wraps the actual data in event.data.data
        const {
            message_id,
            subject,
            sender,
            to,
            message_text,
            message_timestamp,
            thread_id,
            payload,
            attachment_list,
        } = event.data.data;


        // Step 1: Extract sender email
        const senderEmail = await step.run("extract-sender-email", async () => {
            const email = getSenderEmail(sender);
            if (!email) {
                throw new Error("Could not extract sender email from 'sender' field");
            }
            return email;
        });

        // Step 2: Resolve merchant
        const merchant = await step.run("resolve-merchant", async () => {
            const resolved = await resolveMerchant({ email: senderEmail });
            if (!resolved) {
                throw new Error(`Merchant not found for email: ${senderEmail}`);
            }
            return resolved;
        });

        // Step 3: Create normalized inbound event
        const normalizedEvent: NormalizedInboundEvent = {
            sourceType: "EMAIL",
            sourceId: message_id || thread_id || `composio-${Date.now()}`,
            rawContent: message_text || "",
            metadata: {
                subject,
                from: sender,
                to,
                date: message_timestamp,
                messageId: message_id,
                threadId: thread_id,
                attachments: attachment_list,
                payload,
            },
            merchantHints: {
                email: senderEmail,
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
            subject,
        };
    },
);
