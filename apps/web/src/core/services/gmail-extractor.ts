import type { gmail_v1 } from "googleapis";

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

/**
 * Gmail API Response Types
 */
export type GmailHistory = gmail_v1.Schema$History;
export type GmailMessage = gmail_v1.Schema$Message;
export type GmailMessageHeader = gmail_v1.Schema$MessagePartHeader;

/**
 * Normalized email data for Layer 2
 */
export interface NormalizedEmailData {
    source: "gmail";
    raw_data: GmailMessage;
    metadata: {
        subject: string | null;
        from: string | null;
        to: string | null;
        date: string | null;
        historyId: number;
        messageId: string;
    };
}
