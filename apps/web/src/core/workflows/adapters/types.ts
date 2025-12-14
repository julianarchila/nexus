import type { SourceType } from "@/core/db/schema";

export interface MerchantHints {
  email?: string;
  merchantId?: string;
  // Future: slackChannelId?: string;
  // Future: salesforceAccountId?: string;
}

export interface NormalizedInboundEvent {
  sourceType: SourceType;
  sourceId: string;
  rawContent: string;
  metadata: Record<string, unknown>;
  merchantHints: MerchantHints;
}
