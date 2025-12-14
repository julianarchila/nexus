// Inngest event definitions with full type safety

export interface GongParty {
  affiliation: "External" | "Internal";
  emailAddress: string;
  name: string;
  title?: string;
}

export interface GongReceivedPayload {
  callId: string;
  title: string;
  transcript: string;
  parties: GongParty[];
  duration: number;
  recordedAt: string;
}

export interface ManualReceivedPayload {
  merchantId: string;
  content: string;
  description?: string;
  submittedBy: string;
}

export interface EventCreatedPayload {
  inboundEventId: string;
}

export interface ExtractionCompletedPayload {
  merchantId: string;
  extractionIds: string[];
  inboundEventId: string;
}

// Type-safe event map for Inngest client
export type IngestionEvents = {
  "ingest/gong.received": { data: GongReceivedPayload };
  "ingest/manual.received": { data: ManualReceivedPayload };
  "ingest/event.created": { data: EventCreatedPayload };
  "extraction/completed": { data: ExtractionCompletedPayload };
};
