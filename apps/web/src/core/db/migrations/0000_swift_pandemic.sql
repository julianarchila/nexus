-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "inbound_event" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"raw_content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"processing_status" text DEFAULT 'PENDING' NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scope_in_doc" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"psps" jsonb DEFAULT '[]'::jsonb,
	"psps_status" text DEFAULT 'MISSING' NOT NULL,
	"countries" jsonb DEFAULT '[]'::jsonb,
	"countries_status" text DEFAULT 'MISSING' NOT NULL,
	"payment_methods" jsonb DEFAULT '[]'::jsonb,
	"payment_methods_status" text DEFAULT 'MISSING' NOT NULL,
	"expected_volume" text,
	"expected_volume_status" text DEFAULT 'MISSING' NOT NULL,
	"expected_approval_rate" text,
	"expected_approval_rate_status" text DEFAULT 'MISSING' NOT NULL,
	"restrictions" jsonb DEFAULT '[]'::jsonb,
	"restrictions_status" text DEFAULT 'MISSING' NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb,
	"dependencies_status" text DEFAULT 'MISSING' NOT NULL,
	"compliance_requirements" jsonb DEFAULT '[]'::jsonb,
	"compliance_status" text DEFAULT 'MISSING' NOT NULL,
	"expected_go_live_date" timestamp,
	"go_live_date_status" text DEFAULT 'MISSING' NOT NULL,
	"comes_from_mor" boolean DEFAULT false NOT NULL,
	"deal_closed_by" text,
	"is_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "country_processor_features" (
	"id" text PRIMARY KEY NOT NULL,
	"processor_id" text NOT NULL,
	"country" text NOT NULL,
	"supported_methods" jsonb NOT NULL,
	"supports_local_instruments" boolean DEFAULT false NOT NULL,
	"supports_payouts" boolean DEFAULT false NOT NULL,
	"supports_crypto" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_processors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"supports_payouts" boolean DEFAULT false NOT NULL,
	"supports_recurring" boolean DEFAULT false NOT NULL,
	"supports_refunds" boolean DEFAULT false NOT NULL,
	"supports_crypto" boolean DEFAULT false NOT NULL,
	"product_manager" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_profile" (
	"id" text PRIMARY KEY DEFAULT nextval('merchant_profile_id_seq'::regclass) NOT NULL,
	"name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_name" text,
	"lifecycle_stage" text DEFAULT 'SCOPING' NOT NULL,
	"sales_owner" text,
	"implementation_owner" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"target_table" text NOT NULL,
	"target_id" text NOT NULL,
	"target_field" text,
	"change_type" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"source_type" text,
	"source_id" text,
	"reason" text,
	"ai_extraction_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_extraction" (
	"id" text PRIMARY KEY NOT NULL,
	"inbound_event_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"target_table" text NOT NULL,
	"target_field" text NOT NULL,
	"extracted_value" jsonb NOT NULL,
	"confidence" text NOT NULL,
	"reasoning" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"applied_at" timestamp,
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"filename" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"storage_url" text NOT NULL,
	"category" text,
	"description" text,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inbound_event" ADD CONSTRAINT "inbound_event_merchant_id_merchant_profile_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scope_in_doc" ADD CONSTRAINT "scope_in_doc_merchant_id_merchant_profile_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_processor_features" ADD CONSTRAINT "country_processor_features_processor_id_payment_processors_id_f" FOREIGN KEY ("processor_id") REFERENCES "public"."payment_processors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_ai_extraction_id_ai_extraction_id_fk" FOREIGN KEY ("ai_extraction_id") REFERENCES "public"."ai_extraction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_merchant_id_merchant_profile_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction" ADD CONSTRAINT "ai_extraction_inbound_event_id_inbound_event_id_fk" FOREIGN KEY ("inbound_event_id") REFERENCES "public"."inbound_event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction" ADD CONSTRAINT "ai_extraction_merchant_id_merchant_profile_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_merchant_id_merchant_profile_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inbound_event_created_at_idx" ON "inbound_event" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "inbound_event_merchant_id_idx" ON "inbound_event" USING btree ("merchant_id" text_ops);--> statement-breakpoint
CREATE INDEX "inbound_event_processing_status_idx" ON "inbound_event" USING btree ("processing_status" text_ops);--> statement-breakpoint
CREATE INDEX "inbound_event_source_type_idx" ON "inbound_event" USING btree ("source_type" text_ops);--> statement-breakpoint
CREATE INDEX "scope_in_doc_is_complete_idx" ON "scope_in_doc" USING btree ("is_complete" bool_ops);--> statement-breakpoint
CREATE INDEX "scope_in_doc_merchant_id_idx" ON "scope_in_doc" USING btree ("merchant_id" text_ops);--> statement-breakpoint
CREATE INDEX "merchant_profile_contact_email_idx" ON "merchant_profile" USING btree ("contact_email" text_ops);--> statement-breakpoint
CREATE INDEX "merchant_profile_lifecycle_stage_idx" ON "merchant_profile" USING btree ("lifecycle_stage" text_ops);--> statement-breakpoint
CREATE INDEX "audit_log_actor_type_idx" ON "audit_log" USING btree ("actor_type" text_ops);--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "audit_log_merchant_id_idx" ON "audit_log" USING btree ("merchant_id" text_ops);--> statement-breakpoint
CREATE INDEX "audit_log_target_table_idx" ON "audit_log" USING btree ("target_table" text_ops);--> statement-breakpoint
CREATE INDEX "ai_extraction_confidence_idx" ON "ai_extraction" USING btree ("confidence" text_ops);--> statement-breakpoint
CREATE INDEX "ai_extraction_inbound_event_id_idx" ON "ai_extraction" USING btree ("inbound_event_id" text_ops);--> statement-breakpoint
CREATE INDEX "ai_extraction_merchant_id_idx" ON "ai_extraction" USING btree ("merchant_id" text_ops);--> statement-breakpoint
CREATE INDEX "ai_extraction_status_idx" ON "ai_extraction" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "attachment_category_idx" ON "attachment" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "attachment_merchant_id_idx" ON "attachment" USING btree ("merchant_id" text_ops);
*/