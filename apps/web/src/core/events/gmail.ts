import { google } from "googleapis";
import { inngest } from "@/lib/inngest";
import type { GmailWebhookData, GmailNotificationData } from "@/core/services/gmail-extractor";

/**
 * Gmail Integration Flow:
 * 
 * 1. Gmail webhook (this file) -> "gmail/email.received"
 *    - Receives Pub/Sub notification
 *    - Fetches full email from Gmail API
 *    - Emits "ingest/gmail.received"
 * 
 * 2. Gmail Adapter (ingestion/adapters/gmail.adapter.ts) -> "ingest/gmail.received"
 *    - Extracts sender email
 *    - Resolves merchant
 *    - Creates inbound_event record
 *    - Emits "ingest/event.created"
 * 
 * 3. Process Event (ingestion/pipeline/process-event.ts) -> "ingest/event.created"
 *    - Loads scope context
 *    - AI extraction (batch mode)
 *    - Saves ai_extraction records
 *    - Emits "extraction/completed"
 * 
 * 4. Apply Extraction (ingestion/application/apply-extraction.ts) -> "extraction/completed"
 *    - Auto-applies HIGH confidence extractions
 *    - Creates audit logs
 *    - Updates scope_in_doc
 */

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
);

/**
 * Helper to extract header value from Gmail message
 */
function getHeader(message: any, headerName: string): string | null {
    const header = message.payload?.headers?.find(
        (h: any) => h.name?.toLowerCase() === headerName.toLowerCase(),
    );
    return header?.value || null;
}

export const gmailEmailReceived = inngest.createFunction(
    { id: "gmail-email-received" },
    { event: "gmail/email.received" },
    async ({ event, step }) => {
        const webhookData = event.data as GmailWebhookData;

        // Configure OAuth2 credentials once at the start
        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        });

        // Create Gmail client with configured auth
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // 1. Decode base64 data from Pub/Sub
        const decodedData = await step.run("decode-pubsub-message", async () => {
            const base64Data = webhookData.message.data;
            const decodedString = Buffer.from(base64Data, "base64").toString("utf-8");
            return JSON.parse(decodedString) as GmailNotificationData;
        });

        console.log("\n" + "=".repeat(60));
        console.log(`[Gmail Event] Notification received`);
        console.log(`[Gmail Event] Email Address: ${decodedData.emailAddress}`);
        console.log(`[Gmail Event] History ID: ${decodedData.historyId}`);
        console.log("=".repeat(60) + "\n");

        // 2. Fetch latest message (the historyId in webhook is AFTER the change, not before)
        // So we can't use it directly with history.list. Instead, fetch recent messages.
        const latestMessage = await step.run("fetch-latest-message", async () => {
            // Get messages from the last 5 minutes to catch the new one
            const fiveMinutesAgo = Math.floor((Date.now() - 5 * 60 * 1000) / 1000);

            const res = await gmail.users.messages.list({
                userId: "me",
                maxResults: 5, // Get a few recent messages
                q: `after:${fiveMinutesAgo}`, // Messages from last 5 minutes
            });

            // Return the most recent message
            return res.data.messages?.[0] || null;
        });

        // 3. Extract the new message ID
        const newMessage = latestMessage;

        if (!newMessage?.id) {
            console.log("[Gmail Event] No new messages found in history or fallback");
            return { status: "no_new_messages_found" };
        }

        console.log(`[Gmail Event] New message detected: ${newMessage.id}`);

        // 4. Fetch full email details
        const emailFullDetails = await step.run("get-email-details", async () => {
            const res = await gmail.users.messages.get({
                userId: "me",
                id: newMessage.id!,
                format: "full", // Full format includes headers, body, and attachments
            });
            return res.data;
        });

        // 5. Extract metadata
        const subject = getHeader(emailFullDetails, "Subject");
        const from = getHeader(emailFullDetails, "From");
        const to = getHeader(emailFullDetails, "To");
        const date = getHeader(emailFullDetails, "Date");

        console.log("\n" + "=".repeat(60));
        console.log(`[Gmail Event] Email Details:`);
        console.log(`  Subject: ${subject}`);
        console.log(`  From: ${from}`);
        console.log(`  To: ${to}`);
        console.log("=".repeat(60) + "\n");

        // 6. Send to Layer 1 (Gmail Adapter)
        await step.sendEvent("send-to-adapter", {
            name: "ingest/gmail.received",
            data: {
                messageId: newMessage.id!,
                subject,
                from,
                to,
                date,
                raw_data: emailFullDetails,
            },
        });

        return {
            success: true,
            messageId: newMessage.id,
            subject,
        };
    },
);
