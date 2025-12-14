import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/core/db/client";
import {
  merchantPaymentMethodImplementation,
  merchantProfile,
  merchantPspImplementation,
  type ScopeSnapshot,
  scopeInDoc,
  stageTransition,
  type TransitionWarning,
} from "@/core/db/schema";
import { createAuditLog } from "@/core/repositories/audit-log.repo";
import { calculateImplementationReadiness } from "@/core/services/implementation-readiness.service";
import {
  checkPlatformSupport,
  isPaymentMethodSupported,
  isPspSupported,
} from "@/core/services/platform-support.service";
import {
  calculateScopeReadiness,
  type ScopeReadinessResult,
} from "@/core/domain/scope/scope-readiness";

/**
 * Stage Transition Service
 *
 * Handles the business logic for moving merchants between lifecycle stages:
 * - SCOPING → IMPLEMENTING
 * - IMPLEMENTING → LIVE
 */

// ============================================
// Types
// ============================================

export interface TransitionToImplementingInput {
  merchantId: string;
  userId: string;
  /** Optional scope edits to apply before transition */
  updatedScope?: Partial<{
    psps: string[];
    countries: string[];
    payment_methods: string[];
    expected_volume: string;
    expected_approval_rate: string;
    restrictions: string[];
    dependencies: string[];
    compliance_requirements: string[];
    expected_go_live_date: Date;
  }>;
  userFeedback?: string;
  acknowledgedWarnings: TransitionWarning[];
}

export interface TransitionToLiveInput {
  merchantId: string;
  userId: string;
  userFeedback?: string;
}

export interface TransitionPreviewResult {
  canTransition: boolean;
  errors: string[];
  warnings: TransitionWarning[];
  scopeReadiness?: ScopeReadinessResult;
}

export interface TransitionResult {
  success: boolean;
  error?: string;
  transitionId?: string;
}

// ============================================
// Preview Functions
// ============================================

/**
 * Preview what would happen if we tried to transition to IMPLEMENTING.
 * Returns validation errors and warnings without making any changes.
 */
export async function previewTransitionToImplementing(
  merchantId: string,
  scopeUpdates?: Partial<{
    psps: string[];
    countries: string[];
    payment_methods: string[];
  }>,
): Promise<TransitionPreviewResult> {
  const errors: string[] = [];

  // 1. Get merchant
  const merchant = await db
    .select()
    .from(merchantProfile)
    .where(eq(merchantProfile.id, merchantId))
    .limit(1);

  if (merchant.length === 0) {
    return {
      canTransition: false,
      errors: ["Merchant not found"],
      warnings: [],
    };
  }

  if (merchant[0].lifecycle_stage !== "SCOPING") {
    return {
      canTransition: false,
      errors: [`Merchant is in ${merchant[0].lifecycle_stage}, not SCOPING`],
      warnings: [],
    };
  }

  // 2. Get current scope
  const scope = await db
    .select()
    .from(scopeInDoc)
    .where(eq(scopeInDoc.merchant_id, merchantId))
    .limit(1);

  if (scope.length === 0) {
    return {
      canTransition: false,
      errors: ["Merchant has no scope document"],
      warnings: [],
    };
  }

  // 3. Apply scope updates for preview (in memory only)
  const currentScope = scope[0];
  const previewScope = {
    ...currentScope,
    psps: scopeUpdates?.psps ?? currentScope.psps ?? [],
    countries: scopeUpdates?.countries ?? currentScope.countries ?? [],
    payment_methods:
      scopeUpdates?.payment_methods ?? currentScope.payment_methods ?? [],
  };

  // 4. Validate minimum requirements
  if (previewScope.psps.length === 0) {
    errors.push("At least one PSP is required");
  }
  if (previewScope.countries.length === 0) {
    errors.push("At least one country is required");
  }
  if (previewScope.payment_methods.length === 0) {
    errors.push("At least one payment method is required");
  }

  // 5. Calculate scope readiness
  const scopeReadiness = calculateScopeReadiness({
    psps_status: previewScope.psps.length > 0 ? "COMPLETE" : "MISSING",
    countries_status:
      previewScope.countries.length > 0 ? "COMPLETE" : "MISSING",
    payment_methods_status:
      previewScope.payment_methods.length > 0 ? "COMPLETE" : "MISSING",
    expected_volume_status: currentScope.expected_volume_status,
    expected_approval_rate_status: currentScope.expected_approval_rate_status,
    restrictions_status: currentScope.restrictions_status,
    dependencies_status: currentScope.dependencies_status,
    compliance_status: currentScope.compliance_status,
    go_live_date_status: currentScope.go_live_date_status,
  });

  // 6. Check platform support
  const platformSupport = await checkPlatformSupport({
    psps: previewScope.psps,
    payment_methods: previewScope.payment_methods,
  });

  return {
    canTransition: errors.length === 0,
    errors,
    warnings: platformSupport.warnings,
    scopeReadiness,
  };
}

/**
 * Preview what would happen if we tried to transition to LIVE.
 */
export async function previewTransitionToLive(
  merchantId: string,
): Promise<TransitionPreviewResult> {
  const errors: string[] = [];

  // 1. Get merchant
  const merchant = await db
    .select()
    .from(merchantProfile)
    .where(eq(merchantProfile.id, merchantId))
    .limit(1);

  if (merchant.length === 0) {
    return {
      canTransition: false,
      errors: ["Merchant not found"],
      warnings: [],
    };
  }

  if (merchant[0].lifecycle_stage !== "IMPLEMENTING") {
    return {
      canTransition: false,
      errors: [
        `Merchant is in ${merchant[0].lifecycle_stage}, not IMPLEMENTING`,
      ],
      warnings: [],
    };
  }

  // 2. Check implementation readiness
  const implementationReadiness =
    await calculateImplementationReadiness(merchantId);

  if (!implementationReadiness.isComplete) {
    if (implementationReadiness.blockingItems.psps.length > 0) {
      errors.push(
        `PSPs not ready: ${implementationReadiness.blockingItems.psps.join(", ")}`,
      );
    }
    if (implementationReadiness.blockingItems.paymentMethods.length > 0) {
      errors.push(
        `Payment methods not ready: ${implementationReadiness.blockingItems.paymentMethods.join(", ")}`,
      );
    }
  }

  return {
    canTransition: errors.length === 0,
    errors,
    warnings: [],
  };
}

// ============================================
// Transition Functions
// ============================================

/**
 * Transition a merchant from SCOPING to IMPLEMENTING.
 *
 * This will:
 * 1. Validate the transition is allowed
 * 2. Apply any scope updates
 * 3. Create implementation records for each PSP and payment method
 * 4. Create a stage transition record with scope snapshot
 * 5. Update the merchant's lifecycle stage
 * 6. Create audit log entries
 */
export async function transitionToImplementing(
  input: TransitionToImplementingInput,
): Promise<TransitionResult> {
  const {
    merchantId,
    userId,
    updatedScope,
    userFeedback,
    acknowledgedWarnings,
  } = input;

  // 1. Validate transition
  const preview = await previewTransitionToImplementing(
    merchantId,
    updatedScope
      ? {
          psps: updatedScope.psps,
          countries: updatedScope.countries,
          payment_methods: updatedScope.payment_methods,
        }
      : undefined,
  );

  if (!preview.canTransition) {
    return {
      success: false,
      error: preview.errors.join("; "),
    };
  }

  // 2. Validate all warnings are acknowledged
  const unacknowledgedWarnings = preview.warnings.filter(
    (w) =>
      !acknowledgedWarnings.some(
        (ack) =>
          ack.type === w.type &&
          ack.processor_id === w.processor_id &&
          ack.payment_method === w.payment_method,
      ),
  );

  if (unacknowledgedWarnings.length > 0) {
    return {
      success: false,
      error: `Unacknowledged warnings: ${unacknowledgedWarnings.map((w) => w.message).join("; ")}`,
    };
  }

  // 3. Get current scope
  const scope = await db
    .select()
    .from(scopeInDoc)
    .where(eq(scopeInDoc.merchant_id, merchantId))
    .limit(1);

  if (scope.length === 0) {
    return { success: false, error: "Scope not found" };
  }

  const currentScope = scope[0];

  // 4. Apply scope updates if provided
  const finalPsps = updatedScope?.psps ?? currentScope.psps ?? [];
  const finalCountries =
    updatedScope?.countries ?? currentScope.countries ?? [];
  const finalPaymentMethods =
    updatedScope?.payment_methods ?? currentScope.payment_methods ?? [];

  if (updatedScope) {
    await db
      .update(scopeInDoc)
      .set({
        psps: finalPsps,
        psps_status: finalPsps.length > 0 ? "COMPLETE" : "MISSING",
        countries: finalCountries,
        countries_status: finalCountries.length > 0 ? "COMPLETE" : "MISSING",
        payment_methods: finalPaymentMethods,
        payment_methods_status:
          finalPaymentMethods.length > 0 ? "COMPLETE" : "MISSING",
        expected_volume:
          updatedScope.expected_volume ?? currentScope.expected_volume,
        expected_approval_rate:
          updatedScope.expected_approval_rate ??
          currentScope.expected_approval_rate,
        restrictions: updatedScope.restrictions ?? currentScope.restrictions,
        dependencies: updatedScope.dependencies ?? currentScope.dependencies,
        compliance_requirements:
          updatedScope.compliance_requirements ??
          currentScope.compliance_requirements,
        expected_go_live_date:
          updatedScope.expected_go_live_date ??
          currentScope.expected_go_live_date,
        updated_at: new Date(),
      })
      .where(eq(scopeInDoc.id, currentScope.id));
  }

  // 5. Create scope snapshot
  const scopeSnapshot: ScopeSnapshot = {
    psps: finalPsps,
    countries: finalCountries,
    payment_methods: finalPaymentMethods,
    expected_volume:
      updatedScope?.expected_volume ?? currentScope.expected_volume,
    expected_approval_rate:
      updatedScope?.expected_approval_rate ??
      currentScope.expected_approval_rate,
    restrictions: (updatedScope?.restrictions ??
      currentScope.restrictions) as string[],
    dependencies: (updatedScope?.dependencies ??
      currentScope.dependencies) as string[],
    compliance_requirements: (updatedScope?.compliance_requirements ??
      currentScope.compliance_requirements) as string[],
    expected_go_live_date:
      currentScope.expected_go_live_date?.toISOString() ?? null,
    comes_from_mor: currentScope.comes_from_mor,
    deal_closed_by: currentScope.deal_closed_by,
  };

  // 6. Create implementation records for PSPs
  for (const pspId of finalPsps) {
    const platformSupported = await isPspSupported(pspId);
    await db.insert(merchantPspImplementation).values({
      id: nanoid(),
      merchant_id: merchantId,
      processor_id: pspId,
      status: "PENDING",
      platform_supported: platformSupported,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // 7. Create implementation records for payment methods
  for (const paymentMethod of finalPaymentMethods) {
    const platformSupported = await isPaymentMethodSupported(paymentMethod);
    await db.insert(merchantPaymentMethodImplementation).values({
      id: nanoid(),
      merchant_id: merchantId,
      payment_method: paymentMethod,
      status: "PENDING",
      platform_supported: platformSupported,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // 8. Create stage transition record
  const transitionId = nanoid();
  await db.insert(stageTransition).values({
    id: transitionId,
    merchant_id: merchantId,
    from_stage: "SCOPING",
    to_stage: "IMPLEMENTING",
    status: "APPROVED",
    transitioned_by: userId,
    scope_snapshot: scopeSnapshot,
    user_feedback: userFeedback,
    warnings_acknowledged: acknowledgedWarnings,
    created_at: new Date(),
  });

  // 9. Update merchant lifecycle stage
  await db
    .update(merchantProfile)
    .set({
      lifecycle_stage: "IMPLEMENTING",
      updated_at: new Date(),
    })
    .where(eq(merchantProfile.id, merchantId));

  // 10. Create audit log
  await createAuditLog({
    merchantId,
    targetTable: "merchant_profile",
    targetId: merchantId,
    targetField: "lifecycle_stage",
    changeType: "STAGE_CHANGE",
    oldValue: "SCOPING",
    newValue: "IMPLEMENTING",
    actorType: "USER",
    actorId: userId,
    reason: userFeedback ?? "Transitioned to implementing",
  });

  return {
    success: true,
    transitionId,
  };
}

/**
 * Transition a merchant from IMPLEMENTING to LIVE.
 *
 * This will:
 * 1. Validate all implementations are complete (LIVE or NOT_REQUIRED)
 * 2. Create a stage transition record
 * 3. Update the merchant's lifecycle stage
 * 4. Create audit log entries
 */
export async function transitionToLive(
  input: TransitionToLiveInput,
): Promise<TransitionResult> {
  const { merchantId, userId, userFeedback } = input;

  // 1. Validate transition
  const preview = await previewTransitionToLive(merchantId);

  if (!preview.canTransition) {
    return {
      success: false,
      error: preview.errors.join("; "),
    };
  }

  // 2. Create stage transition record
  const transitionId = nanoid();
  await db.insert(stageTransition).values({
    id: transitionId,
    merchant_id: merchantId,
    from_stage: "IMPLEMENTING",
    to_stage: "LIVE",
    status: "APPROVED",
    transitioned_by: userId,
    user_feedback: userFeedback,
    created_at: new Date(),
  });

  // 3. Update merchant lifecycle stage
  await db
    .update(merchantProfile)
    .set({
      lifecycle_stage: "LIVE",
      updated_at: new Date(),
    })
    .where(eq(merchantProfile.id, merchantId));

  // 4. Create audit log
  await createAuditLog({
    merchantId,
    targetTable: "merchant_profile",
    targetId: merchantId,
    targetField: "lifecycle_stage",
    changeType: "STAGE_CHANGE",
    oldValue: "IMPLEMENTING",
    newValue: "LIVE",
    actorType: "USER",
    actorId: userId,
    reason: userFeedback ?? "Transitioned to live",
  });

  return {
    success: true,
    transitionId,
  };
}
