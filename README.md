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

**Frontend** (Feature-Sliced Architecture)
- **Dashboard**: Merchant list with filtering and search
- **Merchant Detail**: Multi-tab view (Overview, Scoping, Documents, Activity)
- **Scope Editor**: Interactive form for editing implementation requirements
- **PSP Catalog**: Payment processor search and capabilities


Each route follows a **Feature-Sliced** architecture with clear separation of concerns:

```
app/{route}/
├── components/
│   ├── {feature}-container.tsx   # Orchestrates hooks + loading/error states
│   ├── {feature}-loader.tsx      # Skeleton UI
│   └── {feature}-table.tsx       # Pure presentation (props only)
├── data-access/
│   └── queries.ts                # Query options + stale times
├── hooks/
│   ├── index.ts                  # Barrel export
│   ├── use-{feature}-data.ts     # Data fetching + derived state
│   └── use-{feature}-filters.ts  # UI state (search, filters, pagination)
└── page.tsx                      # Minimal - layout + container
```

**Key principles:**
- **Pages are minimal** - Just unwrap params and render a container
- **Containers orchestrate** - Combine hooks, handle loading/error, compose presentation
- **Presentation is pure** - Receives data via props, no internal data fetching
- **Hooks own state** - Both server state (TanStack Query) and UI state (filters)
- **Query options are centralized** - Stale times and query keys in `data-access/`
- **Shared components in `/components`** - Only truly reusable components (ui primitives, pipeline widgets)

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
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── (dashboard)/          # Dashboard route
│   │   │   │   ├── components/       # Container, Loader, Table
│   │   │   │   ├── data-access/      # Query options
│   │   │   │   ├── hooks/            # useMerchantsList
│   │   │   │   └── page.tsx
│   │   │   ├── merchants/[id]/       # Merchant detail route
│   │   │   │   ├── components/       # Container, Loader, ActivityLogPanel
│   │   │   │   ├── data-access/      # Query options
│   │   │   │   ├── hooks/            # useMerchantDetail, useMerchantAuditLog
│   │   │   │   └── page.tsx
│   │   │   ├── payment-processors/   # PSP catalog route
│   │   │   │   ├── components/       # Container, Loader, Table
│   │   │   │   ├── data-access/      # Query options
│   │   │   │   ├── hooks/            # usePaymentProcessorsData, useFilters
│   │   │   │   └── page.tsx
│   │   │   └── api/                  # API routes
│   │   │       ├── trpc/[trpc]/      # TRPC endpoint
│   │   │       ├── inngest/          # Inngest webhook
│   │   │       └── webhooks/         # External webhooks
│   │   ├── components/               # Shared components
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── pipeline/             # Stage transition, readiness
│   │   │   └── scope/                # Scope editor
│   │   ├── core/                     # Business logic layer
│   │   │   ├── db/                   # Schema + client
│   │   │   ├── domain/               # Domain logic
│   │   │   ├── integrations/ai/      # AI extraction
│   │   │   ├── repositories/         # Data access
│   │   │   ├── services/             # Business services
│   │   │   ├── use-cases/            # Application use cases
│   │   │   └── workflows/            # Inngest workflows + adapters
│   │   ├── hooks/                    # Shared React hooks
│   │   └── lib/                      # Utilities (trpc, pdf, inngest)
│   └── scripts/                      # Seed, simulate webhooks, etc.
└── README.md
```

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Bun over Node.js** | Faster package installation, native TypeScript support, built-in test runner. Simpler DX for modern TypeScript projects. |
| **Inngest for event-driven processing** | Handles retries, orchestration, and async workflows out of the box. Decouples ingestion from processing. Visual debugging with dev UI. Scales from local dev to production without code changes. |
| **Adapter pattern for data sources** | Each source (Gong, Email, Slack) has its own adapter that normalizes data to a common `NormalizedInboundEvent` format. Adding new sources requires only a new adapter file - no changes to core pipeline logic. |
| **Auto-apply HIGH confidence extractions** | Reduces manual work while maintaining audit trail. AI reasoning is logged for transparency. MEDIUM/LOW confidence requires human review. |
