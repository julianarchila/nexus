import { inngest } from "@/lib/inngest";
import {
    type GmailWebhookData,
    type GmailNotificationData,
} from "@/core/services/gmail-extractor";

export const gmailEmailReceived = inngest.createFunction(
    { id: "gmail-email-received" },
    { event: "gmail/email.received" },
    async ({ event, step }) => {
        const webhookData = event.data as GmailWebhookData;
        console.log("[Gmail Event] Received webhook data:", webhookData);

        // Decode base64 data from Pub/Sub
        const decodedData = await step.run("decode-pubsub-message", async () => {
            const base64Data = webhookData.message.data;
            const decodedString = Buffer.from(base64Data, "base64").toString("utf-8");
            return JSON.parse(decodedString) as GmailNotificationData;
        });

        // Log historyId for now
        console.log("\n" + "=".repeat(60));
        console.log(`[Gmail Event] Notification received`);
        console.log(`[Gmail Event] Email Address: ${decodedData.emailAddress}`);
        console.log(`[Gmail Event] History ID: ${decodedData.historyId}`);
        console.log(`[Gmail Event] Message ID: ${webhookData.message.messageId}`);
        console.log(`[Gmail Event] Publish Time: ${webhookData.message.publishTime}`);
        console.log("=".repeat(60) + "\n");

        // TODO: Use Gmail API to fetch the actual email changes using historyId
        return {
            success: true,
            historyId: decodedData.historyId,
            emailAddress: decodedData.emailAddress,
            messageId: webhookData.message.messageId,
        };
    },
);
