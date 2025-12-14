import "dotenv/config";
import { db } from "../src/core/db/client";
import {
  aiExtraction,
  attachment,
  auditLog,
  countryProcessorFeatures,
  inboundEvent,
  merchantProfile,
  paymentProcessors,
  scopeInDoc,
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
    supported_methods: [
      "credit_card",
      "debit_card",
      "oxxo",
      "spei",
      "efectivo",
    ],
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

// ===========================================
// MERCHANT DATA
// ===========================================

const merchants = [
  {
    id: "rappi",
    name: "Rappi",
    contact_email: "payments@rappi.com",
    contact_name: "Sebastián Mejía",
    lifecycle_stage: "LIVE" as const,
    sales_owner: "María González",
    implementation_owner: "Carlos Ramírez",
  },
  {
    id: "indrive",
    name: "inDrive",
    contact_email: "payments@indrive.com",
    contact_name: "Arsen Tomsky",
    lifecycle_stage: "IMPLEMENTING" as const,
    sales_owner: "Ana Silva",
    implementation_owner: "Diego Fernández",
  },
  {
    id: "uber",
    name: "Uber",
    contact_email: "latam-payments@uber.com",
    contact_name: "Daniel Wilf",
    lifecycle_stage: "SCOPING" as const,
    sales_owner: "Roberto Mendoza",
    implementation_owner: null,
  },
  {
    id: "acmecorp",
    name: "Acme Corp",
    contact_email: "maria.garcia@acmecorp.com",
    contact_name: "María García",
    lifecycle_stage: "SCOPING" as const,
    sales_owner: "Juan Pérez",
    implementation_owner: null,
  },
];

const scopes = [
  {
    id: "rappi_scope",
    merchant_id: "rappi",
    psps: ["stripe", "adyen", "mercadopago"],
    psps_status: "COMPLETE" as const,
    countries: ["BR", "MX", "CO", "AR", "CL"],
    countries_status: "COMPLETE" as const,
    payment_methods: ["credit_card", "debit_card", "pix", "oxxo", "pse"],
    payment_methods_status: "COMPLETE" as const,
    expected_volume: "$50M USD/month",
    expected_volume_status: "COMPLETE" as const,
    expected_approval_rate: "85%",
    expected_approval_rate_status: "COMPLETE" as const,
    restrictions: ["No crypto payments", "PCI-DSS Level 1 required"],
    restrictions_status: "COMPLETE" as const,
    dependencies: ["Fraud detection service", "3DS authentication"],
    dependencies_status: "COMPLETE" as const,
    compliance_requirements: ["PCI-DSS", "GDPR", "LGPD"],
    compliance_status: "COMPLETE" as const,
    expected_go_live_date: new Date("2025-03-15"),
    go_live_date_status: "COMPLETE" as const,
    comes_from_mor: false,
    deal_closed_by: "María González",
    is_complete: true,
  },
  {
    id: "indrive_scope",
    merchant_id: "indrive",
    psps: ["stripe", "dlocal", "mercadopago"],
    psps_status: "COMPLETE" as const,
    countries: ["BR", "MX", "CO", "PE"],
    countries_status: "COMPLETE" as const,
    payment_methods: ["credit_card", "pix", "oxxo", "yape"],
    payment_methods_status: "COMPLETE" as const,
    expected_volume: "$35M USD/month",
    expected_volume_status: "COMPLETE" as const,
    expected_approval_rate: "88%",
    expected_approval_rate_status: "COMPLETE" as const,
    restrictions: [
      "Driver payouts required",
      "Real-time settlement for drivers",
    ],
    restrictions_status: "COMPLETE" as const,
    dependencies: ["Driver payout system", "Fraud scoring integration"],
    dependencies_status: "COMPLETE" as const,
    compliance_requirements: ["PCI-DSS", "LGPD", "Local labor regulations"],
    compliance_status: "COMPLETE" as const,
    expected_go_live_date: new Date("2025-06-01"),
    go_live_date_status: "COMPLETE" as const,
    comes_from_mor: true,
    deal_closed_by: "Ana Silva",
    is_complete: false,
  },
  {
    id: "uber_scope",
    merchant_id: "uber",
    psps: ["adyen", "stripe"],
    psps_status: "COMPLETE" as const,
    countries: ["BR", "MX", "AR", "CO", "CL"],
    countries_status: "COMPLETE" as const,
    payment_methods: ["credit_card", "debit_card", "pix"],
    payment_methods_status: "COMPLETE" as const,
    expected_volume: null,
    expected_volume_status: "MISSING" as const,
    expected_approval_rate: null,
    expected_approval_rate_status: "MISSING" as const,
    restrictions: [],
    restrictions_status: "MISSING" as const,
    dependencies: [],
    dependencies_status: "MISSING" as const,
    compliance_requirements: ["PCI-DSS"],
    compliance_status: "COMPLETE" as const,
    expected_go_live_date: null,
    go_live_date_status: "MISSING" as const,
    comes_from_mor: false,
    deal_closed_by: "Roberto Mendoza",
    is_complete: false,
  },
  {
    id: "acmecorp_scope",
    merchant_id: "acmecorp",
    psps: [],
    psps_status: "MISSING" as const,
    countries: [],
    countries_status: "MISSING" as const,
    payment_methods: [],
    payment_methods_status: "MISSING" as const,
    expected_volume: null,
    expected_volume_status: "MISSING" as const,
    expected_approval_rate: null,
    expected_approval_rate_status: "MISSING" as const,
    restrictions: [],
    restrictions_status: "MISSING" as const,
    dependencies: [],
    dependencies_status: "MISSING" as const,
    compliance_requirements: [],
    compliance_status: "MISSING" as const,
    expected_go_live_date: null,
    go_live_date_status: "MISSING" as const,
    comes_from_mor: false,
    deal_closed_by: null,
    is_complete: false,
  },
];

const events = [
  {
    id: "evt_rappi_kickoff",
    merchant_id: "rappi",
    source_type: "MEETING" as const,
    source_id: "gong_call_12345",
    raw_content: `
Meeting: Rappi Implementation Kickoff
Date: 2025-01-10
Participants: Sebastián Mejía (Rappi), Carlos Ramírez (Yuno), María González (Yuno)

Key Points:
- Rappi needs to process payments across 5 LATAM countries
- Priority countries: Brazil (PIX required), Mexico (OXXO essential), Colombia (PSE)
- Current volume: $50M USD/month, expected growth to $80M by Q3
- Must support installments for credit cards in Brazil and Argentina
- Fraud detection is critical - approval rate target is 85%
- Timeline: Go-live by March 15, 2025
- Compliance: PCI-DSS Level 1, GDPR for EU users, LGPD for Brazil
- Technical requirements: 3DS2 authentication, webhook support, real-time reporting
    `,
    metadata: {
      title: "Rappi Implementation Kickoff",
      participants: ["Sebastián Mejía", "Carlos Ramírez", "María González"],
      duration: 60,
      recorded_at: "2025-01-10T15:00:00Z",
    },
    processing_status: "PROCESSED" as const,
    processed_at: new Date("2025-01-10T16:30:00Z"),
  },
  {
    id: "evt_indrive_email",
    merchant_id: "indrive",
    source_type: "EMAIL" as const,
    source_id: "gmail_msg_67890",
    raw_content: `
From: Arsen Tomsky <arsen@indrive.com>
To: Ana Silva <ana.silva@yuno.com>
Subject: inDrive Payment Integration - Additional Requirements

Hi Ana,

Following up on our call yesterday, I wanted to clarify a few points:

1. We're coming from a Merchant of Record setup, so we need a smooth transition
2. PIX is absolutely critical for us in Brazil - it's 55% of our rider transaction volume
3. We need real-time driver payouts - this is essential for our business model
4. Expected volume: $35M USD/month across LATAM
5. Peru is growing fast - we need Yape integration there
6. We're also expanding in Mexico, need OXXO for cash payments

Let me know if you need any additional information.

Best,
Arsen
    `,
    metadata: {
      from: "arsen@indrive.com",
      to: "ana.silva@yuno.com",
      subject: "inDrive Payment Integration - Additional Requirements",
      received_at: "2025-01-12T10:23:00Z",
    },
    processing_status: "PROCESSED" as const,
    processed_at: new Date("2025-01-12T11:00:00Z"),
  },
  {
    id: "evt_uber_slack",
    merchant_id: "uber",
    source_type: "SLACK" as const,
    source_id: "slack_msg_abc123",
    raw_content: `
#sales-handoffs
Roberto Mendoza: Just closed Uber LATAM expansion deal! 
They want to consolidate their payment processing through our platform
Initial scope: BR, MX, AR, CO, CL
PSPs: They're currently on Adyen globally, open to adding Stripe for redundancy
Still need to nail down volume metrics and compliance requirements
Meeting scheduled for next week to go deeper on driver payouts
    `,
    metadata: {
      channel: "sales-handoffs",
      thread_ts: "1736683200.123456",
      author: "Roberto Mendoza",
    },
    processing_status: "PENDING" as const,
    processed_at: null,
  },
];

const extractions = [
  {
    id: "ext_rappi_countries",
    inbound_event_id: "evt_rappi_kickoff",
    merchant_id: "rappi",
    target_table: "scope_in_doc",
    target_field: "countries",
    extracted_value: { value: ["BR", "MX", "CO", "AR", "CL"] },
    confidence: "HIGH" as const,
    reasoning:
      "Explicitly mentioned 'across 5 LATAM countries' and listed Brazil, Mexico, and Colombia as priority countries. Argentina and Chile are standard in LATAM deployments.",
    status: "AUTO_APPLIED" as const,
    applied_at: new Date("2025-01-10T16:35:00Z"),
    reviewed_by: null,
  },
  {
    id: "ext_rappi_volume",
    inbound_event_id: "evt_rappi_kickoff",
    merchant_id: "rappi",
    target_table: "scope_in_doc",
    target_field: "expected_volume",
    extracted_value: { value: "$50M USD/month" },
    confidence: "HIGH" as const,
    reasoning:
      "Directly stated 'Current volume: $50M USD/month' in the meeting transcript.",
    status: "AUTO_APPLIED" as const,
    applied_at: new Date("2025-01-10T16:35:00Z"),
    reviewed_by: null,
  },
  {
    id: "ext_indrive_mor",
    inbound_event_id: "evt_indrive_email",
    merchant_id: "indrive",
    target_table: "scope_in_doc",
    target_field: "comes_from_mor",
    extracted_value: { value: true },
    confidence: "HIGH" as const,
    reasoning:
      "Email explicitly states 'We're coming from a Merchant of Record setup'.",
    status: "AUTO_APPLIED" as const,
    applied_at: new Date("2025-01-12T11:05:00Z"),
    reviewed_by: null,
  },
  {
    id: "ext_indrive_volume",
    inbound_event_id: "evt_indrive_email",
    merchant_id: "indrive",
    target_table: "scope_in_doc",
    target_field: "expected_volume",
    extracted_value: { value: "$35M USD/month" },
    confidence: "HIGH" as const,
    reasoning:
      "Email mentions 'Expected volume: $35M USD/month across LATAM'. Direct statement from merchant contact.",
    status: "AUTO_APPLIED" as const,
    applied_at: new Date("2025-01-12T11:05:00Z"),
    reviewed_by: null,
  },
  {
    id: "ext_uber_countries",
    inbound_event_id: "evt_uber_slack",
    merchant_id: "uber",
    target_table: "scope_in_doc",
    target_field: "countries",
    extracted_value: { value: ["BR", "MX", "AR", "CO", "CL"] },
    confidence: "HIGH" as const,
    reasoning:
      "Slack message clearly lists 'Initial scope: BR, MX, AR, CO, CL'.",
    status: "AUTO_APPLIED" as const,
    applied_at: new Date("2025-01-13T09:15:00Z"),
    reviewed_by: null,
  },
];

const audits = [
  {
    id: "audit_rappi_create",
    merchant_id: "rappi",
    target_table: "merchant_profile",
    target_id: "rappi",
    target_field: null,
    change_type: "CREATE" as const,
    old_value: null,
    new_value: {
      id: "rappi",
      name: "Rappi",
      lifecycle_stage: "SCOPING",
    },
    actor_type: "USER" as const,
    actor_id: "maria_gonzalez",
    source_type: "MANUAL" as const,
    source_id: null,
    reason: "New merchant onboarded from sales pipeline",
    ai_extraction_id: null,
  },
  {
    id: "audit_rappi_countries",
    merchant_id: "rappi",
    target_table: "scope_in_doc",
    target_id: "rappi_scope",
    target_field: "countries",
    change_type: "UPDATE" as const,
    old_value: [],
    new_value: ["BR", "MX", "CO", "AR", "CL"],
    actor_type: "AI" as const,
    actor_id: null,
    source_type: "MEETING" as const,
    source_id: "evt_rappi_kickoff",
    reason:
      "AI extracted country list from kickoff meeting transcript. Merchant explicitly mentioned 5 LATAM countries including Brazil, Mexico, and Colombia as priorities.",
    ai_extraction_id: "ext_rappi_countries",
  },
  {
    id: "audit_rappi_stage_implementing",
    merchant_id: "rappi",
    target_table: "merchant_profile",
    target_id: "rappi",
    target_field: "lifecycle_stage",
    change_type: "STAGE_CHANGE" as const,
    old_value: "SCOPING",
    new_value: "IMPLEMENTING",
    actor_type: "USER" as const,
    actor_id: "carlos_ramirez",
    source_type: "MANUAL" as const,
    source_id: null,
    reason:
      "Scope verified complete. All required fields validated. Promoted to implementation phase.",
    ai_extraction_id: null,
  },
  {
    id: "audit_rappi_stage_live",
    merchant_id: "rappi",
    target_table: "merchant_profile",
    target_id: "rappi",
    target_field: "lifecycle_stage",
    change_type: "STAGE_CHANGE" as const,
    old_value: "IMPLEMENTING",
    new_value: "LIVE",
    actor_type: "USER" as const,
    actor_id: "carlos_ramirez",
    source_type: "MANUAL" as const,
    source_id: null,
    reason:
      "Implementation completed successfully. All PSP integrations tested. Merchant approved for production traffic.",
    ai_extraction_id: null,
  },
  {
    id: "audit_indrive_mor",
    merchant_id: "indrive",
    target_table: "scope_in_doc",
    target_id: "indrive_scope",
    target_field: "comes_from_mor",
    change_type: "UPDATE" as const,
    old_value: false,
    new_value: true,
    actor_type: "AI" as const,
    actor_id: null,
    source_type: "EMAIL" as const,
    source_id: "evt_indrive_email",
    reason:
      "AI detected Merchant of Record origin from email. Arsen explicitly stated 'We're coming from a Merchant of Record setup' requiring smooth transition planning.",
    ai_extraction_id: "ext_indrive_mor",
  },
  {
    id: "audit_indrive_dependencies_manual",
    merchant_id: "indrive",
    target_table: "scope_in_doc",
    target_id: "indrive_scope",
    target_field: "dependencies",
    change_type: "UPDATE" as const,
    old_value: ["Driver payout system"],
    new_value: ["Driver payout system", "Fraud scoring integration"],
    actor_type: "USER" as const,
    actor_id: "diego_fernandez",
    source_type: "MANUAL" as const,
    source_id: null,
    reason:
      "Added fraud scoring as critical dependency after technical review. Required for ride-hailing fraud prevention.",
    ai_extraction_id: null,
  },
];

const attachments = [
  {
    id: "attach_rappi_contract",
    merchant_id: "rappi",
    filename: "Rappi_MSA_2025.pdf",
    file_type: "application/pdf",
    file_size: 2457600,
    storage_url: "s3://yuno-docs/rappi/contracts/msa_2025.pdf",
    category: "CONTRACT" as const,
    description: "Master Service Agreement - Signed January 2025",
    uploaded_by: "maria_gonzalez",
  },
  {
    id: "attach_rappi_tech_spec",
    merchant_id: "rappi",
    filename: "Rappi_Technical_Requirements.pdf",
    file_type: "application/pdf",
    file_size: 1048576,
    storage_url: "s3://yuno-docs/rappi/technical/requirements_v2.pdf",
    category: "TECHNICAL_DOC" as const,
    description: "API integration requirements and webhook specifications",
    uploaded_by: "carlos_ramirez",
  },
  {
    id: "attach_indrive_payout_spec",
    merchant_id: "indrive",
    filename: "inDrive_Payout_Requirements.pdf",
    file_type: "application/pdf",
    file_size: 3145728,
    storage_url: "s3://yuno-docs/indrive/technical/payout_requirements.pdf",
    category: "TECHNICAL_DOC" as const,
    description: "Driver payout system requirements and SLA specifications",
    uploaded_by: "ana_silva",
  },
];

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // ==========================================
    // 1. PAYMENT PROCESSORS & COUNTRY FEATURES
    // ==========================================
    console.log("\n📦 Inserting payment processors...");
    for (const processor of processors) {
      await db
        .insert(paymentProcessors)
        .values(processor)
        .onConflictDoNothing();
    }
    console.log(`✅ Inserted ${processors.length} payment processors`);

    console.log("🌍 Inserting country-specific features...");
    for (const feature of countryFeatures) {
      await db
        .insert(countryProcessorFeatures)
        .values(feature)
        .onConflictDoNothing();
    }
    console.log(`✅ Inserted ${countryFeatures.length} country features`);

    // ==========================================
    // 2. MERCHANTS
    // ==========================================
    console.log("\n🏢 Inserting merchants...");
    for (const merchant of merchants) {
      await db.insert(merchantProfile).values(merchant).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${merchants.length} merchants`);

    // ==========================================
    // 3. SCOPE IN DOC
    // ==========================================
    console.log("📋 Inserting scope in doc...");
    for (const scope of scopes) {
      await db.insert(scopeInDoc).values(scope).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${scopes.length} scopes`);

    // ==========================================
    // 4. INBOUND EVENTS
    // ==========================================
    console.log("📥 Inserting inbound events...");
    for (const event of events) {
      await db.insert(inboundEvent).values(event).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${events.length} inbound events`);

    // ==========================================
    // 5. AI EXTRACTIONS
    // ==========================================
    console.log("🤖 Inserting AI extractions...");
    for (const extraction of extractions) {
      await db.insert(aiExtraction).values(extraction).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${extractions.length} AI extractions`);

    // ==========================================
    // 6. AUDIT LOG
    // ==========================================
    console.log("📝 Inserting audit log entries...");
    for (const audit of audits) {
      await db.insert(auditLog).values(audit).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${audits.length} audit log entries`);

    // ==========================================
    // 7. ATTACHMENTS
    // ==========================================
    console.log("📎 Inserting attachments...");
    for (const attach of attachments) {
      await db.insert(attachment).values(attach).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${attachments.length} attachments`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📊 SUMMARY");
    console.log("═══════════════════════════════════════");

    console.log("\n💳 Payment Infrastructure:");
    console.log(`   • ${processors.length} payment processors`);
    console.log(`   • ${countryFeatures.length} country features`);
    console.log(`   • Countries: BR, MX, CO, AR, CL, US, PE`);
    console.log("   • Status breakdown:");
    console.log(
      `     - LIVE: ${processors.filter((p) => p.status === "LIVE").length}`,
    );
    console.log(
      `     - IN_PROGRESS: ${processors.filter((p) => p.status === "IN_PROGRESS").length}`,
    );
    console.log(
      `     - NOT_SUPPORTED: ${processors.filter((p) => p.status === "NOT_SUPPORTED").length}`,
    );

    console.log("\n🏢 Merchants:");
    console.log(`   • ${merchants.length} total merchants`);
    console.log("   • Lifecycle stages:");
    console.log(
      `     - LIVE: ${merchants.filter((m) => m.lifecycle_stage === "LIVE").length} (${merchants
        .filter((m) => m.lifecycle_stage === "LIVE")
        .map((m) => m.name)
        .join(", ")})`,
    );
    console.log(
      `     - IMPLEMENTING: ${merchants.filter((m) => m.lifecycle_stage === "IMPLEMENTING").length} (${merchants
        .filter((m) => m.lifecycle_stage === "IMPLEMENTING")
        .map((m) => m.name)
        .join(", ")})`,
    );
    console.log(
      `     - SCOPING: ${merchants.filter((m) => m.lifecycle_stage === "SCOPING").length} (${merchants
        .filter((m) => m.lifecycle_stage === "SCOPING")
        .map((m) => m.name)
        .join(", ")})`,
    );

    console.log("\n📋 Scope Completeness:");
    console.log(`   • Complete: ${scopes.filter((s) => s.is_complete).length}`);
    console.log(
      `   • Incomplete: ${scopes.filter((s) => !s.is_complete).length}`,
    );

    console.log("\n📥 Data Ingestion:");
    console.log(`   • ${events.length} inbound events`);
    console.log("   • Sources:");
    console.log(
      `     - MEETING: ${events.filter((e) => e.source_type === "MEETING").length}`,
    );
    console.log(
      `     - EMAIL: ${events.filter((e) => e.source_type === "EMAIL").length}`,
    );
    console.log(
      `     - SLACK: ${events.filter((e) => e.source_type === "SLACK").length}`,
    );

    console.log("\n🤖 AI Activity:");
    console.log(`   • ${extractions.length} AI extractions`);
    console.log(
      `   • ${extractions.filter((e) => e.status === "AUTO_APPLIED").length} auto-applied changes`,
    );
    console.log("   • High confidence extractions:");
    console.log(
      `     ${extractions.filter((e) => e.confidence === "HIGH").length}/${extractions.length}`,
    );

    console.log("\n📝 Audit Trail:");
    console.log(`   • ${audits.length} audit log entries`);
    console.log("   • Actor breakdown:");
    console.log(
      `     - AI: ${audits.filter((a) => a.actor_type === "AI").length}`,
    );
    console.log(
      `     - USER: ${audits.filter((a) => a.actor_type === "USER").length}`,
    );

    console.log("\n📎 Attachments:");
    console.log(`   • ${attachments.length} files`);
    console.log("   • Categories:");
    console.log(
      `     - CONTRACT: ${attachments.filter((a) => a.category === "CONTRACT").length}`,
    );
    console.log(
      `     - TECHNICAL_DOC: ${attachments.filter((a) => a.category === "TECHNICAL_DOC").length}`,
    );

    console.log("\n═══════════════════════════════════════");
    console.log("✨ Ready to go! Run your dev server.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
