import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  paymentProcessors,
  countryProcessorFeatures,
  merchant_profile,
  scope_in_doc_info,
} from "../src/core/db/schema";

const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
    ssl: true,
  },
});

// Realistic payment processors
const processors = [
  {
    id: "stripe",
    name: "Stripe",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Sarah Chen",
    notes: "Primary processor for US and EU markets",
  },
  {
    id: "adyen",
    name: "Adyen",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Marcus Johnson",
    notes: "Enterprise-level processor with global reach",
  },
  {
    id: "mercadopago",
    name: "Mercado Pago",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Ana Rodriguez",
    notes: "Leading processor in LATAM region",
  },
  {
    id: "paypal",
    name: "PayPal",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: true,
    product_manager: "David Kim",
    notes: "Global payment platform with crypto support",
  },
  {
    id: "payu",
    name: "PayU",
    status: "IN_PROGRESS",
    supports_payouts: true,
    supports_recurring: false,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Carlos Mendez",
    notes: "Expanding LATAM coverage",
  },
  {
    id: "dlocal",
    name: "dLocal",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Laura Silva",
    notes: "Emerging markets specialist",
  },
  {
    id: "checkout",
    name: "Checkout.com",
    status: "IN_PROGRESS",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "James Wilson",
    notes: "Integration in progress for EU expansion",
  },
  {
    id: "worldpay",
    name: "Worldpay",
    status: "DEPRECATED",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: null,
    notes: "Legacy integration - migrating to Adyen",
  },
];

// Country-specific features
const countryFeatures = [
  // Stripe
  {
    id: "stripe-us",
    processor_id: "stripe",
    country: "US",
    supported_methods: [
      "credit_card",
      "debit_card",
      "ach",
      "apple_pay",
      "google_pay",
    ],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  {
    id: "stripe-br",
    processor_id: "stripe",
    country: "BR",
    supported_methods: ["credit_card", "boleto", "pix"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  {
    id: "stripe-mx",
    processor_id: "stripe",
    country: "MX",
    supported_methods: ["credit_card", "oxxo", "spei"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  // Mercado Pago
  {
    id: "mercadopago-br",
    processor_id: "mercadopago",
    country: "BR",
    supported_methods: ["credit_card", "boleto", "pix", "mercado_credito"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  {
    id: "mercadopago-ar",
    processor_id: "mercadopago",
    country: "AR",
    supported_methods: [
      "credit_card",
      "rapipago",
      "pagofacil",
      "mercado_credito",
    ],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  {
    id: "mercadopago-mx",
    processor_id: "mercadopago",
    country: "MX",
    supported_methods: ["credit_card", "oxxo", "spei", "mercado_credito"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  // Adyen
  {
    id: "adyen-us",
    processor_id: "adyen",
    country: "US",
    supported_methods: [
      "credit_card",
      "debit_card",
      "ach",
      "apple_pay",
      "google_pay",
    ],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  {
    id: "adyen-de",
    processor_id: "adyen",
    country: "DE",
    supported_methods: ["credit_card", "sepa", "giropay", "sofort"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  {
    id: "adyen-nl",
    processor_id: "adyen",
    country: "NL",
    supported_methods: ["credit_card", "ideal", "sepa"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  // dLocal
  {
    id: "dlocal-co",
    processor_id: "dlocal",
    country: "CO",
    supported_methods: ["credit_card", "pse", "efecty", "baloto"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  {
    id: "dlocal-cl",
    processor_id: "dlocal",
    country: "CL",
    supported_methods: ["credit_card", "webpay", "servipag", "multicaja"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
  },
  {
    id: "dlocal-pe",
    processor_id: "dlocal",
    country: "PE",
    supported_methods: ["credit_card", "pagoefectivo", "safetypay"],
    supports_local_instruments: true,
    supports_payouts: false,
    supports_crypto: false,
    status: "IN_PROGRESS",
  },
];

// Realistic merchant profiles
const merchants = [
  { name: "TechFlow SaaS", status: "active" },
  { name: "Rappi", status: "active" },
  { name: "Nubank", status: "active" },
  { name: "iFood", status: "active" },
  { name: "Kavak", status: "active" },
  { name: "Clip", status: "active" },
  { name: "Ualá", status: "active" },
  { name: "Loft", status: "active" },
  { name: "QuintoAndar", status: "active" },
  { name: "Gympass", status: "active" },
  { name: "Wildlife Studios", status: "active" },
  { name: "Creditas", status: "pending" },
  { name: "Olist", status: "active" },
  { name: "VTEX", status: "active" },
  { name: "Nuvemshop", status: "inactive" },
];

const salesReps = [
  "Maria Garcia",
  "Juan Martinez",
  "Pedro Silva",
  "Ana Costa",
  "Carlos Lopez",
  "Sofia Hernandez",
];

const volumeMetrics = [
  "$1M-5M monthly",
  "$5M-10M monthly",
  "$10M-50M monthly",
  "$50M-100M monthly",
  "$100M+ monthly",
];

const approvalRates = ["92%", "94%", "95%", "96%", "97%", "98%"];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log("Seeding database...\n");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(scope_in_doc_info);
  await db.delete(merchant_profile);
  await db.delete(countryProcessorFeatures);
  await db.delete(paymentProcessors);

  // Insert payment processors
  console.log("Inserting payment processors...");
  await db.insert(paymentProcessors).values(processors);
  console.log(`  ✓ ${processors.length} payment processors`);

  // Insert country features
  console.log("Inserting country processor features...");
  await db.insert(countryProcessorFeatures).values(countryFeatures);
  console.log(`  ✓ ${countryFeatures.length} country features`);

  // Insert merchants
  console.log("Inserting merchants...");
  const insertedMerchants = await db
    .insert(merchant_profile)
    .values(merchants)
    .returning();
  console.log(`  ✓ ${insertedMerchants.length} merchants`);

  // Insert scope_in_doc_info for each merchant
  console.log("Inserting scope documents...");
  const scopeDocs = insertedMerchants.map((merchant) => ({
    merchant_profile_id: merchant.id,
    integrations: {
      processors: [randomElement(processors).id, randomElement(processors).id],
      countries: ["BR", "MX", "CO"].slice(0, Math.floor(Math.random() * 3) + 1),
    },
    volume_metrics: randomElement(volumeMetrics),
    aproval_rate: randomElement(approvalRates),
    comes_from_mof: Math.random() > 0.7,
    deal_closed_by: randomElement(salesReps),
  }));

  await db.insert(scope_in_doc_info).values(scopeDocs);
  console.log(`  ✓ ${scopeDocs.length} scope documents`);

  console.log("\n✅ Database seeded successfully!");
}

seed()
  .catch((err) => {
    console.error("Error seeding database:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
