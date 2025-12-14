import { generateObject } from "ai";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import type { ConfidenceLevel, SourceType } from "@/core/db/schema";

// Schema for a single field extraction
const extractionResultSchema = z.object({
  targetField: z.string().describe("The field name from scope_in_doc"),
  extractedValue: z
    .union([z.string(), z.array(z.string()), z.boolean(), z.null()])
    .describe("The extracted value"),
  confidence: z
    .enum(["HIGH", "MEDIUM", "LOW"])
    .describe("Confidence level of the extraction"),
  reasoning: z
    .string()
    .describe("Explanation for why this value was extracted"),
});

// Full extraction schema
const fullExtractionSchema = z.object({
  extractions: z
    .array(extractionResultSchema)
    .describe("List of all field extractions"),
});

export interface ExtractionResult {
  targetField: string;
  extractedValue: unknown;
  confidence: ConfidenceLevel;
  reasoning: string;
}

export interface CurrentScope {
  psps?: string[];
  countries?: string[];
  payment_methods?: string[];
  expected_volume?: string | null;
  expected_approval_rate?: string | null;
  restrictions?: string[];
  dependencies?: string[];
  compliance_requirements?: string[];
  expected_go_live_date?: Date | string | null; // Can be Date from DB or string from input
  comes_from_mor?: boolean;
  deal_closed_by?: string | null;
}

const EXTRACTION_PROMPT = `You are an expert at extracting actionable information from sales and implementation meetings for Yuno, a payments orchestration platform.

Yuno helps merchants connect to multiple PSPs (Payment Service Providers) and manage payments across different countries and payment methods.

Your task is to analyze the provided content and extract structured information for the merchant's scope document.

## Fields to Extract

### Integration Arrays (arrays of strings):
- **psps**: Payment Service Providers (e.g., "stripe", "adyen", "mercadopago", "paypal", "payu", "dlocal", "checkout", "worldpay")
- **countries**: Country codes in ISO 3166-1 alpha-2 format (e.g., "BR", "MX", "CO", "US", "AR", "CL", "PE")
- **payment_methods**: Payment methods (e.g., "credit_card", "debit_card", "pix", "boleto", "oxxo", "spei", "ach", "apple_pay", "google_pay")

### Metrics (strings):
- **expected_volume**: Transaction volume or revenue (e.g., "$5M monthly", "100k transactions/month")
- **expected_approval_rate**: Approval rate mentioned (e.g., "95%", "92-94%")

### Requirements Arrays (arrays of strings):
- **restrictions**: Any limitations or restrictions mentioned
- **dependencies**: Dependencies on other systems or integrations
- **compliance_requirements**: Regulatory or compliance requirements (e.g., "PCI DSS", "GDPR", "PSD2")

### Other Fields:
- **expected_go_live_date**: Expected go-live date (ISO 8601 date string)
- **comes_from_mor**: Boolean - whether merchant comes from Merchant of Record
- **deal_closed_by**: Name of the sales representative

## Confidence Levels

- **HIGH**: Information is explicitly stated and clear
- **MEDIUM**: Information is implied or requires some interpretation
- **LOW**: Information is uncertain or speculative

## Instructions

1. Extract ONLY information that is explicitly mentioned or strongly implied in the content
2. Do NOT infer or assume information that isn't stated
3. For each extraction, provide clear reasoning
4. Use lowercase identifiers for PSPs and payment methods
5. Convert country names to ISO 3166-1 alpha-2 codes
6. Only include fields where you found relevant information
`;

/**
 * Builds context about current scope for the AI
 */
function buildScopeContext(currentScope: CurrentScope | null): string {
  if (!currentScope) {
    return "\n\nThis is a new merchant with no existing scope data.";
  }

  const parts: string[] = [
    "\n\nCurrent merchant scope (for context - helps identify new vs existing information):",
  ];

  if (currentScope.psps && currentScope.psps.length > 0) {
    parts.push(`- PSPs: ${currentScope.psps.join(", ")}`);
  }

  if (currentScope.countries && currentScope.countries.length > 0) {
    parts.push(`- Countries: ${currentScope.countries.join(", ")}`);
  }

  if (currentScope.payment_methods && currentScope.payment_methods.length > 0) {
    parts.push(`- Payment Methods: ${currentScope.payment_methods.join(", ")}`);
  }

  if (currentScope.expected_volume) {
    parts.push(`- Expected Volume: ${currentScope.expected_volume}`);
  }

  if (currentScope.expected_approval_rate) {
    parts.push(
      `- Expected Approval Rate: ${currentScope.expected_approval_rate}`,
    );
  }

  if (currentScope.deal_closed_by) {
    parts.push(`- Deal Closed By: ${currentScope.deal_closed_by}`);
  }

  return parts.join("\n");
}

/**
 * Extracts structured data from content using AI
 */
export async function extractFromContent(
  content: string,
  sourceType: SourceType,
  currentScope: CurrentScope | null,
): Promise<ExtractionResult[]> {
  const contextPrompt = buildScopeContext(currentScope);

  const sourceContext =
    sourceType === "MEETING"
      ? "This is a transcript from a sales or implementation meeting."
      : sourceType === "EMAIL"
        ? "This is from an email conversation."
        : "This is from a manual entry.";

  const { object } = await generateObject({
    model: openrouter("openai/gpt-5-mini"),
    schema: fullExtractionSchema,
    system: EXTRACTION_PROMPT + contextPrompt,
    prompt: `${sourceContext}\n\nPlease extract actionable information from the following content:\n\n${content}`,
  });

  return object.extractions as ExtractionResult[];
}
