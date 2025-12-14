import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";

/**
 * POST /api/composio/webhook
 * Receives Gmail trigger webhooks from Composio
 * Forwards to Inngest for processing via gmailComposioAdapter
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();

        console.log("📧 Received Composio Gmail webhook:", {
            trigger: payload.trigger_name,
            appName: payload.app_name,
            connectionId: payload.connected_account_id,
        });

        // Forward to Inngest for processing
        await inngest.send({
            name: "ingest/gmail-composio.received",
            data: payload,
        });

        return NextResponse.json({
            success: true,
            message: "Webhook received and forwarded to Inngest",
        });
    } catch (error: any) {
        console.error("Error processing Composio webhook:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process webhook" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/composio/webhook
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "composio-webhook-handler",
        timestamp: new Date().toISOString(),
    });
}
