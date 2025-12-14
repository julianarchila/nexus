import {
  pgTable,
  text,
  boolean,
  jsonb,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Types for JSONB fields
export type MerchantIntegrations = {
  psps: string[];
  countries: string[];
  paymentMethods: string[];
};

// 🧾 Tabla principal de procesadores de pagos
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

//  Capacidades por país (verdad operativa)
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

export const merchant_profile = pgTable("merchant_profile", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),
  contact_email: text("contact_email").notNull().unique(),

  status: text("status").notNull(), //
});

export const scope_in_doc_info = pgTable("scope_in_doc_info", {
  id: serial("id").primaryKey(),
  merchant_profile_id: serial("merchant_profile_id").references(
    () => merchant_profile.id,
  ),

  integrations: jsonb("integrations").$type<MerchantIntegrations>().default({
    psps: [],
    countries: [],
    paymentMethods: [],
  }),
  volume_metrics: text("volume_metrics"),
  aproval_rate: text("aproval_rate"),
  comes_from_mof: boolean("comes_from_mof").notNull().default(false),
  deal_closed_by: text("deal_closed_by"),
});

// Relations
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

export const merchantProfileRelations = relations(
  merchant_profile,
  ({ many }) => ({
    scopeInDocInfos: many(scope_in_doc_info),
  }),
);

export const scopeInDocInfoRelations = relations(
  scope_in_doc_info,
  ({ one }) => ({
    merchantProfile: one(merchant_profile, {
      fields: [scope_in_doc_info.merchant_profile_id],
      references: [merchant_profile.id],
    }),
  }),
);
