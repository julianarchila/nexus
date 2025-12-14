# Ingestion System Implementation Plan

## Overview

A modular, event-driven ingestion pipeline using Inngest that:
- Normalizes data from multiple sources (Gong, Gmail, Slack, etc.)
- Resolves merchants using pluggable strategies
- Extracts structured data using AI (batch mode)
- Auto-applies high-confidence extractions
- Maintains full audit trail

## Final Directory Structure

```
apps/web/src/core/
├── ingestion/
│   ├── index.ts                      # Export all Inngest functions
│   ├── events.ts                     # Inngest event type definitions
│   │
│   ├── adapters/                     # Layer 1: Source adapters
│   │   ├── types.ts                  # Adapter shared types
│   │   ├── gong.adapter.ts           # Gong webhook → inbound event
│   │   └── manual.adapter.ts         # Manual entry → inbound event
│   │
│   ├── pipeline/                     # Layer 2: Processing
│   │   └── process-event.ts          # Process inbound events
│   │
│   ├── application/                  # Layer 3: Apply changes
│   │   └── apply-extraction.ts       # Apply AI extractions
│   │
│   └── services/                     # Business logic
│       ├── merchant-resolver.ts      # Pluggable merchant resolution
│       ├── extractor.ts              # AI extraction (batch)
│       ├── applicator.ts             # Apply to scope_in_doc
│       └── inbound-event.repo.ts     # Inbound event DB operations
│
├── services/
│   └── audit/
│       └── audit-logger.ts           # Audit log creation
│
├── db/
│   └── schema.ts                     # (existing, no changes needed)
│
└── events/                           # DEPRECATED - will remove
    └── ...
```

---

## Implementation Phases

### Phase 1: Foundation & Types

| # | File | Description |
|---|------|-------------|
| 1.1 | `ingestion/events.ts` | Define Inngest event types with TypeScript |
| 1.2 | `ingestion/adapters/types.ts` | Shared types: `NormalizedEvent`, `MerchantHints` |
| 1.3 | `ingestion/services/inbound-event.repo.ts` | CRUD for `inbound_event` table |
| 1.4 | `services/audit/audit-logger.ts` | Create audit log entries |

### Phase 2: Merchant Resolution

| # | File | Description |
|---|------|-------------|
| 2.1 | `ingestion/services/merchant-resolver.ts` | Strategy pattern with `EmailStrategy` and `DirectIdStrategy` |

### Phase 3: AI Extraction & Application

| # | File | Description |
|---|------|-------------|
| 3.1 | `ingestion/services/extractor.ts` | Batch AI extraction with confidence scores |
| 3.2 | `ingestion/services/applicator.ts` | Apply extractions to `scope_in_doc`, update field statuses |

### Phase 4: Inngest Functions

| # | File | Description |
|---|------|-------------|
| 4.1 | `ingestion/adapters/gong.adapter.ts` | Handle `ingest/gong.received` |
| 4.2 | `ingestion/adapters/manual.adapter.ts` | Handle `ingest/manual.received` |
| 4.3 | `ingestion/pipeline/process-event.ts` | Handle `ingest/event.created` (3 retries) |
| 4.4 | `ingestion/application/apply-extraction.ts` | Handle `extraction/completed` |
| 4.5 | `ingestion/index.ts` | Export all functions array |

### Phase 5: Integration & Cleanup

| # | File | Description |
|---|------|-------------|
| 5.1 | `lib/inngest.ts` | Update Inngest client with event types |
| 5.2 | `app/api/inngest/route.ts` | Import from new `ingestion/` |
| 5.3 | `events/` | Remove deprecated files |
| 5.4 | `services/gong-extractor.ts` | Remove deprecated file |

### Phase 6: Documentation & Testing (Future)

| # | Task | Description |
|---|------|-------------|
| 6.1 | Seed script | Create test script for end-to-end pipeline verification |
| 6.2 | Update `docs/context.md` | Document the ingestion architecture |

---

## Detailed File Specifications

### 1.1 `ingestion/events.ts`

```typescript
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
```

### 1.2 `ingestion/adapters/types.ts`

```typescript
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
```

### 1.3 `ingestion/services/inbound-event.repo.ts`

```typescript
// Functions:
// - createInboundEvent(event: NormalizedInboundEvent, merchantId: string): Promise<string>
// - getInboundEvent(id: string): Promise<InboundEvent>
// - updateInboundEventStatus(id: string, status: ProcessingStatus, errorMessage?: string): Promise<void>
// 
// Uses nanoid for ID generation
```

### 1.4 `services/audit/audit-logger.ts`

```typescript
// Interface:
export interface AuditLogEntry {
  merchantId: string;
  targetTable: string;
  targetId: string;
  targetField?: string;
  changeType: ChangeType;
  oldValue?: unknown;
  newValue?: unknown;
  actorType: ActorType;
  actorId?: string;
  sourceType?: SourceType;
  sourceId?: string;
  reason?: string;
  aiExtractionId?: string;
}

// Function:
// - createAuditLog(entry: AuditLogEntry): Promise<string>
```

### 2.1 `ingestion/services/merchant-resolver.ts`

```typescript
// Strategy pattern implementation
// 
// Strategies (in priority order):
// 1. DirectIdStrategy - resolves by merchantId hint
// 2. EmailStrategy - resolves by contact_email
//
// Easy to add future strategies:
// - SlackChannelStrategy
// - DomainStrategy
// - SalesforceAccountStrategy

export interface ResolvedMerchant {
  id: string;
  name: string;
}

export function resolveMerchant(hints: MerchantHints): Promise<ResolvedMerchant | null>
```

### 3.1 `ingestion/services/extractor.ts`

```typescript
// Batch extraction using AI SDK + OpenRouter
//
// Schema extracts all scope_in_doc fields in one call:
// - psps, countries, payment_methods (arrays)
// - expected_volume, expected_approval_rate (strings)
// - restrictions, dependencies, compliance_requirements (arrays)
// - expected_go_live_date, comes_from_mor, deal_closed_by (misc)
//
// Each extraction includes:
// - field name
// - extracted value
// - confidence: HIGH | MEDIUM | LOW
// - reasoning: explanation for the extraction

export interface ExtractionResult {
  targetField: string;
  extractedValue: unknown;
  confidence: ConfidenceLevel;
  reasoning: string;
}

export function extractFromContent(
  content: string,
  sourceType: SourceType,
  currentScope: ScopeInDoc | null
): Promise<ExtractionResult[]>
```

### 3.2 `ingestion/services/applicator.ts`

```typescript
// Apply extractions to scope_in_doc table
// 
// For array fields: merge with existing (deduplicate)
// For scalar fields: overwrite if new value exists
// Updates corresponding _status field to "PARTIAL" or "COMPLETE"
// Recalculates is_complete flag

export function applyExtractionToScope(
  merchantId: string,
  scopeId: string,
  field: string,
  value: unknown,
  currentValue: unknown
): Promise<{ oldValue: unknown; newValue: unknown }>
```

### 4.1 `ingestion/adapters/gong.adapter.ts`

```typescript
// Inngest function: "ingest-gong-adapter"
// Trigger: "ingest/gong.received"
// 
// Steps:
// 1. Extract external party email from parties
// 2. Resolve merchant by email
// 3. Create inbound_event record
// 4. Emit "ingest/event.created"
```

### 4.2 `ingestion/adapters/manual.adapter.ts`

```typescript
// Inngest function: "ingest-manual-adapter"
// Trigger: "ingest/manual.received"
// 
// Steps:
// 1. Use merchantId directly from payload
// 2. Create inbound_event record
// 3. Emit "ingest/event.created"
```

### 4.3 `ingestion/pipeline/process-event.ts`

```typescript
// Inngest function: "ingest-process-event"
// Trigger: "ingest/event.created"
// Retries: 3 (then mark FAILED)
// 
// Steps:
// 1. Load inbound event
// 2. TODO: Implement idempotency check - prevent re-processing same source_id
// 3. Resolve merchant (if not already resolved in adapter)
// 4. Load current scope_in_doc for context
// 5. AI extraction (batch)
// 6. Save ai_extraction records
// 7. Update inbound_event status to PROCESSED
// 8. Emit "extraction/completed"
```

### 4.4 `ingestion/application/apply-extraction.ts`

```typescript
// Inngest function: "apply-extraction"
// Trigger: "extraction/completed"
// 
// Steps:
// 1. Load extractions by IDs
// 2. Separate HIGH confidence (auto-apply) 
// 3. For each HIGH confidence extraction:
//    a. Apply to scope_in_doc
//    b. Create audit_log entry (actor_type: "AI")
//    c. Update ai_extraction status to "AUTO_APPLIED"
```

### 5.1 `lib/inngest.ts` (Updated)

```typescript
import { Inngest } from "inngest";
import type { IngestionEvents } from "@/core/ingestion/events";

export const inngest = new Inngest<IngestionEvents>({ 
  id: "nexus" 
});
```

---

## Data Flow Example (Gong Meeting)

```
1. Webhook hits API endpoint with Gong data
   ↓
2. API sends event: inngest.send("ingest/gong.received", { callId, transcript, parties, ... })
   ↓
3. gong.adapter.ts receives event:
   - Extracts external email: "merchant@acme.com"
   - Resolves merchant → { id: "m_123", name: "Acme Corp" }
   - Creates inbound_event record (status: PENDING)
   - Sends: "ingest/event.created" { inboundEventId: "ie_456" }
   ↓
4. process-event.ts receives event:
   - Loads inbound_event
   - Loads current scope_in_doc for merchant
   - AI extracts: [
       { field: "psps", value: ["stripe", "adyen"], confidence: "HIGH", reasoning: "..." },
       { field: "countries", value: ["BR", "MX"], confidence: "HIGH", reasoning: "..." },
       { field: "expected_volume", value: "$5M monthly", confidence: "MEDIUM", reasoning: "..." }
     ]
   - Saves 3 ai_extraction records
   - Updates inbound_event status → PROCESSED
   - Sends: "extraction/completed" { merchantId, extractionIds: [...] }
   ↓
5. apply-extraction.ts receives event:
   - HIGH confidence (psps, countries):
     - Updates scope_in_doc.psps = ["stripe", "adyen"]
     - Updates scope_in_doc.psps_status = "PARTIAL"
     - Creates audit_log entry
     - Marks ai_extraction as AUTO_APPLIED
```

---

## Design Principles

### Modularity
- Each layer is independent and testable
- Source adapters are isolated from processing logic
- Pluggable merchant resolution strategies
- Easy to add new sources without changing core logic

### Scalability
- Batch AI extraction reduces API calls
- Inngest handles retries and orchestration
- Distributed processing via event queue
- Database indexes optimized for common queries

### Auditability
- Every change is logged with full context
- Immutable audit trail
- AI decisions are explained (reasoning field)
- Source traceability through ai_extraction_id

### Reliability
- Retry policy: 3 attempts then explicit failure
- Idempotency checks prevent duplicate processing
- Comprehensive error handling and logging

---

## Notes & Decisions

| Topic | Decision |
|-------|----------|
| Merchant resolution | Pluggable strategies; email for now, extensible for Slack/Salesforce |
| AI extraction | Batch mode (one call extracts all fields) |
| Confidence thresholds | HIGH = auto-apply,  |
| Retry policy | 3 retries then mark as FAILED |
| Idempotency | TODO comment added; implement later to prevent re-processing same source_id |
| Webhooks | Design supports them; not implementing Gmail/Slack yet |
| Testing | Seed script planned for Phase 6 |

---

## Dependencies

- `nanoid` - For generating IDs (already in use or add to package.json)
- `ai` - Vercel AI SDK (already installed)
- `@openrouter/ai-sdk-provider` - (already installed)
- `inngest` - (already installed)
- `drizzle-orm` - (already installed)

---
