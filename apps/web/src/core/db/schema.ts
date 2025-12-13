import { pgTable, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

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

// 📍 Capacidades por país (verdad operativa)
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
