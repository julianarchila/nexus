# Nexus

Merchant Control & Readiness System for Yuno. Centralizes merchant context from unstructured sources (calls, emails, documents), extracts structured data using AI, and enforces readiness gates before stage transitions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│                          Next.js + shadcn/ui                                │
│                                                                              │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard  │  │ Merchant Detail │  │ Scope Editor │  │ PSP Catalog  │  │
│  │  (list)     │  │ (tabs + audit)  │  │ (edit scope) │  │ (search)     │  │
│  └─────────────┘  └─────────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│                            TRPC (type-safe)                                 │
│                                                                              │
│  merchants │ scope │ pipeline │ audit │ attachments │ payments │ impls     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│     PostgreSQL      │  │       Inngest       │  │     OpenRouter      │
│    (Drizzle ORM)    │  │   (Event Queue)     │  │     (AI/LLM)        │
│                     │  │                     │  │                     │
│ • merchantProfile   │  │ Event-driven        │  │ GPT-4-mini          │
│ • scopeInDoc        │  │ processing with     │  │ Batch extraction    │
│ • inboundEvent      │  │ retries and         │  │ of scope fields     │
│ • aiExtraction      │  │ orchestration       │  │                     │
│ • auditLog          │  │                     │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INGESTION PIPELINE                                   │
│                                                                              │
│  ┌───────────────────────────────────┐  ┌────────────────────────────┐      │
│  │ UNSTRUCTURED DATA                 │  │ STRUCTURED DATA            │      │
│  │                                   │  │                            │      │
│  │  ┌────────┐  ┌────────┐  ┌─────┐ │  │  ┌────────────────────┐   │      │
│  │  │  Gong  │  │ Email  │  │Slack│ │  │  │   Manual Updates   │   │      │
│  │  │   ✅   │  │(future)│  │(fut)│ │  │  │   (Scope Editor)   │   │      │
│  │  └────────┘  └────────┘  └─────┘ │  │  └────────────────────┘   │      │
│  │               │                   │  │            │              │      │
│  │               ▼                   │  │            │              │      │
│  │  ┌───────────────────────────┐   │  │            │              │      │
│  │  │ PROCESSING                │   │  │            │              │      │
│  │  │ Resolve → AI Extract      │   │  │            │              │      │
│  │  └───────────────────────────┘   │  │            │              │      │
│  │               │                   │  │            │              │      │
│  └───────────────┼───────────────────┘  └────────────┼──────────────┘      │
│                  │                                   │                      │
│                  └───────────────┬───────────────────┘                      │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ APPLICATION                                                          │   │
│  │ Update scope_in_doc → Create audit log                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

**Frontend**
- **Dashboard**: Merchant list with filtering and search
- **Merchant Detail**: Multi-tab view (Overview, Scoping, Documents, Activity)
- **Scope Editor**: Interactive form for editing implementation requirements
- **PSP Catalog**: Payment processor search and capabilities

**API Layer** (TRPC - type-safe)
- `merchants`: CRUD operations, list with filters
- `scope`: Update scope fields with audit logging
- `pipeline`: Stage transitions with readiness validation
- `audit`: Query change history with filters
- `payments`: PSP catalog and country-specific features
- `implementations`: Track PSP/payment method integration status

**Database** (PostgreSQL + Drizzle ORM)
- `merchantProfile`: Identity and lifecycle stage
- `scopeInDoc`: Implementation requirements with field-level status tracking
- `inboundEvent`: Polymorphic event storage (MEETING/EMAIL/SLACK/MANUAL)
- `aiExtraction`: AI-detected changes with confidence levels
- `auditLog`: Immutable change history with actor attribution
- `stageTransition`: Stage change tracking with scope snapshots

**Ingestion Pipeline** (Inngest)
- **Adapters**: Normalize source-specific data (Gong ✅, Email/Slack planned)
- **Processing**: Merchant resolution + AI extraction (batch mode)
- **Application**: Auto-apply HIGH confidence changes + audit logging

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- PostgreSQL (v14+)
- Inngest CLI (for local development)
- OpenRouter API key

### Environment Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables in `.env`:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/nexus
   OPENROUTER_API_KEY=your_api_key_here
   ```

### Installation & Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Generate database migrations** (if schema changed):
   ```bash
   bun drizzle-kit generate
   ```

3. **Apply migrations**:
   ```bash
   bun drizzle-kit migrate
   ```

4. **Seed database** (fake merchants + PSP catalog):
   ```bash
   bun run apps/web/scripts/seed.ts
   ```

### Running the Project

You need two terminal windows:

**Terminal 1 - Inngest Dev Server**:
```bash
npx inngest-cli@latest dev
```

**Terminal 2 - Next.js App**:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Simulating Data

**Simulate Gong meeting webhooks** (since we don't have a Gong account):
```bash
bun run apps/web/scripts/gong.ts
```

This script sends fake meeting transcripts through the ingestion pipeline to test AI extraction and auto-application.

## Project Structure

```
nexus/
├── apps/web/
│   ├── src/
│   │   ├── app/                      # Next.js pages (App Router)
│   │   │   ├── (dashboard)/          # Dashboard page
│   │   │   │   ├── data-access/      # Server-side queries
│   │   │   │   ├── hooks/            # Client hooks
│   │   │   │   └── page.tsx
│   │   │   ├── merchants/[id]/       # Merchant detail page
│   │   │   │   ├── data-access/      # Server-side queries
│   │   │   │   ├── hooks/            # Client hooks
│   │   │   │   └── page.tsx
│   │   │   ├── payment-processors/   # PSP catalog page
│   │   │   │   ├── components/       # Feature components
│   │   │   │   ├── data-access/      # Server-side queries
│   │   │   │   ├── hooks/            # Client hooks
│   │   │   │   └── page.tsx
│   │   │   └── api/                  # API routes
│   │   │       ├── trpc/[trpc]/      # TRPC endpoint
│   │   │       ├── inngest/          # Inngest webhook
│   │   │       └── webhooks/         # External webhooks
│   │   ├── components/               # Shared UI components
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── pipeline/             # Stage transition, readiness
│   │   │   ├── scope/                # Scope editor
│   │   │   ├── app-sidebar.tsx       # App navigation
│   │   │   ├── merchants-table.tsx   # Merchant list table
│   │   │   └── payments.tsx          # Payment components
│   │   ├── core/                     # Business logic layer
│   │   │   ├── db/                   # Database layer
│   │   │   │   ├── schema.ts         # Drizzle schema definitions
│   │   │   │   └── client.ts         # Database client
│   │   │   ├── domain/               # Domain logic
│   │   │   │   └── scope/            # Scope domain logic
│   │   │   ├── integrations/         # External integrations
│   │   │   │   └── ai/               # AI extraction service
│   │   │   ├── repositories/         # Data access layer
│   │   │   ├── services/             # Business services
│   │   │   ├── use-cases/            # Application use cases
│   │   │   └── workflows/            # Inngest workflows
│   │   │       ├── adapters/         # Source adapters (Gong, Gmail)
│   │   │       ├── process-event.ts  # Event processing workflow
│   │   │       ├── apply-extraction.ts # Auto-apply workflow
│   │   │       └── index.ts
│   │   ├── hooks/                    # Shared React hooks
│   │   └── lib/                      # Shared utilities
│   │       ├── trpc/                 # TRPC setup (client, server, router)
│   │       ├── pdf/                  # PDF generation utilities
│   │       ├── inngest.ts            # Inngest client
│   │       ├── model.ts              # AI model config
│   │       └── utils.ts              # Shared utilities
│   └── scripts/                      # Utility scripts
│       ├── seed.ts                   # Database seeding
│       ├── seed-clean.ts             # Clean seed data
│       ├── gong.ts                   # Simulate Gong webhooks
│       ├── get-gmail-token.ts        # Gmail OAuth setup
│       └── create-test-merchant.ts   # Create test data
├── context.md                        # System overview & context
├── AGENTS.md                         # AI agent instructions
└── README.md
```

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Bun over Node.js** | Faster package installation, native TypeScript support, built-in test runner. Simpler DX for modern TypeScript projects. |
| **Inngest for event-driven processing** | Handles retries, orchestration, and async workflows out of the box. Decouples ingestion from processing. Visual debugging with dev UI. Scales from local dev to production without code changes. |
| **Adapter pattern for data sources** | Each source (Gong, Email, Slack) has its own adapter that normalizes data to a common `NormalizedInboundEvent` format. Adding new sources requires only a new adapter file - no changes to core pipeline logic. |
| **Auto-apply HIGH confidence extractions** | Reduces manual work while maintaining audit trail. AI reasoning is logged for transparency. MEDIUM/LOW confidence requires human review. |
