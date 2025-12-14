import "dotenv/config";
import { db } from "../src/core/db/client";
import {
  paymentProcessors,
  countryProcessorFeatures,
} from "../src/core/db/schema";

// Datos realistas de procesadores de pago principales en LATAM
const processors = [
  {
    id: "stripe",
    name: "Stripe",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "María González",
    notes: "Líder global en pagos, excelente documentación y soporte API",
    metadata: { api_version: "2024-11-20", webhook_version: "v1" },
  },
  {
    id: "adyen",
    name: "Adyen",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Carlos Ramírez",
    notes: "Fuerte presencia en Europa y LATAM, procesamiento global",
    metadata: { api_version: "v70", compliance_level: "PCI-DSS Level 1" },
  },
  {
    id: "mercadopago",
    name: "Mercado Pago",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Ana Silva",
    notes: "Dominante en LATAM, excelente para métodos de pago locales",
    metadata: { ecosystem: "mercadolibre", region: "LATAM" },
  },
  {
    id: "paypal",
    name: "PayPal",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: true,
    product_manager: "Roberto Mendoza",
    notes: "Alto reconocimiento de marca, 400M+ usuarios activos",
    metadata: { crypto_enabled: true, venmo_integrated: true },
  },
  {
    id: "payu",
    name: "PayU",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Laura Torres",
    notes: "Especializado en mercados emergentes, fuerte en LATAM",
    metadata: { parent_company: "Prosus", focus: "emerging_markets" },
  },
  {
    id: "dlocal",
    name: "dLocal",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Diego Fernández",
    notes: "Especialista en pagos locales en mercados emergentes",
    metadata: { focus: "cross_border", markets: "29+" },
  },
  {
    id: "kushki",
    name: "Kushki",
    status: "LIVE",
    supports_payouts: false,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Sofía Morales",
    notes: "Gateway de pagos regional, fuerte presencia en Andina",
    metadata: { region: "Andean", founded: "2016" },
  },
  {
    id: "conekta",
    name: "Conekta",
    status: "LIVE",
    supports_payouts: false,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Miguel Ángel Ruiz",
    notes: "Líder en México, excelente para OXXO y SPEI",
    metadata: { country: "Mexico", speciality: "cash_payments" },
  },
  {
    id: "ebanx",
    name: "EBANX",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Patricia Lima",
    notes: "Especializado en conectar comercio global con LATAM",
    metadata: { focus: "cross_border", boleto_bancario: true },
  },
  {
    id: "pagseguro",
    name: "PagSeguro",
    status: "LIVE",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Bruno Santos",
    notes: "Líder en Brasil, parte del ecosistema UOL",
    metadata: { country: "Brazil", parent: "PagSeguro Digital" },
  },
  {
    id: "coinbase_commerce",
    name: "Coinbase Commerce",
    status: "IN_PROGRESS",
    supports_payouts: false,
    supports_recurring: false,
    supports_refunds: false,
    supports_crypto: true,
    product_manager: "Andrés Castro",
    notes: "Integración de pagos con criptomonedas en desarrollo",
    metadata: { crypto_only: true, currencies: ["BTC", "ETH", "USDC"] },
  },
  {
    id: "payoneer",
    name: "Payoneer",
    status: "IN_PROGRESS",
    supports_payouts: true,
    supports_recurring: false,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: "Lucía Herrera",
    notes: "Enfocado en pagos B2B y freelancers internacionales",
    metadata: { focus: "B2B", cross_border: true },
  },
  {
    id: "worldpay",
    name: "Worldpay",
    status: "NOT_SUPPORTED",
    supports_payouts: true,
    supports_recurring: true,
    supports_refunds: true,
    supports_crypto: false,
    product_manager: null,
    notes: "Evaluando integración para mercado enterprise",
    metadata: { parent: "FIS", market: "enterprise" },
  },
];

// Métodos de pago por país
const countryFeatures = [
  // Brasil - Stripe
  {
    id: "stripe_br",
    processor_id: "stripe",
    country: "BR",
    supported_methods: ["credit_card", "debit_card", "pix", "boleto_bancario"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "PIX disponible desde 2021, procesamiento local",
    metadata: { pix_instant: true, boleto_expiry_days: 3 },
  },
  // México - Stripe
  {
    id: "stripe_mx",
    processor_id: "stripe",
    country: "MX",
    supported_methods: ["credit_card", "debit_card", "oxxo", "spei"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "OXXO y SPEI con excelente tasa de conversión",
    metadata: { oxxo_expiry_hours: 48, spei_instant: true },
  },
  // Colombia - Stripe
  {
    id: "stripe_co",
    processor_id: "stripe",
    country: "CO",
    supported_methods: ["credit_card", "debit_card", "pse", "efecty"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "PSE es el método preferido para transferencias bancarias",
    metadata: { pse_banks: 20, efecty_locations: 5000 },
  },
  // Argentina - Stripe
  {
    id: "stripe_ar",
    processor_id: "stripe",
    country: "AR",
    supported_methods: ["credit_card", "debit_card", "rapipago", "pagofacil"],
    supports_local_instruments: true,
    supports_payouts: false,
    supports_crypto: false,
    status: "IN_PROGRESS",
    notes: "Desafíos regulatorios con pagos salientes",
    metadata: { local_currency: "ARS", fx_volatility: "high" },
  },
  // Chile - Stripe
  {
    id: "stripe_cl",
    processor_id: "stripe",
    country: "CL",
    supported_methods: ["credit_card", "debit_card", "webpay"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Webpay es el estándar nacional",
    metadata: { webpay_version: "3.0", local_processing: true },
  },
  // Brasil - Mercado Pago
  {
    id: "mercadopago_br",
    processor_id: "mercadopago",
    country: "BR",
    supported_methods: [
      "credit_card",
      "debit_card",
      "pix",
      "boleto_bancario",
      "mercado_credito",
    ],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Líder de mercado con 40M+ usuarios en Brasil",
    metadata: { market_share: "high", installments: 12 },
  },
  // México - Mercado Pago
  {
    id: "mercadopago_mx",
    processor_id: "mercadopago",
    country: "MX",
    supported_methods: ["credit_card", "debit_card", "oxxo", "spei", "efectivo"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Red extensa de puntos de pago en efectivo",
    metadata: { cash_network: "extensive", marketplace_integrated: true },
  },
  // Argentina - Mercado Pago
  {
    id: "mercadopago_ar",
    processor_id: "mercadopago",
    country: "AR",
    supported_methods: [
      "credit_card",
      "debit_card",
      "rapipago",
      "pagofacil",
      "mercado_credito",
    ],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Líder absoluto del mercado argentino",
    metadata: { market_leader: true, installments: 18 },
  },
  // Colombia - Mercado Pago
  {
    id: "mercadopago_co",
    processor_id: "mercadopago",
    country: "CO",
    supported_methods: ["credit_card", "debit_card", "pse", "efecty"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Crecimiento acelerado en mercado colombiano",
    metadata: { growth_rate: "high", bank_partnerships: 15 },
  },
  // Brasil - Adyen
  {
    id: "adyen_br",
    processor_id: "adyen",
    country: "BR",
    supported_methods: ["credit_card", "debit_card", "pix", "boleto_bancario"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Procesamiento unificado global + local",
    metadata: { unified_commerce: true, split_payments: true },
  },
  // México - Adyen
  {
    id: "adyen_mx",
    processor_id: "adyen",
    country: "MX",
    supported_methods: ["credit_card", "debit_card", "oxxo", "spei"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Preferido por empresas enterprise y multinacionales",
    metadata: { enterprise_focus: true, fraud_protection: "advanced" },
  },
  // Estados Unidos - Stripe
  {
    id: "stripe_us",
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
    notes: "Mercado principal con todas las funcionalidades",
    metadata: { instant_payouts: true, treasury_enabled: true },
  },
  // Estados Unidos - PayPal
  {
    id: "paypal_us",
    processor_id: "paypal",
    country: "US",
    supported_methods: [
      "paypal_balance",
      "credit_card",
      "debit_card",
      "venmo",
      "crypto",
    ],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: true,
    status: "LIVE",
    notes: "Mayor penetración de mercado, pagos con crypto habilitados",
    metadata: { venmo_integrated: true, bnpl_available: true },
  },
  // Brasil - PayU
  {
    id: "payu_br",
    processor_id: "payu",
    country: "BR",
    supported_methods: ["credit_card", "debit_card", "pix", "boleto_bancario"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Fuerte en e-commerce mid-market",
    metadata: { installments: 12, anti_fraud: "proprietary" },
  },
  // México - Conekta
  {
    id: "conekta_mx",
    processor_id: "conekta",
    country: "MX",
    supported_methods: [
      "credit_card",
      "debit_card",
      "oxxo",
      "spei",
      "seven_eleven",
    ],
    supports_local_instruments: true,
    supports_payouts: false,
    supports_crypto: false,
    status: "LIVE",
    notes: "Mejor integración de OXXO del mercado",
    metadata: { oxxo_barcode: true, same_day_settlement: true },
  },
  // Brasil - EBANX
  {
    id: "ebanx_br",
    processor_id: "ebanx",
    country: "BR",
    supported_methods: [
      "credit_card",
      "debit_card",
      "pix",
      "boleto_bancario",
      "wallet",
    ],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Especialista en conectar global merchants con Brasil",
    metadata: { cross_border: true, fx_optimization: true },
  },
  // Brasil - PagSeguro
  {
    id: "pagseguro_br",
    processor_id: "pagseguro",
    country: "BR",
    supported_methods: [
      "credit_card",
      "debit_card",
      "pix",
      "boleto_bancario",
      "saldo_pagseguro",
    ],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Integrado con el ecosistema UOL, fuerte en SMB",
    metadata: { pos_terminals: true, marketplace: true },
  },
  // Perú - dLocal
  {
    id: "dlocal_pe",
    processor_id: "dlocal",
    country: "PE",
    supported_methods: ["credit_card", "debit_card", "pagoefectivo", "yape"],
    supports_local_instruments: true,
    supports_payouts: true,
    supports_crypto: false,
    status: "LIVE",
    notes: "Yape está revolucionando pagos en Perú",
    metadata: { yape_qr: true, instant_transfers: true },
  },
  // Colombia - Kushki
  {
    id: "kushki_co",
    processor_id: "kushki",
    country: "CO",
    supported_methods: ["credit_card", "debit_card", "pse", "nequi"],
    supports_local_instruments: true,
    supports_payouts: false,
    supports_crypto: false,
    status: "LIVE",
    notes: "Nequi integration es clave para millennials",
    metadata: { nequi_instant: true, tokenization: true },
  },
  // Global - Coinbase Commerce
  {
    id: "coinbase_global",
    processor_id: "coinbase_commerce",
    country: "US",
    supported_methods: ["bitcoin", "ethereum", "usdc", "dai"],
    supports_local_instruments: false,
    supports_payouts: false,
    supports_crypto: true,
    status: "IN_PROGRESS",
    notes: "Pagos crypto sin intermediarios bancarios",
    metadata: { blockchain_native: true, no_chargebacks: true },
  },
];

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // Insertar procesadores
    console.log("📦 Inserting payment processors...");
    for (const processor of processors) {
      await db.insert(paymentProcessors).values(processor).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${processors.length} payment processors`);

    // Insertar características por país
    console.log("🌍 Inserting country-specific features...");
    for (const feature of countryFeatures) {
      await db
        .insert(countryProcessorFeatures)
        .values(feature)
        .onConflictDoNothing();
    }
    console.log(`✅ Inserted ${countryFeatures.length} country features`);

    console.log("🎉 Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${processors.length} payment processors`);
    console.log(`   - ${countryFeatures.length} country features`);
    console.log(
      `   - Countries covered: BR, MX, CO, AR, CL, US, PE`
    );
    console.log(`   - Status breakdown:`);
    console.log(
      `     • LIVE: ${processors.filter((p) => p.status === "LIVE").length}`
    );
    console.log(
      `     • IN_PROGRESS: ${processors.filter((p) => p.status === "IN_PROGRESS").length}`
    );
    console.log(
      `     • NOT_SUPPORTED: ${processors.filter((p) => p.status === "NOT_SUPPORTED").length}`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
