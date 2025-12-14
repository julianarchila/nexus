import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ===========================================
// TYPES
// ===========================================

export type LifecycleStage = "SCOPING" | "IMPLEMENTING" | "LIVE";
export type FieldStatus = "COMPLETE" | "MISSING";
export type SourceType =
  | "MEETING"
  | "EMAIL"
  | "SLACK"
  | "SALESFORCE"
  | "DOCUMENT"
  | "MANUAL";
export type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
export type ExtractionStatus =
  | "PENDING"
  | "AUTO_APPLIED"
  | "MANUALLY_APPROVED"
  | "REJECTED";
export type ActorType = "AI" | "USER" | "SYSTEM";
export type ChangeType = "CREATE" | "UPDATE" | "STAGE_CHANGE";
export type AttachmentCategory = "CONTRACT" | "TECHNICAL_DOC" | "OTHER";
export type ImplementationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "LIVE"
  | "BLOCKED"
  | "NOT_REQUIRED";
export type TransitionStatus = "APPROVED" | "REJECTED";

// Types for stage transition JSONB fields
export interface ScopeSnapshot {
  psps: string[];
  countries: string[];
  payment_methods: string[];
  expected_volume: string | null;
  expected_approval_rate: string | null;
  restrictions: string[];
  dependencies: string[];
  compliance_requirements: string[];
  expected_go_live_date: string | null;
  comes_from_mor: boolean;
  deal_closed_by: string | null;
}

export interface TransitionWarning {
  type: "PSP_NOT_SUPPORTED" | "PAYMENT_METHOD_NOT_SUPPORTED";
  processor_id?: string;
  payment_method?: string;
  message: string;
}

// ===========================================
// 1. MERCHANT PROFILE
// ===========================================

export const merchantProfile = pgTable(
  "merchant_profile",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    contact_email: text("contact_email").notNull(),
    contact_name: text("contact_name"),

    // Lifecycle: "SCOPING" | "IMPLEMENTING" | "LIVE"
    lifecycle_stage: text("lifecycle_stage")
      .$type<LifecycleStage>()
      .notNull()
      .default("SCOPING"),

    // Ownership
    sales_owner: text("sales_owner"),
    implementation_owner: text("implementation_owner"),

    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    lifecycleStageIdx: index("merchant_profile_lifecycle_stage_idx").on(
      table.lifecycle_stage,
    ),
    contactEmailIdx: index("merchant_profile_contact_email_idx").on(
      table.contact_email,
    ),
  }),
);

// ===========================================
// 2. SCOPE IN DOC (Implementation Readiness)
// ===========================================

export const scopeInDoc = pgTable(
  "scope_in_doc",
  {
    id: text("id").primaryKey(),
    merchant_id: text("merchant_id")
      .notNull()
      .references(() => merchantProfile.id),

    // Integration requirements
    psps: jsonb("psps").$type<string[]>().default([]),
    psps_status: text("psps_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    countries: jsonb("countries").$type<string[]>().default([]),
    countries_status: text("countries_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    payment_methods: jsonb("payment_methods").$type<string[]>().default([]),
    payment_methods_status: text("payment_methods_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    // Metrics
    expected_volume: text("expected_volume"),
    expected_volume_status: text("expected_volume_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    expected_approval_rate: text("expected_approval_rate"),
    expected_approval_rate_status: text("expected_approval_rate_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    // Restrictions & Dependencies
    restrictions: jsonb("restrictions").$type<string[]>().default([]),
    restrictions_status: text("restrictions_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    dependencies: jsonb("dependencies").$type<string[]>().default([]),
    dependencies_status: text("dependencies_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    // Compliance
    compliance_requirements: jsonb("compliance_requirements")
      .$type<string[]>()
      .default([]),
    compliance_status: text("compliance_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    // Timeline
    expected_go_live_date: timestamp("expected_go_live_date"),
    go_live_date_status: text("go_live_date_status")
      .$type<FieldStatus>()
      .notNull()
      .default("MISSING"),

    // Origin context
    comes_from_mor: boolean("comes_from_mor").notNull().default(false),
    deal_closed_by: text("deal_closed_by"),

    // Overall readiness
    is_complete: boolean("is_complete").notNull().default(false),

    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("scope_in_doc_merchant_id_idx").on(table.merchant_id),
    isCompleteIdx: index("scope_in_doc_is_complete_idx").on(table.is_complete),
  }),
);

// ===========================================
// 3. INBOUND EVENT (Multi-source ingestion)
// ===========================================

export const inboundEvent = pgTable(
  "inbound_event",
  {
    id: text("id").primaryKey(),
    merchant_id: text("merchant_id")
      .notNull()
      .references(() => merchantProfile.id),

    source_type: text("source_type").$type<SourceType>().notNull(),
    source_id: text("source_id"), // External ID (Gong call ID, Gmail message ID, etc.)

    // Raw content (immutable)
    raw_content: text("raw_content").notNull(),

    // Source-specific metadata
    // For MEETING: { title, participants, duration, recorded_at }
    // For EMAIL: { from, to, subject, received_at }
    // For SLACK: { channel, thread_ts, author }
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

    // Processing
    processing_status: text("processing_status")
      .$type<ProcessingStatus>()
      .notNull()
      .default("PENDING"),
    processed_at: timestamp("processed_at"),

    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("inbound_event_merchant_id_idx").on(table.merchant_id),
    sourceTypeIdx: index("inbound_event_source_type_idx").on(table.source_type),
    processingStatusIdx: index("inbound_event_processing_status_idx").on(
      table.processing_status,
    ),
    createdAtIdx: index("inbound_event_created_at_idx").on(table.created_at),
  }),
);

// ===========================================
// 4. AI EXTRACTION (What AI found)
// ===========================================

export const aiExtraction = pgTable(
  "ai_extraction",
  {
    id: text("id").primaryKey(),
    inbound_event_id: text("inbound_event_id")
      .notNull()
      .references(() => inboundEvent.id),
    merchant_id: text("merchant_id")
      .notNull()
      .references(() => merchantProfile.id),

    // What was extracted
    target_table: text("target_table").notNull(),
    target_field: text("target_field").notNull(),
    extracted_value: jsonb("extracted_value")
      .$type<Record<string, any>>()
      .notNull(),

    // Confidence & reasoning
    confidence: text("confidence").$type<ConfidenceLevel>().notNull(),
    reasoning: text("reasoning").notNull(),

    // Application status
    status: text("status")
      .$type<ExtractionStatus>()
      .notNull()
      .default("PENDING"),
    applied_at: timestamp("applied_at"),
    reviewed_by: text("reviewed_by"),

    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("ai_extraction_merchant_id_idx").on(table.merchant_id),
    inboundEventIdIdx: index("ai_extraction_inbound_event_id_idx").on(
      table.inbound_event_id,
    ),
    statusIdx: index("ai_extraction_status_idx").on(table.status),
    confidenceIdx: index("ai_extraction_confidence_idx").on(table.confidence),
  }),
);

// ===========================================
// 5. AUDIT LOG (Change history)
// ===========================================

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    merchant_id: text("merchant_id")
      .notNull()
      .references(() => merchantProfile.id),

    // What changed
    target_table: text("target_table").notNull(),
    target_id: text("target_id").notNull(),
    target_field: text("target_field"),
    change_type: text("change_type").$type<ChangeType>().notNull(),

    // Values
    old_value: jsonb("old_value").$type<any>(),
    new_value: jsonb("new_value").$type<any>(),

    // Attribution
    actor_type: text("actor_type").$type<ActorType>().notNull(),
    actor_id: text("actor_id"),

    // Origin
    source_type: text("source_type").$type<SourceType>(),
    source_id: text("source_id"),
    reason: text("reason"),

    ai_extraction_id: text("ai_extraction_id").references(
      () => aiExtraction.id,
    ),

    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("audit_log_merchant_id_idx").on(table.merchant_id),
    targetTableIdx: index("audit_log_target_table_idx").on(table.target_table),
    actorTypeIdx: index("audit_log_actor_type_idx").on(table.actor_type),
    createdAtIdx: index("audit_log_created_at_idx").on(table.created_at),
  }),
);

// ===========================================
// 6. ATTACHMENT
// ===========================================

export const attachment = pgTable(
  "attachment",
  {
    id: text("id").primaryKey(),
    merchant_id: text("merchant_id")
      .notNull()
      .references(() => merchantProfile.id),

    filename: text("filename").notNull(),
    file_type: text("file_type").notNull(),
    file_size: integer("file_size").notNull(),
    storage_url: text("storage_url").notNull(),

    category: text("category").$type<AttachmentCategory>(),
    description: text("description"),

    uploaded_by: text("uploaded_by").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("attachment_merchant_id_idx").on(table.merchant_id),
    categoryIdx: index("attachment_category_idx").on(table.category),
  }),
);

// ===========================================
// 7. PAYMENT PROCESSORS (existing)
// ===========================================

export const paymentProcessors = pgTable("payment_processors", {
  id: text("id").primaryKey(), // "stripe", "adyen"
  name: text("name").notNull(),

  // Estado general de integración con Yuno
  status: text("status").notNull(), // "NOT_SUPPORTED" | "IN_PROGRESS" | "LIVE" | "DEPRECATED"

  // Capacidades globales que no dependen de país
  supports_payouts: boolean("supports_payouts").notNull().default(false),
  supports_recurring: boolean("supports_recurring").notNull().default(false),
  supports_refunds: boolean("supports_refunds").notNull().default(false),
  supports_crypto: boolean("supports_crypto").notNull().default(false),

  // Ownership interno
  product_manager: text("product_manager"),

  notes: text("notes"),
  metadata: jsonb("metadata").default("{}"),

  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===========================================
// 8. COUNTRY PROCESSOR FEATURES (existing)
// ===========================================

export const countryProcessorFeatures = pgTable("country_processor_features", {
  id: text("id").primaryKey(),

  processor_id: text("processor_id")
    .notNull()
    .references(() => paymentProcessors.id),

  country: text("country").notNull(), // ISO ISO-3166 (BR, MX, CO, US, etc)

  // Métodos de pago soportados en este país
  supported_methods: jsonb("supported_methods").notNull().$type<string[]>(),

  // Capacidades específicas por país
  supports_local_instruments: boolean("supports_local_instruments")
    .notNull()
    .default(false),

  supports_payouts: boolean("supports_payouts").notNull().default(false),
  supports_crypto: boolean("supports_crypto").notNull().default(false),

  status: text("status").notNull(), // "NOT_SUPPORTED" | "IN_PROGRESS" | "LIVE"

  notes: text("notes"),
  metadata: jsonb("metadata").default("{}"),

  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===========================================
// 9. MERCHANT PSP IMPLEMENTATION
// ===========================================

export const merchantPspImplementation = pgTable(
  "merchant_psp_implementation",
  {
    id: text("id").primaryKey(),
    merchant_id: text("merchant_id")
      .notNull()
      .references(() => merchantProfile.id),

    // What PSP is being implemented
    processor_id: text("processor_id").notNull(), // Reference to paymentProcessors.id or string ID if not yet in platform

    // Status tracking
    status: text("status")
      .$type<ImplementationStatus>()
      .notNull()
      .default("PENDING"),
    blocked_reason: text("blocked_reason"), // If BLOCKED
    not_required_reason: text("not_required_reason"), // If NOT_REQUIRED

    // Platform support at time of creation
    platform_supported: boolean("platform_supported").notNull(), // Was this PSP supported when scope was approved?

    // Tracking
    started_at: timestamp("started_at"),
    completed_at: timestamp("completed_at"),

    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("merchant_psp_impl_merchant_id_idx").on(
      table.merchant_id,
    ),
    statusIdx: index("merchant_psp_impl_status_idx").on(table.status),
    processorIdIdx: index("merchant_psp_impl_processor_id_idx").on(
      table.processor_id,
    ),
  }),
);

// ===========================================
// 10. MERCHANT PAYMENT METHOD IMPLEMENTATION
// ===========================================

export const merchantPaymentMethodImplementation = pgTable(
  "merchant_payment_method_implementation",
  {
    id: text("id").primaryKey(),
    merchant_id: text("merchant_id")
      .notNull()
      .references(() => merchantProfile.id),

    // What payment method is being implemented
    payment_method: text("payment_method").notNull(),

    // Status tracking
    status: text("status")
      .$type<ImplementationStatus>()
      .notNull()
      .default("PENDING"),
    blocked_reason: text("blocked_reason"), // If BLOCKED
    not_required_reason: text("not_required_reason"), // If NOT_REQUIRED

    // Platform support at time of creation
    platform_supported: boolean("platform_supported").notNull(), // Was this payment method supported when scope was approved?

    // Tracking
    started_at: timestamp("started_at"),
    completed_at: timestamp("completed_at"),

    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("merchant_pm_impl_merchant_id_idx").on(
      table.merchant_id,
    ),
    statusIdx: index("merchant_pm_impl_status_idx").on(table.status),
    paymentMethodIdx: index("merchant_pm_impl_payment_method_idx").on(
      table.payment_method,
    ),
  }),
);

// ===========================================
// 11. STAGE TRANSITION
// ===========================================

export const stageTransition = pgTable(
  "stage_transition",
  {
    id: text("id").primaryKey(),
    merchant_id: text("merchant_id")
      .notNull()
      .references(() => merchantProfile.id),

    // Transition details
    from_stage: text("from_stage").$type<LifecycleStage>().notNull(),
    to_stage: text("to_stage").$type<LifecycleStage>().notNull(),
    status: text("status").$type<TransitionStatus>().notNull(),

    // Who and when
    transitioned_by: text("transitioned_by").notNull(), // User ID

    // Scope snapshot (frozen at transition time for SCOPING → IMPLEMENTING)
    scope_snapshot: jsonb("scope_snapshot").$type<ScopeSnapshot>(),

    // User feedback during transition
    user_feedback: text("user_feedback"),

    // Warnings that were acknowledged (for SCOPING → IMPLEMENTING)
    warnings_acknowledged: jsonb("warnings_acknowledged")
      .$type<TransitionWarning[]>()
      .default([]),

    // For rejections
    rejection_reason: text("rejection_reason"),

    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("stage_transition_merchant_id_idx").on(
      table.merchant_id,
    ),
    createdAtIdx: index("stage_transition_created_at_idx").on(table.created_at),
  }),
);

// ===========================================
// RELATIONS
// ===========================================

export const merchantProfileRelations = relations(
  merchantProfile,
  ({ one, many }) => ({
    scopeInDoc: one(scopeInDoc, {
      fields: [merchantProfile.id],
      references: [scopeInDoc.merchant_id],
    }),
    inboundEvents: many(inboundEvent),
    aiExtractions: many(aiExtraction),
    auditLogs: many(auditLog),
    attachments: many(attachment),
    pspImplementations: many(merchantPspImplementation),
    paymentMethodImplementations: many(merchantPaymentMethodImplementation),
    stageTransitions: many(stageTransition),
  }),
);

export const scopeInDocRelations = relations(scopeInDoc, ({ one }) => ({
  merchant: one(merchantProfile, {
    fields: [scopeInDoc.merchant_id],
    references: [merchantProfile.id],
  }),
}));

export const inboundEventRelations = relations(
  inboundEvent,
  ({ one, many }) => ({
    merchant: one(merchantProfile, {
      fields: [inboundEvent.merchant_id],
      references: [merchantProfile.id],
    }),
    aiExtractions: many(aiExtraction),
  }),
);

export const aiExtractionRelations = relations(aiExtraction, ({ one }) => ({
  merchant: one(merchantProfile, {
    fields: [aiExtraction.merchant_id],
    references: [merchantProfile.id],
  }),
  inboundEvent: one(inboundEvent, {
    fields: [aiExtraction.inbound_event_id],
    references: [inboundEvent.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  merchant: one(merchantProfile, {
    fields: [auditLog.merchant_id],
    references: [merchantProfile.id],
  }),
  aiExtraction: one(aiExtraction, {
    fields: [auditLog.ai_extraction_id],
    references: [aiExtraction.id],
  }),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  merchant: one(merchantProfile, {
    fields: [attachment.merchant_id],
    references: [merchantProfile.id],
  }),
}));

export const paymentProcessorsRelations = relations(
  paymentProcessors,
  ({ many }) => ({
    countryFeatures: many(countryProcessorFeatures),
  }),
);

export const countryProcessorFeaturesRelations = relations(
  countryProcessorFeatures,
  ({ one }) => ({
    processor: one(paymentProcessors, {
      fields: [countryProcessorFeatures.processor_id],
      references: [paymentProcessors.id],
    }),
  }),
);

export const merchantPspImplementationRelations = relations(
  merchantPspImplementation,
  ({ one }) => ({
    merchant: one(merchantProfile, {
      fields: [merchantPspImplementation.merchant_id],
      references: [merchantProfile.id],
    }),
  }),
);

export const merchantPaymentMethodImplementationRelations = relations(
  merchantPaymentMethodImplementation,
  ({ one }) => ({
    merchant: one(merchantProfile, {
      fields: [merchantPaymentMethodImplementation.merchant_id],
      references: [merchantProfile.id],
    }),
  }),
);

export const stageTransitionRelations = relations(
  stageTransition,
  ({ one }) => ({
    merchant: one(merchantProfile, {
      fields: [stageTransition.merchant_id],
      references: [merchantProfile.id],
    }),
  }),
);
