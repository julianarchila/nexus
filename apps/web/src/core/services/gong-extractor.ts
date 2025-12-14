import { generateObject } from "ai";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { db } from "@/core/db/client";
import { eq } from "drizzle-orm";
import { merchantProfile, scopeInDoc } from "@/core/db/schema";
import { nanoid } from "nanoid";

// Legacy type for backward compatibility
interface MerchantIntegrations {
  psps: string[];
  countries: string[];
  paymentMethods: string[];
}

// Schema for the extracted data from the meeting summary
const extractedDataSchema = z.object({
  psps: z
    .array(z.string())
    .describe(
      "Payment Service Providers mentioned (e.g., stripe, adyen, mercadopago, paypal, payu, dlocal, checkout, worldpay). Use lowercase identifiers.",
    ),
  countries: z
    .array(z.string())
    .describe(
      "Countries mentioned in ISO 3166-1 alpha-2 format (e.g., BR, MX, CO, US, AR, CL, PE, DE, NL)",
    ),
  paymentMethods: z
    .array(z.string())
    .describe(
      "Payment methods mentioned (e.g., credit_card, debit_card, pix, boleto, oxxo, spei, ach, apple_pay, google_pay, sepa, ideal)",
    ),
  volumeMetrics: z
    .string()
    .nullable()
    .describe(
      "Transaction volume or revenue metrics mentioned (e.g., '$5M monthly', '100k transactions/month')",
    ),
  approvalRate: z
    .string()
    .nullable()
    .describe("Approval rate mentioned or discussed (e.g., '95%', '92-94%')"),
  dealClosedBy: z
    .string()
    .nullable()
    .describe(
      "Name of the sales representative who closed or is handling the deal",
    ),
  comesFromMof: z
    .boolean()
    .nullable()
    .describe(
      "Whether the merchant was referred from MOF (Merchant Onboarding Form) or similar program",
    ),
});

type ExtractedData = z.infer<typeof extractedDataSchema>;

const EXTRACTION_PROMPT = `You are an expert at extracting actionable information from sales meeting summaries for a payments orchestration platform (Yuno).

Your task is to analyze the meeting summary and extract structured information that will help update the merchant's scope document.

Context about Yuno:
- Yuno connects merchants to multiple PSPs (Payment Service Providers) like Stripe, Adyen, Mercado Pago, PayPal, PayU, dLocal, Checkout.com
- Yuno helps route, retry, and optimize payments across providers in different countries
- Key information includes: which PSPs the merchant needs, which countries they operate in, what payment methods they require

Extraction Guidelines:
1. PSPs: Look for mentions of payment processors/providers. Common ones: Stripe, Adyen, Mercado Pago, PayPal, PayU, dLocal, Checkout.com, Worldpay. Use lowercase identifiers (e.g., "stripe", "mercadopago").

2. Countries: Extract country codes in ISO 3166-1 alpha-2 format. Common LATAM: BR (Brazil), MX (Mexico), CO (Colombia), AR (Argentina), CL (Chile), PE (Peru). Convert full names to codes.

3. Payment Methods: Look for specific payment methods mentioned:
   - Cards: credit_card, debit_card
   - Brazil: pix, boleto
   - Mexico: oxxo, spei
   - Argentina: rapipago, pagofacil
   - US: ach, apple_pay, google_pay
   - Europe: sepa, ideal, giropay, sofort

4. Volume Metrics: Extract any mentions of transaction volume, GMV, or revenue. Format as a readable string.

5. Approval Rate: Extract any mentions of current or target approval rates.

6. Deal Closed By: Look for the Yuno sales representative name handling the account.

7. Comes from MOF: Check if there's any mention of MOF (Merchant Onboarding Form) or referral program.

Important:
- Only extract information that is EXPLICITLY mentioned in the summary
- Do not infer or assume information that isn't stated
- Return null for fields where no information was found
- Return empty arrays for list fields where no items were found`;

export interface GongParty {
  affiliation: "External" | "Internal";
  emailAddress: string;
  id: string;
  methods: string[];
  name: string;
  title?: string;
  userId?: string;
}

export interface GongEventData {
  meetingSummary: string;
  parties: GongParty[];
}

export interface ExtractionResult {
  success: boolean;
  merchantId?: string;
  merchantName?: string;
  extractedData?: ExtractedData;
  updatedFields?: string[];
  changes?: ChangeLog;
  error?: string;
}

// Detailed change tracking
export interface ChangeLog {
  integrations: {
    psps: { added: string[]; before: string[]; after: string[] };
    countries: { added: string[]; before: string[]; after: string[] };
    paymentMethods: { added: string[]; before: string[]; after: string[] };
  };
  volumeMetrics: { before: string | null; after: string | null };
  approvalRate: { before: string | null; after: string | null };
  dealClosedBy: { before: string | null; after: string | null };
  comesFromMof: { before: boolean | null; after: boolean | null };
  isNewDocument: boolean;
}

/**
 * Finds the external party's email from the Gong meeting parties
 */
function getExternalContactEmail(parties: GongParty[]): string | null {
  const externalParty = parties.find((p) => p.affiliation === "External");
  return externalParty?.emailAddress ?? null;
}

/**
 * Extracts actionable information from a meeting summary using LLM
 */
async function extractFromSummary(
  meetingSummary: string,
  currentScope: MerchantIntegrations | null,
): Promise<ExtractedData> {
  const contextPrompt = currentScope
    ? `\n\nCurrent merchant scope data for reference (to help identify new vs existing information):
- Current PSPs: ${currentScope.psps.join(", ") || "none"}
- Current Countries: ${currentScope.countries.join(", ") || "none"}  
- Current Payment Methods: ${currentScope.paymentMethods.join(", ") || "none"}`
    : "";

  const { object } = await generateObject({
    model: openrouter("openai/gpt-5-mini"),
    schema: extractedDataSchema,
    system: EXTRACTION_PROMPT + contextPrompt,
    prompt: `Please extract actionable information from the following meeting summary:\n\n${meetingSummary}`,
  });

  return object;
}

/**
 * Merges extracted integrations with existing ones (deduplicates)
 */
function mergeIntegrations(
  existing: MerchantIntegrations | null,
  extracted: ExtractedData,
): MerchantIntegrations {
  const current = existing ?? { psps: [], countries: [], paymentMethods: [] };

  return {
    psps: [...new Set([...current.psps, ...extracted.psps])],
    countries: [...new Set([...current.countries, ...extracted.countries])],
    paymentMethods: [
      ...new Set([...current.paymentMethods, ...extracted.paymentMethods]),
    ],
  };
}

/**
 * Calculates what items were added to an array
 */
function getAddedItems(before: string[], after: string[]): string[] {
  const beforeSet = new Set(before);
  return after.filter((item) => !beforeSet.has(item));
}

/**
 * Main function to process a Gong meeting and update the merchant's scope document
 */
export async function processGongMeeting(
  data: GongEventData,
): Promise<ExtractionResult> {
  const { meetingSummary, parties } = data;

  // 1. Find external contact email
  const contactEmail = getExternalContactEmail(parties);
  if (!contactEmail) {
    return {
      success: false,
      error: "No external party found in meeting participants",
    };
  }

  // 2. Find merchant by contact email
  const merchant = await db
    .select()
    .from(merchantProfile)
    .where(eq(merchantProfile.contact_email, contactEmail))
    .limit(1);

  if (merchant.length === 0) {
    console.warn(
      `[Gong Extractor] No merchant found for contact email: ${contactEmail}`,
    );
    return {
      success: false,
      error: `Merchant not found for email: ${contactEmail}`,
    };
  }

  const merchantRecord = merchant[0];

  // 3. Get current scope_in_doc for the merchant
  const existingScope = await db
    .select()
    .from(scopeInDoc)
    .where(eq(scopeInDoc.merchant_id, merchantRecord.id))
    .limit(1);

  const currentScope = existingScope[0];
  // Adapt new schema to legacy format
  const currentIntegrations: MerchantIntegrations | null = currentScope
    ? {
        psps: (currentScope.psps as string[]) ?? [],
        countries: (currentScope.countries as string[]) ?? [],
        paymentMethods: (currentScope.payment_methods as string[]) ?? [],
      }
    : null;
  const isNewDocument = !currentScope;

  // 4. Extract information from meeting summary
  const extractedData = await extractFromSummary(
    meetingSummary,
    currentIntegrations,
  );

  // 5. Merge integrations
  const mergedIntegrations = mergeIntegrations(
    currentIntegrations,
    extractedData,
  );

  // 6. Build change log for detailed tracking
  const beforeIntegrations = currentIntegrations ?? {
    psps: [],
    countries: [],
    paymentMethods: [],
  };

  const changes: ChangeLog = {
    integrations: {
      psps: {
        added: getAddedItems(beforeIntegrations.psps, mergedIntegrations.psps),
        before: beforeIntegrations.psps,
        after: mergedIntegrations.psps,
      },
      countries: {
        added: getAddedItems(
          beforeIntegrations.countries,
          mergedIntegrations.countries,
        ),
        before: beforeIntegrations.countries,
        after: mergedIntegrations.countries,
      },
      paymentMethods: {
        added: getAddedItems(
          beforeIntegrations.paymentMethods,
          mergedIntegrations.paymentMethods,
        ),
        before: beforeIntegrations.paymentMethods,
        after: mergedIntegrations.paymentMethods,
      },
    },
    volumeMetrics: {
      before: currentScope?.expected_volume ?? null,
      after: extractedData.volumeMetrics,
    },
    approvalRate: {
      before: currentScope?.expected_approval_rate ?? null,
      after: extractedData.approvalRate,
    },
    dealClosedBy: {
      before: currentScope?.deal_closed_by ?? null,
      after: extractedData.dealClosedBy,
    },
    comesFromMof: {
      before: currentScope?.comes_from_mor ?? null,
      after: extractedData.comesFromMof,
    },
    isNewDocument,
  };

  // 7. Build update object (only update fields that have new data)
  const updatedFields: string[] = [];
  const updateData: Partial<{
    psps: string[];
    countries: string[];
    payment_methods: string[];
    expected_volume: string;
    expected_approval_rate: string;
    deal_closed_by: string;
    comes_from_mor: boolean;
  }> = {};

  // Check if integrations changed
  if (
    JSON.stringify(mergedIntegrations) !== JSON.stringify(currentIntegrations)
  ) {
    updateData.psps = mergedIntegrations.psps;
    updateData.countries = mergedIntegrations.countries;
    updateData.payment_methods = mergedIntegrations.paymentMethods;
    updatedFields.push("psps", "countries", "payment_methods");
  }

  if (extractedData.volumeMetrics) {
    updateData.expected_volume = extractedData.volumeMetrics;
    updatedFields.push("expected_volume");
  }

  if (extractedData.approvalRate) {
    updateData.expected_approval_rate = extractedData.approvalRate;
    updatedFields.push("expected_approval_rate");
  }

  if (extractedData.dealClosedBy) {
    updateData.deal_closed_by = extractedData.dealClosedBy;
    updatedFields.push("deal_closed_by");
  }

  if (extractedData.comesFromMof !== null) {
    updateData.comes_from_mor = extractedData.comesFromMof;
    updatedFields.push("comes_from_mor");
  }

  // 8. Update or create scope_in_doc
  if (updatedFields.length > 0) {
    if (currentScope) {
      // Update existing record
      await db
        .update(scopeInDoc)
        .set(updateData)
        .where(eq(scopeInDoc.id, currentScope.id));
    } else {
      // Create new record
      await db.insert(scopeInDoc).values({
        id: nanoid(),
        merchant_id: merchantRecord.id,
        psps: updateData.psps ?? [],
        countries: updateData.countries ?? [],
        payment_methods: updateData.payment_methods ?? [],
        expected_volume: updateData.expected_volume ?? null,
        expected_approval_rate: updateData.expected_approval_rate ?? null,
        deal_closed_by: updateData.deal_closed_by ?? null,
        comes_from_mor: updateData.comes_from_mor ?? false,
      });
      updatedFields.push("(created new scope document)");
    }
  }

  return {
    success: true,
    merchantId: merchantRecord.id,
    merchantName: merchantRecord.name,
    extractedData,
    updatedFields,
    changes,
  };
}
