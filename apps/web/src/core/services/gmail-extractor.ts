/**
 * Gmail Webhook Data Structures
 * These interfaces are used to parse the incoming webhook from Google Cloud Pub/Sub
 */

export interface GmailWebhookData {
    message: {
        data: string; // base64 encoded
        messageId: string;
        message_id: string;
        publishTime: string;
        publish_time: string;
    };
    subscription: string;
}

export interface GmailNotificationData {
    emailAddress: string;
    historyId: number;
}
