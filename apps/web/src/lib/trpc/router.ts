import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/core/db/client";
import {
  type ActorType,
  attachment,
  auditLog,
  countryProcessorFeatures,
  type FieldStatus,
  type ImplementationStatus,
  inboundEvent,
  merchantPaymentMethodImplementation,
  merchantProfile,
  merchantPspImplementation,
  paymentProcessors,
  type SourceType,
  scopeInDoc,
  stageTransition,
} from "@/core/db/schema";
import {
  calculateImplementationReadiness,
  calculateScopeReadiness,
  previewTransitionToImplementing,
  previewTransitionToLive,
  transitionToImplementing,
  transitionToLive,
} from "@/core/services/pipeline";
import { createAuditLog } from "@/core/services/audit/audit-logger";
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
  // SCOPE
  // ===========================================
  scope: router({
    /**
     * Update scope fields with audit logging
     * Does NOT go through AI pipeline - direct user edit
     */
    updateScope: publicProcedure
      .input(
        z.object({
          merchantId: z.string(),
          scopeId: z.string(),
          userId: z.string(),
          updates: z.object({
            psps: z.array(z.string()).optional(),
            countries: z.array(z.string()).optional(),
            payment_methods: z.array(z.string()).optional(),
            expected_volume: z.string().nullable().optional(),
            expected_approval_rate: z.string().nullable().optional(),
            restrictions: z.array(z.string()).optional(),
            dependencies: z.array(z.string()).optional(),
            compliance_requirements: z.array(z.string()).optional(),
            expected_go_live_date: z.date().nullable().optional(),
            comes_from_mor: z.boolean().optional(),
            deal_closed_by: z.string().nullable().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { merchantId, scopeId, userId, updates } = input;

        // Get current scope to compare changes
        const currentScope = await db
          .select()
          .from(scopeInDoc)
          .where(eq(scopeInDoc.id, scopeId))
          .limit(1);

        if (currentScope.length === 0) {
          throw new Error("Scope not found");
        }

        const current = currentScope[0];

        // Helper to determine field status
        const getFieldStatus = (value: unknown): FieldStatus => {
          if (value === null || value === undefined) return "MISSING";
          if (Array.isArray(value))
            return value.length > 0 ? "COMPLETE" : "MISSING";
          if (typeof value === "string")
            return value.trim() ? "COMPLETE" : "MISSING";
          return "COMPLETE";
        };

        // Build update object and track changes for audit log
        const updateData: Record<string, unknown> = {
          updated_at: new Date(),
        };
        const changes: Array<{
          field: string;
          oldValue: unknown;
          newValue: unknown;
        }> = [];

        // Process each field
        if (updates.psps !== undefined) {
          updateData.psps = updates.psps;
          updateData.psps_status = getFieldStatus(updates.psps);
          if (JSON.stringify(current.psps) !== JSON.stringify(updates.psps)) {
            changes.push({
              field: "psps",
              oldValue: current.psps,
              newValue: updates.psps,
            });
          }
        }

        if (updates.countries !== undefined) {
          updateData.countries = updates.countries;
          updateData.countries_status = getFieldStatus(updates.countries);
          if (
            JSON.stringify(current.countries) !==
            JSON.stringify(updates.countries)
          ) {
            changes.push({
              field: "countries",
              oldValue: current.countries,
              newValue: updates.countries,
            });
          }
        }

        if (updates.payment_methods !== undefined) {
          updateData.payment_methods = updates.payment_methods;
          updateData.payment_methods_status = getFieldStatus(
            updates.payment_methods,
          );
          if (
            JSON.stringify(current.payment_methods) !==
            JSON.stringify(updates.payment_methods)
          ) {
            changes.push({
              field: "payment_methods",
              oldValue: current.payment_methods,
              newValue: updates.payment_methods,
            });
          }
        }

        if (updates.expected_volume !== undefined) {
          updateData.expected_volume = updates.expected_volume;
          updateData.expected_volume_status = getFieldStatus(
            updates.expected_volume,
          );
          if (current.expected_volume !== updates.expected_volume) {
            changes.push({
              field: "expected_volume",
              oldValue: current.expected_volume,
              newValue: updates.expected_volume,
            });
          }
        }

        if (updates.expected_approval_rate !== undefined) {
          updateData.expected_approval_rate = updates.expected_approval_rate;
          updateData.expected_approval_rate_status = getFieldStatus(
            updates.expected_approval_rate,
          );
          if (
            current.expected_approval_rate !== updates.expected_approval_rate
          ) {
            changes.push({
              field: "expected_approval_rate",
              oldValue: current.expected_approval_rate,
              newValue: updates.expected_approval_rate,
            });
          }
        }

        if (updates.restrictions !== undefined) {
          updateData.restrictions = updates.restrictions;
          updateData.restrictions_status = getFieldStatus(updates.restrictions);
          if (
            JSON.stringify(current.restrictions) !==
            JSON.stringify(updates.restrictions)
          ) {
            changes.push({
              field: "restrictions",
              oldValue: current.restrictions,
              newValue: updates.restrictions,
            });
          }
        }

        if (updates.dependencies !== undefined) {
          updateData.dependencies = updates.dependencies;
          updateData.dependencies_status = getFieldStatus(updates.dependencies);
          if (
            JSON.stringify(current.dependencies) !==
            JSON.stringify(updates.dependencies)
          ) {
            changes.push({
              field: "dependencies",
              oldValue: current.dependencies,
              newValue: updates.dependencies,
            });
          }
        }

        if (updates.compliance_requirements !== undefined) {
          updateData.compliance_requirements = updates.compliance_requirements;
          updateData.compliance_status = getFieldStatus(
            updates.compliance_requirements,
          );
          if (
            JSON.stringify(current.compliance_requirements) !==
            JSON.stringify(updates.compliance_requirements)
          ) {
            changes.push({
              field: "compliance_requirements",
              oldValue: current.compliance_requirements,
              newValue: updates.compliance_requirements,
            });
          }
        }

        if (updates.expected_go_live_date !== undefined) {
          updateData.expected_go_live_date = updates.expected_go_live_date;
          updateData.go_live_date_status = getFieldStatus(
            updates.expected_go_live_date,
          );
          if (
            current.expected_go_live_date?.toISOString() !==
            updates.expected_go_live_date?.toISOString()
          ) {
            changes.push({
              field: "expected_go_live_date",
              oldValue: current.expected_go_live_date,
              newValue: updates.expected_go_live_date,
            });
          }
        }

        if (updates.comes_from_mor !== undefined) {
          updateData.comes_from_mor = updates.comes_from_mor;
          if (current.comes_from_mor !== updates.comes_from_mor) {
            changes.push({
              field: "comes_from_mor",
              oldValue: current.comes_from_mor,
              newValue: updates.comes_from_mor,
            });
          }
        }

        if (updates.deal_closed_by !== undefined) {
          updateData.deal_closed_by = updates.deal_closed_by;
          if (current.deal_closed_by !== updates.deal_closed_by) {
            changes.push({
              field: "deal_closed_by",
              oldValue: current.deal_closed_by,
              newValue: updates.deal_closed_by,
            });
          }
        }

        // Only update if there are changes
        if (changes.length === 0) {
          return { success: true, changesCount: 0 };
        }

        // Update the scope
        await db
          .update(scopeInDoc)
          .set(updateData)
          .where(eq(scopeInDoc.id, scopeId));

        // Create audit log entries for each changed field
        for (const change of changes) {
          await createAuditLog({
            merchantId,
            targetTable: "scope_in_doc",
            targetId: scopeId,
            targetField: change.field,
            changeType: "UPDATE",
            oldValue: change.oldValue,
            newValue: change.newValue,
            actorType: "USER",
            actorId: userId,
            sourceType: "MANUAL",
            reason: "Manual scope update",
          });
        }

        return { success: true, changesCount: changes.length };
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

  // ===========================================
  // PIPELINE - Stage Transitions & Readiness
  // ===========================================
  pipeline: router({
    /**
     * Get scope readiness for a merchant (SCOPING stage)
     */
    getScopeReadiness: publicProcedure
      .input(z.string())
      .query(async ({ input: merchantId }) => {
        const scope = await db
          .select()
          .from(scopeInDoc)
          .where(eq(scopeInDoc.merchant_id, merchantId))
          .limit(1);

        if (scope.length === 0) {
          return null;
        }

        return calculateScopeReadiness({
          psps_status: scope[0].psps_status,
          countries_status: scope[0].countries_status,
          payment_methods_status: scope[0].payment_methods_status,
          expected_volume_status: scope[0].expected_volume_status,
          expected_approval_rate_status: scope[0].expected_approval_rate_status,
          restrictions_status: scope[0].restrictions_status,
          dependencies_status: scope[0].dependencies_status,
          compliance_status: scope[0].compliance_status,
          go_live_date_status: scope[0].go_live_date_status,
        });
      }),

    /**
     * Get implementation readiness for a merchant (IMPLEMENTING stage)
     */
    getImplementationReadiness: publicProcedure
      .input(z.string())
      .query(async ({ input: merchantId }) => {
        return calculateImplementationReadiness(merchantId);
      }),

    /**
     * Preview transition to IMPLEMENTING (validate without making changes)
     */
    previewTransitionToImplementing: publicProcedure
      .input(
        z.object({
          merchantId: z.string(),
          scopeUpdates: z
            .object({
              psps: z.array(z.string()).optional(),
              countries: z.array(z.string()).optional(),
              payment_methods: z.array(z.string()).optional(),
            })
            .optional(),
        }),
      )
      .query(async ({ input }) => {
        return previewTransitionToImplementing(
          input.merchantId,
          input.scopeUpdates,
        );
      }),

    /**
     * Preview transition to LIVE (validate without making changes)
     */
    previewTransitionToLive: publicProcedure
      .input(z.string())
      .query(async ({ input: merchantId }) => {
        return previewTransitionToLive(merchantId);
      }),

    /**
     * Transition merchant from SCOPING to IMPLEMENTING
     */
    transitionToImplementing: publicProcedure
      .input(
        z.object({
          merchantId: z.string(),
          userId: z.string(),
          updatedScope: z
            .object({
              psps: z.array(z.string()).optional(),
              countries: z.array(z.string()).optional(),
              payment_methods: z.array(z.string()).optional(),
              expected_volume: z.string().optional(),
              expected_approval_rate: z.string().optional(),
              restrictions: z.array(z.string()).optional(),
              dependencies: z.array(z.string()).optional(),
              compliance_requirements: z.array(z.string()).optional(),
              expected_go_live_date: z.date().optional(),
            })
            .optional(),
          userFeedback: z.string().optional(),
          acknowledgedWarnings: z.array(
            z.object({
              type: z.enum([
                "PSP_NOT_SUPPORTED",
                "PAYMENT_METHOD_NOT_SUPPORTED",
              ]),
              processor_id: z.string().optional(),
              payment_method: z.string().optional(),
              message: z.string(),
            }),
          ),
        }),
      )
      .mutation(async ({ input }) => {
        return transitionToImplementing(input);
      }),

    /**
     * Transition merchant from IMPLEMENTING to LIVE
     */
    transitionToLive: publicProcedure
      .input(
        z.object({
          merchantId: z.string(),
          userId: z.string(),
          userFeedback: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return transitionToLive(input);
      }),

    /**
     * Get stage transition history for a merchant
     */
    getTransitionHistory: publicProcedure
      .input(z.string())
      .query(async ({ input: merchantId }) => {
        const transitions = await db
          .select()
          .from(stageTransition)
          .where(eq(stageTransition.merchant_id, merchantId))
          .orderBy(desc(stageTransition.created_at));

        return transitions;
      }),
  }),

  // ===========================================
  // IMPLEMENTATIONS - PSP & Payment Method tracking
  // ===========================================
  implementations: router({
    /**
     * Get all PSP implementations for a merchant
     */
    getPspImplementations: publicProcedure
      .input(z.string())
      .query(async ({ input: merchantId }) => {
        const implementations = await db
          .select()
          .from(merchantPspImplementation)
          .where(eq(merchantPspImplementation.merchant_id, merchantId));

        return implementations;
      }),

    /**
     * Get all payment method implementations for a merchant
     */
    getPaymentMethodImplementations: publicProcedure
      .input(z.string())
      .query(async ({ input: merchantId }) => {
        const implementations = await db
          .select()
          .from(merchantPaymentMethodImplementation)
          .where(
            eq(merchantPaymentMethodImplementation.merchant_id, merchantId),
          );

        return implementations;
      }),

    /**
     * Update PSP implementation status
     */
    updatePspImplementationStatus: publicProcedure
      .input(
        z.object({
          implementationId: z.string(),
          status: z.enum([
            "PENDING",
            "IN_PROGRESS",
            "LIVE",
            "BLOCKED",
            "NOT_REQUIRED",
          ]),
          blockedReason: z.string().optional(),
          notRequiredReason: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const now = new Date();

        const updateData: Record<string, unknown> = {
          status: input.status as ImplementationStatus,
          updated_at: now,
        };

        // Set started_at when moving to IN_PROGRESS
        if (input.status === "IN_PROGRESS") {
          updateData.started_at = now;
        }

        // Set completed_at when moving to LIVE
        if (input.status === "LIVE") {
          updateData.completed_at = now;
        }

        // Handle blocked reason
        if (input.status === "BLOCKED") {
          updateData.blocked_reason = input.blockedReason;
        } else {
          updateData.blocked_reason = null;
        }

        // Handle not required reason
        if (input.status === "NOT_REQUIRED") {
          updateData.not_required_reason = input.notRequiredReason;
        } else {
          updateData.not_required_reason = null;
        }

        await db
          .update(merchantPspImplementation)
          .set(updateData)
          .where(eq(merchantPspImplementation.id, input.implementationId));

        return { success: true };
      }),

    /**
     * Update payment method implementation status
     */
    updatePaymentMethodImplementationStatus: publicProcedure
      .input(
        z.object({
          implementationId: z.string(),
          status: z.enum([
            "PENDING",
            "IN_PROGRESS",
            "LIVE",
            "BLOCKED",
            "NOT_REQUIRED",
          ]),
          blockedReason: z.string().optional(),
          notRequiredReason: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const now = new Date();

        const updateData: Record<string, unknown> = {
          status: input.status as ImplementationStatus,
          updated_at: now,
        };

        // Set started_at when moving to IN_PROGRESS
        if (input.status === "IN_PROGRESS") {
          updateData.started_at = now;
        }

        // Set completed_at when moving to LIVE
        if (input.status === "LIVE") {
          updateData.completed_at = now;
        }

        // Handle blocked reason
        if (input.status === "BLOCKED") {
          updateData.blocked_reason = input.blockedReason;
        } else {
          updateData.blocked_reason = null;
        }

        // Handle not required reason
        if (input.status === "NOT_REQUIRED") {
          updateData.not_required_reason = input.notRequiredReason;
        } else {
          updateData.not_required_reason = null;
        }

        await db
          .update(merchantPaymentMethodImplementation)
          .set(updateData)
          .where(
            eq(merchantPaymentMethodImplementation.id, input.implementationId),
          );

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
