import { Composio } from "@composio/core";

if (!process.env.COMPOSIO_API_KEY) {
    throw new Error("COMPOSIO_API_KEY environment variable is required");
}

/**
 * Composio SDK client for managing integrations and triggers
 * Used for Gmail integration and webhook management
 */
export const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
});

/**
 * Gmail trigger configuration
 * Trigger: GMAIL_NEW_GMAIL_MESSAGE
 */
export const GMAIL_TRIGGER_CONFIG = {
    app: "gmail",
    triggerName: "GMAIL_NEW_GMAIL_MESSAGE",
};
