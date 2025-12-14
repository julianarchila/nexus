import { NextResponse } from "next/server";
import { composio } from "@/lib/composio";

/**
 * POST /api/composio/connect-gmail
 * Initiates Gmail connection via Composio
 * Returns redirect URL for user authentication
 */
export async function POST(request: Request) {
    try {
        const { userId, callbackUrl } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // Create connection request for Gmail
        const connectionRequest = await composio.connectedAccounts.initiate(
            userId,
            "ac_7Uv3yWF8jyom", // Your auth config ID from Composio dashboard
            {
                callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?connected=gmail`,
            }
        );

        return NextResponse.json({
            success: true,
            redirectUrl: connectionRequest.redirectUrl,
            requestId: connectionRequest.id,
        });
    } catch (error: any) {
        console.error("Error initiating Gmail connection:", error);

        // Check if this is an auth config error
        if (error.status === 400 && error.error?.code === 607) {
            return NextResponse.json(
                {
                    error: "Gmail integration not configured in Composio",
                    details: "Please configure the Gmail integration in your Composio dashboard with OAuth credentials. Visit https://app.composio.dev/integrations to set up Gmail.",
                    code: 607
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to initiate Gmail connection" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/composio/connect-gmail?userId=xxx
 * Check Gmail connection status and set up trigger if connected
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // Get all connected accounts for this user
        const accounts = await composio.connectedAccounts.list({
            userIds: [userId],
        });

        const gmailAccount = accounts.items.find(
            (account: any) => account.toolkit?.slug === "gmail" && account.status === "ACTIVE"
        );

        if (!gmailAccount) {
            return NextResponse.json({
                connected: false,
                hasReminders: false,
            });
        }

        // For now, we'll assume no triggers until we properly set them up
        // The triggers API in Composio SDK v0.2.6 may have different structure
        return NextResponse.json({
            connected: true,
            hasReminders: false, // Will be updated when trigger is created
            accountId: gmailAccount.id,
            accountEmail: (gmailAccount as any).integrationAccountId || "Connected",
        });
    } catch (error: any) {
        console.error("Error checking Gmail connection:", error);
        return NextResponse.json(
            { error: error.message || "Failed to check Gmail connection" },
            { status: 500 }
        );
    }
}
