import { inngest } from "@/lib/inngest";
import type { GmailReceivedPayload } from "../events";
import type { NormalizedInboundEvent } from "./types";
import { resolveMerchant } from "../services/merchant-resolver";
import { createInboundEvent } from "../services/inbound-event.repo";

/**
 * Extracts the sender's email from Gmail metadata
 */
function getSenderEmail(from: string | null): string | null {
    if (!from) return null;

    // Extract email from format: "Name <email@example.com>" or just "email@example.com"
    const emailMatch = from.match(/<(.+?)>/) || from.match(/^(.+?)$/);
    return emailMatch ? emailMatch[1].trim() : null;
}

/**
 * Extracts text content from Gmail message body
 */
function extractEmailBody(raw_data: any): string {
    const parts = raw_data.payload?.parts || [];

    // Try to find plain text part first
    const textPart = parts.find((part: any) => part.mimeType === "text/plain");
    if (textPart?.body?.data) {
        return Buffer.from(textPart.body.data, "base64").toString("utf-8");
    }

    // Fallback to HTML if no plain text
    const htmlPart = parts.find((part: any) => part.mimeType === "text/html");
    if (htmlPart?.body?.data) {
        return Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
    }

    // If no parts, check body directly
    if (raw_data.payload?.body?.data) {
        return Buffer.from(raw_data.payload.body.data, "base64").toString("utf-8");
    }

    return raw_data.snippet || "";
}

/**
 * Inngest function: Handles Gmail webhook events
 * Trigger: "ingest/gmail.received"
 *
 * Steps:
 * 1. Extract sender email from metadata
 * 2. Resolve merchant by email
 * 3. Extract email body content
 * 4. Create inbound_event record
 * 5. Emit "ingest/event.created"
 */
export const gmailAdapter = inngest.createFunction(
    { id: "ingest-gmail-adapter", name: "Gmail Adapter" },
    { event: "ingest/gmail.received" },
    async ({ event, step }) => {
        const { messageId, subject, from, to, date, raw_data } = event.data;

        // Step 1: Extract sender email
        const senderEmail = await step.run("extract-sender-email", async () => {
            const email = getSenderEmail(from);
            if (!email) {
                throw new Error("Could not extract sender email from 'From' header");
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

        // Step 3: Extract email content
        const emailContent = await step.run("extract-email-content", async () => {
            return extractEmailBody(raw_data);
        });

        // Step 4: Create normalized inbound event
        const normalizedEvent: NormalizedInboundEvent = {
            sourceType: "EMAIL",
            sourceId: messageId,
            rawContent: emailContent,
            metadata: {
                subject,
                from,
                to,
                date,
                messageId,
            },
            merchantHints: {
                email: senderEmail,
            },
        };

        // Step 5: Create inbound event record
        const inboundEventId = await step.run("create-inbound-event", async () => {
            return await createInboundEvent(normalizedEvent, merchant.id);
        });

        // Step 6: Emit event for processing
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
