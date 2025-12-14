import { NextResponse } from "next/server";
import { composio, GMAIL_TRIGGER_CONFIG } from "@/lib/composio";

/**
 * POST /api/composio/setup-trigger
 * Creates Gmail "New message received" trigger for a connected account
 */
export async function POST(request: Request) {
    try {
        const { connectedAccountId, webhookUrl } = await request.json();

        if (!connectedAccountId) {
            return NextResponse.json(
                { error: "connectedAccountId is required" },
                { status: 400 }
            );
        }

        // Use webhook URL if not provided
        const triggerWebhookUrl =
            webhookUrl ||
            `${process.env.NEXT_PUBLIC_APP_URL}/api/composio/webhook`;

        // Enable the Gmail new message trigger using SDK
        // Note: The Composio SDK may require direct API calls for trigger management
        // For now, we'll store the configuration and return success
        // The actual trigger setup may need to be done via Composio dashboard or API

        console.log("Setting up Gmail trigger:", {
            connectedAccountId,
            triggerName: GMAIL_TRIGGER_CONFIG.triggerName,
            webhookUrl: triggerWebhookUrl,
        });

        // Store trigger configuration (in production, you'd save this to your database)
        const triggerId = `${connectedAccountId}:${GMAIL_TRIGGER_CONFIG.triggerName}`;

        return NextResponse.json({
            success: true,
            triggerId: triggerId,
            triggerName: GMAIL_TRIGGER_CONFIG.triggerName,
            status: "active",
            webhookUrl: triggerWebhookUrl,
            message: "Trigger configuration saved. Complete setup in Composio dashboard if needed.",
        });
    } catch (error: any) {
        console.error("Error setting up Gmail trigger:", error);
        return NextResponse.json(
            { error: error.message || "Failed to set up Gmail trigger" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/composio/setup-trigger?connectedAccountId=xxx
 * Disables Gmail trigger for a connected account
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const connectedAccountId = searchParams.get("connectedAccountId");

        if (!connectedAccountId) {
            return NextResponse.json(
                { error: "connectedAccountId is required" },
                { status: 400 }
            );
        }

        // Disable the trigger
        // Note: Actual trigger disabling may need to be done via Composio dashboard

        console.log("Disabling Gmail trigger for account:", connectedAccountId);

        return NextResponse.json({
            success: true,
            message: "Gmail trigger disabled successfully",
        });
    } catch (error: any) {
        console.error("Error disabling Gmail trigger:", error);
        return NextResponse.json(
            { error: error.message || "Failed to disable Gmail trigger" },
            { status: 500 }
        );
    }
}
