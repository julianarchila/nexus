import { streamText } from "ai";
import { openrouter } from "@/lib/openrouter";
import { aiTools } from "@/lib/ai/tools";

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const result = streamText({
            model: openrouter("gpt-5-mini"),
            messages,
            tools: aiTools,
            system: `You are an AI assistant for the Yuno Payment Platform management system. You have access to comprehensive data about:
    - Merchants and their lifecycle stages (Scoping, Implementing, Live)
    - Implementation readiness and scope documents
    - Payment processors (PSPs) and their capabilities
    - Country-specific processor features
    - Payment method implementations
    - Inbound events from meetings, emails, and other sources
    - AI extractions and insights
    - Audit logs showing all system activity
    - Stage transitions and merchant progress

    Your role is to:
    1. Help users understand their merchant portfolio and implementation status
    2. Answer questions about payment processor capabilities and coverage
    3. Provide insights into merchant readiness and blockers
    4. Explain historical changes through the audit log
    5. Surface relevant data based on user queries

    When answering:
    - Be concise but informative
    - Use specific data from the tools
    - Highlight important metrics and statuses
    - Suggest next steps when appropriate
    - Format data in a readable way (lists, summaries)

    Current date: ${new Date().toLocaleDateString()}`,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("AI chat error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to process chat request" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
