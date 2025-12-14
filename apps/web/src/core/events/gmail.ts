import { google } from "googleapis";
import { inngest } from "@/lib/inngest";
import {
    type GmailWebhookData,
    type GmailNotificationData,
    type NormalizedEmailData,
} from "@/core/services/gmail-extractor";

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

        // 2. Fetch Gmail history to get new messages
        const history = await step.run("fetch-gmail-history", async () => {
            // Set credentials with refresh token
            oauth2Client.setCredentials({
                refresh_token: process.env.GMAIL_REFRESH_TOKEN,
            });

            const gmail = google.gmail({ version: "v1", auth: oauth2Client });

            try {
                const res = await gmail.users.history.list({
                    userId: "me",
                    startHistoryId: decodedData.historyId.toString(),
                    historyTypes: ["messageAdded"], // Only new emails
                });

                return res.data;
            } catch (error: any) {
                // If historyId is too old (404/410), fallback to latest messages
                if (error.code === 404 || error.code === 410) {
                    console.warn(
                        `[Gmail Event] HistoryId too old, fetching latest messages as fallback`,
                    );
                    const res = await gmail.users.messages.list({
                        userId: "me",
                        maxResults: 1,
                    });
                    return { history: [{ messagesAdded: res.data.messages?.map(m => ({ message: m })) }] };
                }
                throw error;
            }
        });

        // 3. Extract the new message ID
        const newMessage = history.history?.[0]?.messagesAdded?.[0]?.message;

        if (!newMessage?.id) {
            console.log("[Gmail Event] No new messages found in history");
            return { status: "no_new_messages_found" };
        }

        console.log(`[Gmail Event] New message detected: ${newMessage.id}`);

        // 4. Fetch full email details
        const emailFullDetails = await step.run("get-email-details", async () => {
            const gmail = google.gmail({ version: "v1", auth: oauth2Client });
            const res = await gmail.users.messages.get({
                userId: "me",
                id: newMessage.id!,
                format: "full", // Full format includes headers, body, and attachments
            });
            return res.data;
        });

        // 5. Normalize and send to Layer 2
        const normalizedData: NormalizedEmailData = {
            source: "gmail",
            raw_data: emailFullDetails,
            metadata: {
                subject: getHeader(emailFullDetails, "Subject"),
                from: getHeader(emailFullDetails, "From"),
                to: getHeader(emailFullDetails, "To"),
                date: getHeader(emailFullDetails, "Date"),
                historyId: decodedData.historyId,
                messageId: newMessage.id!,
            },
        };

        console.log("\n" + "=".repeat(60));
        console.log(`[Gmail Event] Email Details:`);
        console.log(`  Subject: ${normalizedData.metadata.subject}`);
        console.log(`  From: ${normalizedData.metadata.from}`);
        console.log(`  To: ${normalizedData.metadata.to}`);
        console.log("=".repeat(60) + "\n");

        // Send to Layer 2 (AI Extraction)
        await step.sendEvent("ingest-event-created", {
            name: "ingest/event.created",
            data: normalizedData,
        });

        return {
            success: true,
            messageId: newMessage.id,
            subject: normalizedData.metadata.subject,
        };
    },
);
