import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/core/db/client";
import {
  type ActorType,
  attachment,
  auditLog,
  countryProcessorFeatures,
  inboundEvent,
  merchantProfile,
  paymentProcessors,
  type SourceType,
  scopeInDoc,
} from "@/core/db/schema";
import { publicProcedure, router } from "./init";

// ===========================================
// INPUT SCHEMAS
// ===========================================

const paginationInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

const auditLogFiltersInput = paginationInput.extend({
  merchantId: z.string(),
  actorType: z.enum(["AI", "USER", "SYSTEM"]).optional(),
});

const inboundEventsFiltersInput = paginationInput.extend({
  merchantId: z.string(),
  sourceType: z
    .enum(["MEETING", "EMAIL", "SLACK", "SALESFORCE", "DOCUMENT", "MANUAL"])
    .optional(),
});

// ===========================================
// ROUTER
// ===========================================

export const appRouter = router({
  // ===========================================
  // MERCHANTS
  // ===========================================
  merchants: router({
    /**
     * List all merchants with their scope completeness
     * Pattern 1: Small dataset, client-side filtering
     */
    list: publicProcedure.query(async () => {
      const merchants = await db
        .select({
          id: merchantProfile.id,
          name: merchantProfile.name,
          contact_email: merchantProfile.contact_email,
          contact_name: merchantProfile.contact_name,
          lifecycle_stage: merchantProfile.lifecycle_stage,
          sales_owner: merchantProfile.sales_owner,
          implementation_owner: merchantProfile.implementation_owner,
          created_at: merchantProfile.created_at,
          updated_at: merchantProfile.updated_at,
          // Include scope completeness
          scope_is_complete: scopeInDoc.is_complete,
        })
        .from(merchantProfile)
        .leftJoin(scopeInDoc, eq(merchantProfile.id, scopeInDoc.merchant_id));

      return merchants;
    }),

    /**
     * Get single merchant with full scope data
     */
    getById: publicProcedure
      .input(z.string())
      .query(async ({ input: merchantId }) => {
        const merchant = await db
          .select()
          .from(merchantProfile)
          .where(eq(merchantProfile.id, merchantId))
          .limit(1);

        if (merchant.length === 0) return null;

        const scope = await db
          .select()
          .from(scopeInDoc)
          .where(eq(scopeInDoc.merchant_id, merchantId))
          .limit(1);

        return {
          merchant: merchant[0],
          scope: scope[0] ?? null,
        };
      }),
  }),

  // ===========================================
  // AUDIT LOG
  // ===========================================
  auditLog: router({
    /**
     * Get paginated audit logs for a merchant
     * Pattern 2: Server-side pagination for large datasets
     */
    getByMerchantId: publicProcedure
      .input(auditLogFiltersInput)
      .query(async ({ input }) => {
        const { merchantId, page, pageSize, actorType } = input;
        const offset = (page - 1) * pageSize;

        // Build where conditions
        const conditions = [eq(auditLog.merchant_id, merchantId)];
        if (actorType) {
          conditions.push(eq(auditLog.actor_type, actorType as ActorType));
        }

        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(auditLog)
          .where(and(...conditions));

        const total = countResult[0]?.count ?? 0;

        // Get paginated data
        const data = await db
          .select()
          .from(auditLog)
          .where(and(...conditions))
          .orderBy(desc(auditLog.created_at))
          .limit(pageSize)
          .offset(offset);

        return {
          data,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      }),
  }),

  // ===========================================
  // ATTACHMENTS
  // ===========================================
  attachments: router({
    /**
     * Get all attachments for a merchant
     * Pattern 1: Small dataset per merchant
     */
    getByMerchantId: publicProcedure
      .input(z.string())
      .query(async ({ input: merchantId }) => {
        const attachments = await db
          .select()
          .from(attachment)
          .where(eq(attachment.merchant_id, merchantId))
          .orderBy(desc(attachment.created_at));

        return attachments;
      }),
  }),

  // ===========================================
  // INBOUND EVENTS
  // ===========================================
  inboundEvents: router({
    /**
     * Get paginated inbound events for a merchant
     * Pattern 2: Server-side pagination
     */
    getByMerchantId: publicProcedure
      .input(inboundEventsFiltersInput)
      .query(async ({ input }) => {
        const { merchantId, page, pageSize, sourceType } = input;
        const offset = (page - 1) * pageSize;

        // Build where conditions
        const conditions = [eq(inboundEvent.merchant_id, merchantId)];
        if (sourceType) {
          conditions.push(
            eq(inboundEvent.source_type, sourceType as SourceType),
          );
        }

        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(inboundEvent)
          .where(and(...conditions));

        const total = countResult[0]?.count ?? 0;

        // Get paginated data
        const data = await db
          .select()
          .from(inboundEvent)
          .where(and(...conditions))
          .orderBy(desc(inboundEvent.created_at))
          .limit(pageSize)
          .offset(offset);

        return {
          data,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      }),
  }),

  // ===========================================
  // PAYMENTS (existing)
  // ===========================================
  payments: router({
    getProcessors: publicProcedure.input(z.object({})).query(async () => {
      const processors = await db.select().from(paymentProcessors);
      return processors;
    }),

    getCountryFeatures: publicProcedure.input(z.object({})).query(async () => {
      const features = await db.select().from(countryProcessorFeatures);
      return features;
    }),

    getProcessorWithFeatures: publicProcedure
      .input(z.object({ processorId: z.string() }))
      .query(async ({ input }) => {
        const processor = await db
          .select()
          .from(paymentProcessors)
          .where(eq(paymentProcessors.id, input.processorId))
          .limit(1);

        if (processor.length === 0) {
          throw new Error("Processor not found");
        }

        const features = await db
          .select()
          .from(countryProcessorFeatures)
          .where(eq(countryProcessorFeatures.processor_id, input.processorId));

        return {
          processor: processor[0],
          features,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
