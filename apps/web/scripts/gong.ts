import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { merchantProfile, scopeInDoc } from "../src/core/db/schema";
import { inngest } from "../src/lib/inngest";

// Type definition for Gong webhook payload
interface GongReceivedPayload {
  callId: string;
  title: string;
  transcript: string;
  parties: Array<{
    affiliation: "External" | "Internal";
    emailAddress: string;
    name: string;
    title?: string;
  }>;
  duration: number;
  recordedAt: string;
}

const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
    ssl: true,
  },
});

// Test merchant contact email (must match seed.ts)
const TEST_MERCHANT_EMAIL = "jarchilac@unal.edu.co";

// Gong webhook party structure
const parties = [
  {
    id: "7409609343412403343",
    emailAddress: TEST_MERCHANT_EMAIL,
    name: "Pepito Perez",
    title: "VP of Payments",
    affiliation: "External",
    methods: ["Invitee", "Attendee"],
  },
  {
    id: "9048546196233268852",
    emailAddress: "juan.perez@yuno.com",
    name: "Juan Pérez",
    title: "Sales Director",
    userId: "3022101605611220443",
    affiliation: "Internal",
    methods: ["Attendee"],
  },
];

// ============================================================================
// EVENT 1: Discovery Call - Initial conversation about needs
// Expected extractions: Brazil, Mexico, credit cards, current approval rate
// ============================================================================
const event1_discovery = {
  metaData: {
    id: "1111111111111111111",
    url: "https://app.gong.io/call?id=1111111111111111111",
    title: "Discovery Call - Yuno & Acme Corp",
    scheduled: "2025-01-10T10:00:00-05:00",
    started: "2025-01-10T10:02:00-05:00",
    duration: 2400,
    primaryUserId: "7744111777663220493",
    direction: "Conference",
    system: "Zoom",
    scope: "External",
    media: "Video",
    language: "eng",
  },
  parties,
  meetingSummary: `Discovery call between Yuno and Acme Corp. Pepito Perez(VP of Payments) explained that Acme Corp is an e-commerce platform operating primarily in Brazil and Mexico. They currently process around $8 million in monthly transactions using credit cards as their main payment method.

María mentioned they're experiencing approval rates around 85% which they feel is too low compared to industry standards. She expressed interest in understanding how Yuno could help improve their payment success rates.

Juan Pérez from Yuno explained the orchestration platform and how smart routing could potentially improve approval rates. He mentioned that typically merchants see improvements to 92-95% after optimization.

The call ended with María requesting a follow-up technical call to discuss integration requirements. No specific PSPs were discussed yet.`,
};

// ============================================================================
// EVENT 2: Technical Deep Dive - Integration requirements
// Expected extractions: Stripe, Mercado Pago, PIX, Boleto, OXXO, SPEI
// ============================================================================
const event2_technical = {
  metaData: {
    id: "2222222222222222222",
    url: "https://app.gong.io/call?id=2222222222222222222",
    title: "Technical Deep Dive - Yuno & Acme Corp",
    scheduled: "2025-01-15T14:00:00-05:00",
    started: "2025-01-15T14:05:00-05:00",
    duration: 3600,
    primaryUserId: "7744111777663220493",
    direction: "Conference",
    system: "Zoom",
    scope: "External",
    media: "Video",
    language: "eng",
  },
  parties,
  meetingSummary: `Technical deep dive call with Acme Corp's payment team. María García was joined by their technical lead to discuss specific integration requirements.

Key technical requirements discussed:
- In Brazil, they need support for PIX instant payments and Boleto bancário in addition to credit cards. María emphasized that PIX has become their fastest growing payment method.
- In Mexico, they require OXXO cash payments and SPEI bank transfers alongside credit cards.

Regarding PSPs, Acme Corp currently uses Stripe as their primary processor but is looking to add Mercado Pago as a backup, especially for local payment methods in Brazil. They mentioned Stripe works well for cards but doesn't cover all their local payment needs.

Juan confirmed that Yuno supports both Stripe and Mercado Pago integrations with smart routing capabilities. He explained how they could route PIX transactions through Mercado Pago while keeping card transactions with Stripe.

The team also discussed volume expectations - María confirmed they expect to grow to approximately $12 million monthly by end of year.

Next steps: Proposal and pricing discussion scheduled for next week.`,
};

// ============================================================================
// EVENT 3: Commercial Negotiation - Pricing and expansion
// Expected extractions: Colombia, Argentina, dLocal, PayU, volume update
// ============================================================================
const event3_negotiation = {
  metaData: {
    id: "3333333333333333333",
    url: "https://app.gong.io/call?id=3333333333333333333",
    title: "Commercial Discussion - Yuno & Acme Corp",
    scheduled: "2025-01-22T11:00:00-05:00",
    started: "2025-01-22T11:03:00-05:00",
    duration: 2700,
    primaryUserId: "7744111777663220493",
    direction: "Conference",
    system: "Zoom",
    scope: "External",
    media: "Video",
    language: "eng",
  },
  parties,
  meetingSummary: `Commercial negotiation call with Acme Corp. María García discussed expansion plans and pricing.

Key updates from Acme Corp:
- They're planning to expand to Colombia and Argentina in Q2 2025
- For Colombia, they're interested in using dLocal as the processor due to good local coverage
- For Argentina, they want to explore PayU as an option for the local market
- Updated volume projection: expecting $15 million monthly across all markets by Q3

María mentioned that improving approval rates is critical - they're targeting 95% as their goal. She also noted that the deal needs to be finalized by their CFO, Roberto Méndez, but she has budget approval.

Juan discussed tiered pricing based on transaction volume and confirmed Yuno's support for all mentioned PSPs and countries. He mentioned that Sofia Hernandez from Yuno would be their dedicated account manager.

The conversation also touched on PSE (Colombia's local bank transfer method) and Rapipago/Pagofacil for Argentina.

Next steps: Final contract review with legal team.`,
};

// ============================================================================
// EVENT 4: Deal Closing - Final confirmation
// Expected extractions: deal_closed_by, final approval rate target, debit cards
// ============================================================================
const event4_closing = {
  metaData: {
    id: "4444444444444444444",
    url: "https://app.gong.io/call?id=4444444444444444444",
    title: "Contract Signing - Yuno & Acme Corp",
    scheduled: "2025-01-29T16:00:00-05:00",
    started: "2025-01-29T16:00:00-05:00",
    duration: 1800,
    primaryUserId: "7744111777663220493",
    direction: "Conference",
    system: "Zoom",
    scope: "External",
    media: "Video",
    language: "eng",
  },
  parties,
  meetingSummary: `Final call to close the deal with Acme Corp. María García confirmed all requirements have been approved by their CFO.

Deal summary confirmed:
- Markets: Brazil, Mexico, Colombia, and Argentina
- PSPs: Stripe, Mercado Pago, dLocal, and PayU
- Payment methods: Credit cards, debit cards, PIX, Boleto, OXXO, SPEI, PSE, Rapipago, Pagofacil
- Volume: $15-20 million monthly projected
- Target approval rate: 96%

Juan Pérez confirmed Sofia Hernandez will be the account manager handling the onboarding process. The deal was officially closed by Juan Pérez.

Implementation timeline:
- Week 1-2: API integration for Brazil and Mexico
- Week 3-4: Colombia and Argentina setup
- Week 5: Testing and go-live

Both parties expressed excitement about the partnership. María mentioned Acme Corp did not come through the MOF program but was referred by another Yuno merchant.`,
};

// All events mapped by number
const events: Record<string, { name: string; data: typeof event1_discovery }> =
  {
    "1": { name: "Discovery Call", data: event1_discovery },
    "2": { name: "Technical Deep Dive", data: event2_technical },
    "3": { name: "Commercial Negotiation", data: event3_negotiation },
    "4": { name: "Deal Closing", data: event4_closing },
  };

// ============================================================================
// Helper Functions
// ============================================================================

async function showCurrentScope() {
  const merchant = await db
    .select()
    .from(merchantProfile)
    .where(eq(merchantProfile.contact_email, TEST_MERCHANT_EMAIL))
    .limit(1);

  if (merchant.length === 0) {
    console.log("\n❌ Test merchant not found. Run seed.ts first.");
    return null;
  }

  const scope = await db
    .select()
    .from(scopeInDoc)
    .where(eq(scopeInDoc.merchant_id, merchant[0].id))
    .limit(1);

  console.log("\n📊 Current Scope for Acme Corp:");
  console.log("================================");

  if (scope.length === 0) {
    console.log("  (no scope document yet - will be created on first event)");
  } else {
    const s = scope[0];
    console.log(`  PSPs: ${(s.psps as string[])?.join(", ") || "(none)"}`);
    console.log(
      `  Countries: ${(s.countries as string[])?.join(", ") || "(none)"}`,
    );
    console.log(
      `  Payment Methods: ${(s.payment_methods as string[])?.join(", ") || "(none)"}`,
    );
    console.log(`  Volume: ${s.expected_volume || "(not set)"}`);
    console.log(`  Approval Rate: ${s.expected_approval_rate || "(not set)"}`);
    console.log(`  Deal Closed By: ${s.deal_closed_by || "(not set)"}`);
    console.log(`  From MOR: ${s.comes_from_mor}`);
  }

  return merchant[0];
}

async function sendWebhook(eventData: typeof event1_discovery) {
  console.log(`\n📤 Sending event to Inngest...`);

  // Transform old format to new GongReceivedPayload format
  const payload: GongReceivedPayload = {
    callId: eventData.metaData.id,
    title: eventData.metaData.title,
    transcript: eventData.meetingSummary,
    parties: eventData.parties.map((p) => ({
      affiliation: p.affiliation as "External" | "Internal",
      emailAddress: p.emailAddress,
      name: p.name,
      title: p.title,
    })),
    duration: eventData.metaData.duration,
    recordedAt: eventData.metaData.started,
  };

  try {
    await inngest.send({
      name: "ingest/gong.received",
      data: payload,
    });

    console.log(`\n✅ Event sent successfully to Inngest`);
    console.log(`   Call ID: ${payload.callId}`);
    console.log(`   Title: ${payload.title}`);
    return true;
  } catch (error) {
    console.error(`\n❌ Error sending event to Inngest:`, error);
    return false;
  }
}

function showUsage() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              Gong Webhook Mock Tool (mong.ts)                  ║
╠════════════════════════════════════════════════════════════════╣
║  Simulates a series of sales calls that progressively build    ║
║  the scope document for the test merchant (Acme Corp).         ║
╠════════════════════════════════════════════════════════════════╣
║  Usage: bun run scripts/mong.ts <command>                      ║
╠════════════════════════════════════════════════════════════════╣
║  Commands:                                                     ║
║    status    - Show current scope document                     ║
║    1         - Send Event 1: Discovery Call                    ║
║    2         - Send Event 2: Technical Deep Dive               ║
║    3         - Send Event 3: Commercial Negotiation            ║
║    4         - Send Event 4: Deal Closing                      ║
║    all       - Send all events in sequence                     ║
║    summary   - Show all event summaries                        ║
╠════════════════════════════════════════════════════════════════╣
║  Recommended flow:                                             ║
║    1. Run seed.ts to reset the database                        ║
║    2. Run 'mong.ts status' to verify empty scope               ║
║    3. Run events 1-4 one at a time, checking status between    ║
╚════════════════════════════════════════════════════════════════╝
`);
}

function showSummaries() {
  console.log("\n📝 Event Summaries:");
  console.log("===================\n");

  for (const [num, event] of Object.entries(events)) {
    console.log(`Event ${num}: ${event.name}`);
    console.log("-".repeat(50));
    console.log(event.data.meetingSummary);
    console.log("\n");
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const command = process.argv[2];

  if (!command) {
    showUsage();
    process.exit(0);
  }

  switch (command.toLowerCase()) {
    case "status":
      await showCurrentScope();
      break;

    case "summary":
    case "summaries":
      showSummaries();
      break;

    case "all":
      console.log("🚀 Running all events in sequence...\n");
      for (const [num, event] of Object.entries(events)) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`EVENT ${num}: ${event.name}`);
        console.log("=".repeat(60));

        await showCurrentScope();
        await sendWebhook(event.data);

        console.log("\n⏳ Waiting 5 seconds for processing...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      console.log("\n\n🎉 All events sent! Final status:");
      await showCurrentScope();
      break;

    case "1":
    case "2":
    case "3":
    case "4": {
      const event = events[command];
      if (event) {
        console.log(`\n🎯 Event ${command}: ${event.name}`);
        console.log("=".repeat(50));
        console.log("\nMeeting Summary (what will be analyzed):");
        console.log("-".repeat(50));
        console.log(event.data.meetingSummary);
        console.log("-".repeat(50));

        await showCurrentScope();
        await sendWebhook(event.data);

        console.log(
          "\n💡 Run 'bun run scripts/mong.ts status' to check updated scope",
        );
      }
      break;
    }

    default:
      console.log(`❌ Unknown command: ${command}`);
      showUsage();
      process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
