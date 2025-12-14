import { pgTable, index, foreignKey, text, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const inboundEvent = pgTable("inbound_event", {
	id: text().primaryKey().notNull(),
	merchantId: text("merchant_id").notNull(),
	sourceType: text("source_type").notNull(),
	sourceId: text("source_id"),
	rawContent: text("raw_content").notNull(),
	metadata: jsonb().default({}),
	processingStatus: text("processing_status").default('PENDING').notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("inbound_event_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("inbound_event_merchant_id_idx").using("btree", table.merchantId.asc().nullsLast().op("text_ops")),
	index("inbound_event_processing_status_idx").using("btree", table.processingStatus.asc().nullsLast().op("text_ops")),
	index("inbound_event_source_type_idx").using("btree", table.sourceType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchantProfile.id],
			name: "inbound_event_merchant_id_merchant_profile_id_fk"
		}),
]);

export const scopeInDoc = pgTable("scope_in_doc", {
	id: text().primaryKey().notNull(),
	merchantId: text("merchant_id").notNull(),
	psps: jsonb().default([]),
	pspsStatus: text("psps_status").default('MISSING').notNull(),
	countries: jsonb().default([]),
	countriesStatus: text("countries_status").default('MISSING').notNull(),
	paymentMethods: jsonb("payment_methods").default([]),
	paymentMethodsStatus: text("payment_methods_status").default('MISSING').notNull(),
	expectedVolume: text("expected_volume"),
	expectedVolumeStatus: text("expected_volume_status").default('MISSING').notNull(),
	expectedApprovalRate: text("expected_approval_rate"),
	expectedApprovalRateStatus: text("expected_approval_rate_status").default('MISSING').notNull(),
	restrictions: jsonb().default([]),
	restrictionsStatus: text("restrictions_status").default('MISSING').notNull(),
	dependencies: jsonb().default([]),
	dependenciesStatus: text("dependencies_status").default('MISSING').notNull(),
	complianceRequirements: jsonb("compliance_requirements").default([]),
	complianceStatus: text("compliance_status").default('MISSING').notNull(),
	expectedGoLiveDate: timestamp("expected_go_live_date", { mode: 'string' }),
	goLiveDateStatus: text("go_live_date_status").default('MISSING').notNull(),
	comesFromMor: boolean("comes_from_mor").default(false).notNull(),
	dealClosedBy: text("deal_closed_by"),
	isComplete: boolean("is_complete").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("scope_in_doc_is_complete_idx").using("btree", table.isComplete.asc().nullsLast().op("bool_ops")),
	index("scope_in_doc_merchant_id_idx").using("btree", table.merchantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchantProfile.id],
			name: "scope_in_doc_merchant_id_merchant_profile_id_fk"
		}),
]);

export const countryProcessorFeatures = pgTable("country_processor_features", {
	id: text().primaryKey().notNull(),
	processorId: text("processor_id").notNull(),
	country: text().notNull(),
	supportedMethods: jsonb("supported_methods").notNull(),
	supportsLocalInstruments: boolean("supports_local_instruments").default(false).notNull(),
	supportsPayouts: boolean("supports_payouts").default(false).notNull(),
	supportsCrypto: boolean("supports_crypto").default(false).notNull(),
	status: text().notNull(),
	notes: text(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.processorId],
			foreignColumns: [paymentProcessors.id],
			name: "country_processor_features_processor_id_payment_processors_id_f"
		}),
]);

export const paymentProcessors = pgTable("payment_processors", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	status: text().notNull(),
	supportsPayouts: boolean("supports_payouts").default(false).notNull(),
	supportsRecurring: boolean("supports_recurring").default(false).notNull(),
	supportsRefunds: boolean("supports_refunds").default(false).notNull(),
	supportsCrypto: boolean("supports_crypto").default(false).notNull(),
	productManager: text("product_manager"),
	notes: text(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const merchantProfile = pgTable("merchant_profile", {
	id: text().default(nextval(\'merchant_profile_id_seq\'::regclass)).primaryKey().notNull(),
	name: text().notNull(),
	contactEmail: text("contact_email").notNull(),
	contactName: text("contact_name"),
	lifecycleStage: text("lifecycle_stage").default('SCOPING').notNull(),
	salesOwner: text("sales_owner"),
	implementationOwner: text("implementation_owner"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("merchant_profile_contact_email_idx").using("btree", table.contactEmail.asc().nullsLast().op("text_ops")),
	index("merchant_profile_lifecycle_stage_idx").using("btree", table.lifecycleStage.asc().nullsLast().op("text_ops")),
]);

export const auditLog = pgTable("audit_log", {
	id: text().primaryKey().notNull(),
	merchantId: text("merchant_id").notNull(),
	targetTable: text("target_table").notNull(),
	targetId: text("target_id").notNull(),
	targetField: text("target_field"),
	changeType: text("change_type").notNull(),
	oldValue: jsonb("old_value"),
	newValue: jsonb("new_value"),
	actorType: text("actor_type").notNull(),
	actorId: text("actor_id"),
	sourceType: text("source_type"),
	sourceId: text("source_id"),
	reason: text(),
	aiExtractionId: text("ai_extraction_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("audit_log_actor_type_idx").using("btree", table.actorType.asc().nullsLast().op("text_ops")),
	index("audit_log_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("audit_log_merchant_id_idx").using("btree", table.merchantId.asc().nullsLast().op("text_ops")),
	index("audit_log_target_table_idx").using("btree", table.targetTable.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.aiExtractionId],
			foreignColumns: [aiExtraction.id],
			name: "audit_log_ai_extraction_id_ai_extraction_id_fk"
		}),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchantProfile.id],
			name: "audit_log_merchant_id_merchant_profile_id_fk"
		}),
]);

export const aiExtraction = pgTable("ai_extraction", {
	id: text().primaryKey().notNull(),
	inboundEventId: text("inbound_event_id").notNull(),
	merchantId: text("merchant_id").notNull(),
	targetTable: text("target_table").notNull(),
	targetField: text("target_field").notNull(),
	extractedValue: jsonb("extracted_value").notNull(),
	confidence: text().notNull(),
	reasoning: text().notNull(),
	status: text().default('PENDING').notNull(),
	appliedAt: timestamp("applied_at", { mode: 'string' }),
	reviewedBy: text("reviewed_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ai_extraction_confidence_idx").using("btree", table.confidence.asc().nullsLast().op("text_ops")),
	index("ai_extraction_inbound_event_id_idx").using("btree", table.inboundEventId.asc().nullsLast().op("text_ops")),
	index("ai_extraction_merchant_id_idx").using("btree", table.merchantId.asc().nullsLast().op("text_ops")),
	index("ai_extraction_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.inboundEventId],
			foreignColumns: [inboundEvent.id],
			name: "ai_extraction_inbound_event_id_inbound_event_id_fk"
		}),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchantProfile.id],
			name: "ai_extraction_merchant_id_merchant_profile_id_fk"
		}),
]);

export const attachment = pgTable("attachment", {
	id: text().primaryKey().notNull(),
	merchantId: text("merchant_id").notNull(),
	filename: text().notNull(),
	fileType: text("file_type").notNull(),
	fileSize: integer("file_size").notNull(),
	storageUrl: text("storage_url").notNull(),
	category: text(),
	description: text(),
	uploadedBy: text("uploaded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("attachment_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("attachment_merchant_id_idx").using("btree", table.merchantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchantProfile.id],
			name: "attachment_merchant_id_merchant_profile_id_fk"
		}),
]);
