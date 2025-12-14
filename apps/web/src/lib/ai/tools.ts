// @ts-nocheck - AI SDK v5 tool() has typing issues with execute function parameters
import { z } from "zod";
import { tool } from "ai";
import { db } from "@/core/db/client";
import {
  merchantProfile,
  scopeInDoc,
  inboundEvent,
  aiExtraction,
  auditLog,
  attachment,
  paymentProcessors,
  countryProcessorFeatures,
  merchantPspImplementation,
  merchantPaymentMethodImplementation,
  stageTransition,
} from "@/core/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * AI Tools for querying the database
 * Each tool represents a specific database query capability
 */

// AI SDK v5 tool() doesn't properly type execute params, using any with runtime validation via Zod
export const aiTools = {
  getMerchants: tool({
    description:
      "Get a list of merchants. Can filter by lifecycle stage (SCOPING, IMPLEMENTING, LIVE), sales owner, or search by name/email.",
    parameters: z.object({
      lifecycleStage: z
        .enum(["SCOPING", "IMPLEMENTING", "LIVE"])
        .optional()
        .describe("Filter by lifecycle stage"),
      salesOwner: z
        .string()
        .optional()
        .describe("Filter by sales owner name"),
      searchTerm: z
        .string()
        .optional()
        .describe("Search in merchant name or email"),
      limit: z
        .number()
        .default(50)
        .describe("Maximum number of results to return"),
    }),
    execute: async (params: any) => {
      const { lifecycleStage, salesOwner, searchTerm, limit } = params;
      
      let query = db
        .select({
          id: merchantProfile.id,
          name: merchantProfile.name,
          contact_email: merchantProfile.contact_email,
          contact_name: merchantProfile.contact_name,
          lifecycle_stage: merchantProfile.lifecycle_stage,
          sales_owner: merchantProfile.sales_owner,
          implementation_owner: merchantProfile.implementation_owner,
          created_at: merchantProfile.created_at,
          scope_is_complete: scopeInDoc.is_complete,
        })
        .from(merchantProfile)
        .leftJoin(scopeInDoc, eq(merchantProfile.id, scopeInDoc.merchant_id))
        .limit(limit);

      const conditions = [];
      
      if (lifecycleStage) {
        conditions.push(eq(merchantProfile.lifecycle_stage, lifecycleStage));
      }
      
      if (salesOwner) {
        conditions.push(eq(merchantProfile.sales_owner, salesOwner));
      }
      
      if (searchTerm) {
        conditions.push(
          sql`(${merchantProfile.name} ILIKE ${`%${searchTerm}%`} OR ${merchantProfile.contact_email} ILIKE ${`%${searchTerm}%`})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const merchants = await query;
      return {
        count: merchants.length,
        merchants: merchants.map(m => ({
          ...m,
          created_at: m.created_at?.toISOString(),
        })),
      };
    },
  }),

  getMerchantById: tool({
    description:
      "Get detailed information about a specific merchant including their scope, implementation status, and recent activity.",
    parameters: z.object({
      merchantId: z.string().describe("The merchant ID to look up"),
    }),
    execute: async (params: any) => {
      const { merchantId } = params;
      
      const merchant = await db
        .select()
        .from(merchantProfile)
        .where(eq(merchantProfile.id, merchantId))
        .limit(1);

      if (merchant.length === 0) {
        return { error: "Merchant not found" };
      }

      const scope = await db
        .select()
        .from(scopeInDoc)
        .where(eq(scopeInDoc.merchant_id, merchantId))
        .limit(1);

      const pspImplementations = await db
        .select()
        .from(merchantPspImplementation)
        .where(eq(merchantPspImplementation.merchant_id, merchantId));

      const paymentMethodImplementations = await db
        .select()
        .from(merchantPaymentMethodImplementation)
        .where(eq(merchantPaymentMethodImplementation.merchant_id, merchantId));

      return {
        merchant: {
          ...merchant[0],
          created_at: merchant[0].created_at.toISOString(),
          updated_at: merchant[0].updated_at.toISOString(),
        },
        scope: scope[0] || null,
        pspImplementations,
        paymentMethodImplementations,
      };
    },
  }),

  getScopeInDoc: tool({
    description:
      "Get implementation readiness and scope information for merchants. Shows what PSPs, countries, payment methods are configured and their completion status.",
    parameters: z.object({
      merchantId: z
        .string()
        .optional()
        .describe("Get scope for specific merchant"),
      onlyIncomplete: z
        .boolean()
        .default(false)
        .describe("Only return merchants with incomplete scopes"),
    }),
    execute: async (params: any) => {
      const { merchantId, onlyIncomplete } = params;
      
      let query = db
        .select({
          id: scopeInDoc.id,
          merchant_id: scopeInDoc.merchant_id,
          merchant_name: merchantProfile.name,
          psps: scopeInDoc.psps,
          psps_status: scopeInDoc.psps_status,
          countries: scopeInDoc.countries,
          countries_status: scopeInDoc.countries_status,
          payment_methods: scopeInDoc.payment_methods,
          payment_methods_status: scopeInDoc.payment_methods_status,
          expected_volume: scopeInDoc.expected_volume,
          expected_go_live_date: scopeInDoc.expected_go_live_date,
          is_complete: scopeInDoc.is_complete,
          compliance_requirements: scopeInDoc.compliance_requirements,
        })
        .from(scopeInDoc)
        .leftJoin(merchantProfile, eq(scopeInDoc.merchant_id, merchantProfile.id));

      if (merchantId) {
        query = query.where(eq(scopeInDoc.merchant_id, merchantId)) as any;
      } else if (onlyIncomplete) {
        query = query.where(eq(scopeInDoc.is_complete, false)) as any;
      }

      const scopes = await query;
      return { count: scopes.length, scopes };
    },
  }),

  getInboundEvents: tool({
    description:
      "Get inbound events like meetings, emails, Slack messages, etc. Shows raw communication data captured in the system.",
    parameters: z.object({
      merchantId: z
        .string()
        .optional()
        .describe("Filter by merchant ID"),
      sourceType: z
        .enum(["MEETING", "EMAIL", "SLACK", "SALESFORCE", "DOCUMENT", "MANUAL"])
        .optional()
        .describe("Filter by event source type"),
      limit: z.number().default(20).describe("Maximum number of events"),
    }),
    execute: async (params: any) => {
      const { merchantId, sourceType, limit } = params;
      
      let query = db
        .select()
        .from(inboundEvent)
        .orderBy(desc(inboundEvent.created_at))
        .limit(limit);

      const conditions = [];
      
      if (merchantId) {
        conditions.push(eq(inboundEvent.merchant_id, merchantId));
      }
      
      if (sourceType) {
        conditions.push(eq(inboundEvent.source_type, sourceType));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const events = await query;
      return { count: events.length, events };
    },
  }),

  getAiExtractions: tool({
    description:
      "Get AI-extracted information from events. Shows what the AI detected and proposed changes to merchant data, with confidence levels and application status.",
    parameters: z.object({
      merchantId: z
        .string()
        .optional()
        .describe("Filter by merchant ID"),
      status: z
        .enum(["PENDING", "AUTO_APPLIED", "MANUALLY_APPROVED", "REJECTED"])
        .optional()
        .describe("Filter by extraction status"),
      confidence: z
        .enum(["HIGH", "MEDIUM", "LOW"])
        .optional()
        .describe("Filter by confidence level"),
      limit: z.number().default(20).describe("Maximum number of extractions"),
    }),
    execute: async (params: any) => {
      const { merchantId, status, confidence, limit } = params;
      
      let query = db
        .select()
        .from(aiExtraction)
        .orderBy(desc(aiExtraction.created_at))
        .limit(limit);

      const conditions = [];
      
      if (merchantId) {
        conditions.push(eq(aiExtraction.merchant_id, merchantId));
      }
      
      if (status) {
        conditions.push(eq(aiExtraction.status, status));
      }
      
      if (confidence) {
        conditions.push(eq(aiExtraction.confidence, confidence));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const extractions = await query;
      return { count: extractions.length, extractions };
    },
  }),

  getAuditLog: tool({
    description:
      "Get activity log / audit trail showing all changes made to merchant data. Shows who changed what, when, and why. Essential for tracking merchant lifecycle history.",
    parameters: z.object({
      merchantId: z
        .string()
        .optional()
        .describe("Filter by merchant ID"),
      actorType: z
        .enum(["AI", "USER", "SYSTEM"])
        .optional()
        .describe("Filter by who made the change"),
      changeType: z
        .enum(["CREATE", "UPDATE", "STAGE_CHANGE"])
        .optional()
        .describe("Filter by type of change"),
      targetTable: z
        .string()
        .optional()
        .describe("Filter by which table was modified"),
      limit: z.number().default(50).describe("Maximum number of log entries"),
    }),
    execute: async (params: any) => {
      const { merchantId, actorType, changeType, targetTable, limit } = params;
      
      let query = db
        .select({
          id: auditLog.id,
          merchant_id: auditLog.merchant_id,
          target_table: auditLog.target_table,
          target_id: auditLog.target_id,
          target_field: auditLog.target_field,
          change_type: auditLog.change_type,
          old_value: auditLog.old_value,
          new_value: auditLog.new_value,
          actor_type: auditLog.actor_type,
          actor_id: auditLog.actor_id,
          source_type: auditLog.source_type,
          reason: auditLog.reason,
          created_at: auditLog.created_at,
        })
        .from(auditLog)
        .orderBy(desc(auditLog.created_at))
        .limit(limit);

      const conditions = [];
      
      if (merchantId) {
        conditions.push(eq(auditLog.merchant_id, merchantId));
      }
      
      if (actorType) {
        conditions.push(eq(auditLog.actor_type, actorType));
      }
      
      if (changeType) {
        conditions.push(eq(auditLog.change_type, changeType));
      }
      
      if (targetTable) {
        conditions.push(eq(auditLog.target_table, targetTable));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const logs = await query;
      return { count: logs.length, logs };
    },
  }),

  getPaymentProcessors: tool({
    description:
      "Get information about payment processors (PSPs) like Stripe, Adyen, etc. Shows integration status, capabilities, and supported features.",
    parameters: z.object({
      status: z
        .enum(["NOT_SUPPORTED", "IN_PROGRESS", "LIVE", "DEPRECATED"])
        .optional()
        .describe("Filter by processor status"),
      supportsPayouts: z
        .boolean()
        .optional()
        .describe("Filter processors that support payouts"),
      supportsRecurring: z
        .boolean()
        .optional()
        .describe("Filter processors that support recurring payments"),
      supportsCrypto: z
        .boolean()
        .optional()
        .describe("Filter processors that support crypto"),
    }),
    execute: async (params: any) => {
      const { status, supportsPayouts, supportsRecurring, supportsCrypto } = params;
      
      let query = db.select().from(paymentProcessors);

      const conditions = [];
      
      if (status) {
        conditions.push(eq(paymentProcessors.status, status));
      }
      
      if (supportsPayouts !== undefined) {
        conditions.push(eq(paymentProcessors.supports_payouts, supportsPayouts));
      }
      
      if (supportsRecurring !== undefined) {
        conditions.push(eq(paymentProcessors.supports_recurring, supportsRecurring));
      }
      
      if (supportsCrypto !== undefined) {
        conditions.push(eq(paymentProcessors.supports_crypto, supportsCrypto));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const processors = await query;
      return { count: processors.length, processors };
    },
  }),

  getCountryProcessorFeatures: tool({
    description:
      "Get country-specific payment processor features. Shows which payment methods are supported in which countries by each processor.",
    parameters: z.object({
      processorId: z
        .string()
        .optional()
        .describe("Filter by processor ID"),
      country: z
        .string()
        .optional()
        .describe("Filter by country code (e.g., BR, MX, US)"),
      status: z
        .enum(["NOT_SUPPORTED", "IN_PROGRESS", "LIVE"])
        .optional()
        .describe("Filter by status in that country"),
    }),
    execute: async (params: any) => {
      const { processorId, country, status } = params;
      
      let query = db
        .select({
          id: countryProcessorFeatures.id,
          processor_id: countryProcessorFeatures.processor_id,
          processor_name: paymentProcessors.name,
          country: countryProcessorFeatures.country,
          supported_methods: countryProcessorFeatures.supported_methods,
          supports_local_instruments: countryProcessorFeatures.supports_local_instruments,
          supports_payouts: countryProcessorFeatures.supports_payouts,
          supports_crypto: countryProcessorFeatures.supports_crypto,
          status: countryProcessorFeatures.status,
        })
        .from(countryProcessorFeatures)
        .leftJoin(
          paymentProcessors,
          eq(countryProcessorFeatures.processor_id, paymentProcessors.id)
        );

      const conditions = [];
      
      if (processorId) {
        conditions.push(eq(countryProcessorFeatures.processor_id, processorId));
      }
      
      if (country) {
        conditions.push(eq(countryProcessorFeatures.country, country));
      }
      
      if (status) {
        conditions.push(eq(countryProcessorFeatures.status, status));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const features = await query;
      return { count: features.length, features };
    },
  }),

  getMerchantPspImplementations: tool({
    description:
      "Get merchant-specific PSP implementation status. Shows which payment processors are being implemented for which merchants and their progress.",
    parameters: z.object({
      merchantId: z
        .string()
        .optional()
        .describe("Filter by merchant ID"),
      status: z
        .enum(["PENDING", "IN_PROGRESS", "LIVE", "BLOCKED", "NOT_REQUIRED"])
        .optional()
        .describe("Filter by implementation status"),
      processorId: z
        .string()
        .optional()
        .describe("Filter by processor ID"),
    }),
    execute: async (params: any) => {
      const { merchantId, status, processorId } = params;
      
      let query = db
        .select({
          id: merchantPspImplementation.id,
          merchant_id: merchantPspImplementation.merchant_id,
          merchant_name: merchantProfile.name,
          processor_id: merchantPspImplementation.processor_id,
          status: merchantPspImplementation.status,
          blocked_reason: merchantPspImplementation.blocked_reason,
          not_required_reason: merchantPspImplementation.not_required_reason,
          platform_supported: merchantPspImplementation.platform_supported,
          started_at: merchantPspImplementation.started_at,
          completed_at: merchantPspImplementation.completed_at,
        })
        .from(merchantPspImplementation)
        .leftJoin(
          merchantProfile,
          eq(merchantPspImplementation.merchant_id, merchantProfile.id)
        );

      const conditions = [];
      
      if (merchantId) {
        conditions.push(eq(merchantPspImplementation.merchant_id, merchantId));
      }
      
      if (status) {
        conditions.push(eq(merchantPspImplementation.status, status));
      }
      
      if (processorId) {
        conditions.push(eq(merchantPspImplementation.processor_id, processorId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const implementations = await query;
      return { count: implementations.length, implementations };
    },
  }),

  getMerchantPaymentMethodImplementations: tool({
    description:
      "Get merchant-specific payment method implementation status. Shows which payment methods are being implemented for which merchants.",
    parameters: z.object({
      merchantId: z
        .string()
        .optional()
        .describe("Filter by merchant ID"),
      status: z
        .enum(["PENDING", "IN_PROGRESS", "LIVE", "BLOCKED", "NOT_REQUIRED"])
        .optional()
        .describe("Filter by implementation status"),
      paymentMethod: z
        .string()
        .optional()
        .describe("Filter by payment method"),
    }),
    execute: async (params: any) => {
      const { merchantId, status, paymentMethod } = params;
      
      let query = db
        .select({
          id: merchantPaymentMethodImplementation.id,
          merchant_id: merchantPaymentMethodImplementation.merchant_id,
          merchant_name: merchantProfile.name,
          payment_method: merchantPaymentMethodImplementation.payment_method,
          status: merchantPaymentMethodImplementation.status,
          blocked_reason: merchantPaymentMethodImplementation.blocked_reason,
          not_required_reason: merchantPaymentMethodImplementation.not_required_reason,
          platform_supported: merchantPaymentMethodImplementation.platform_supported,
          started_at: merchantPaymentMethodImplementation.started_at,
          completed_at: merchantPaymentMethodImplementation.completed_at,
        })
        .from(merchantPaymentMethodImplementation)
        .leftJoin(
          merchantProfile,
          eq(merchantPaymentMethodImplementation.merchant_id, merchantProfile.id)
        );

      const conditions = [];
      
      if (merchantId) {
        conditions.push(
          eq(merchantPaymentMethodImplementation.merchant_id, merchantId)
        );
      }
      
      if (status) {
        conditions.push(eq(merchantPaymentMethodImplementation.status, status));
      }
      
      if (paymentMethod) {
        conditions.push(
          eq(merchantPaymentMethodImplementation.payment_method, paymentMethod)
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const implementations = await query;
      return { count: implementations.length, implementations };
    },
  }),

  getStageTransitions: tool({
    description:
      "Get merchant lifecycle stage transitions. Shows when merchants moved between SCOPING, IMPLEMENTING, and LIVE stages, with snapshots of their state at transition time.",
    parameters: z.object({
      merchantId: z
        .string()
        .optional()
        .describe("Filter by merchant ID"),
      fromStage: z
        .enum(["SCOPING", "IMPLEMENTING", "LIVE"])
        .optional()
        .describe("Filter by source stage"),
      toStage: z
        .enum(["SCOPING", "IMPLEMENTING", "LIVE"])
        .optional()
        .describe("Filter by destination stage"),
      status: z
        .enum(["APPROVED", "REJECTED"])
        .optional()
        .describe("Filter by transition status"),
      limit: z.number().default(20).describe("Maximum number of transitions"),
    }),
    execute: async (params: any) => {
      const { merchantId, fromStage, toStage, status, limit } = params;
      
      let query = db
        .select({
          id: stageTransition.id,
          merchant_id: stageTransition.merchant_id,
          merchant_name: merchantProfile.name,
          from_stage: stageTransition.from_stage,
          to_stage: stageTransition.to_stage,
          status: stageTransition.status,
          transitioned_by: stageTransition.transitioned_by,
          scope_snapshot: stageTransition.scope_snapshot,
          user_feedback: stageTransition.user_feedback,
          warnings_acknowledged: stageTransition.warnings_acknowledged,
          rejection_reason: stageTransition.rejection_reason,
          created_at: stageTransition.created_at,
        })
        .from(stageTransition)
        .leftJoin(
          merchantProfile,
          eq(stageTransition.merchant_id, merchantProfile.id)
        )
        .orderBy(desc(stageTransition.created_at))
        .limit(limit);

      const conditions = [];
      
      if (merchantId) {
        conditions.push(eq(stageTransition.merchant_id, merchantId));
      }
      
      if (fromStage) {
        conditions.push(eq(stageTransition.from_stage, fromStage));
      }
      
      if (toStage) {
        conditions.push(eq(stageTransition.to_stage, toStage));
      }
      
      if (status) {
        conditions.push(eq(stageTransition.status, status));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const transitions = await query;
      return { count: transitions.length, transitions };
    },
  }),

  getAttachments: tool({
    description:
      "Get file attachments associated with merchants. Includes contracts, technical documents, and other files.",
    parameters: z.object({
      merchantId: z
        .string()
        .optional()
        .describe("Filter by merchant ID"),
      category: z
        .enum(["CONTRACT", "TECHNICAL_DOC", "OTHER"])
        .optional()
        .describe("Filter by attachment category"),
      limit: z.number().default(20).describe("Maximum number of attachments"),
    }),
    execute: async (params: any) => {
      const { merchantId, category, limit } = params;
      
      let query = db
        .select()
        .from(attachment)
        .orderBy(desc(attachment.created_at))
        .limit(limit);

      const conditions = [];
      
      if (merchantId) {
        conditions.push(eq(attachment.merchant_id, merchantId));
      }
      
      if (category) {
        conditions.push(eq(attachment.category, category));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const attachments = await query;
      return { count: attachments.length, attachments };
    },
  }),
};
