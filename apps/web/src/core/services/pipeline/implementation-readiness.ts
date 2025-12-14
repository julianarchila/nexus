import { eq } from "drizzle-orm";
import { db } from "@/core/db/client";
import {
  type ImplementationStatus,
  merchantPaymentMethodImplementation,
  merchantPspImplementation,
} from "@/core/db/schema";

/**
 * Implementation readiness calculator
 *
 * Calculates how complete the merchant's PSP and payment method implementations are
 * during the IMPLEMENTING phase. This helps determine if a merchant is ready to go LIVE.
 */

export interface PspImplementationSummary {
  processorId: string;
  status: ImplementationStatus;
  platformSupported: boolean;
  blockedReason?: string | null;
  notRequiredReason?: string | null;
}

export interface PaymentMethodImplementationSummary {
  paymentMethod: string;
  status: ImplementationStatus;
  platformSupported: boolean;
  blockedReason?: string | null;
  notRequiredReason?: string | null;
}

export interface ImplementationReadinessResult {
  /** Overall readiness score 0-100 (only LIVE and NOT_REQUIRED count as complete) */
  score: number;

  // PSP summary
  pspImplementations: PspImplementationSummary[];
  pspStats: {
    total: number;
    live: number;
    inProgress: number;
    pending: number;
    blocked: number;
    notRequired: number;
  };

  // Payment method summary
  paymentMethodImplementations: PaymentMethodImplementationSummary[];
  paymentMethodStats: {
    total: number;
    live: number;
    inProgress: number;
    pending: number;
    blocked: number;
    notRequired: number;
  };

  /** Whether all implementations are either LIVE or NOT_REQUIRED */
  isComplete: boolean;

  /** Items blocking completion (PENDING, IN_PROGRESS, or BLOCKED) */
  blockingItems: {
    psps: string[];
    paymentMethods: string[];
  };
}

/**
 * Calculate implementation readiness for a merchant.
 *
 * Scoring:
 * - LIVE: 100 points
 * - NOT_REQUIRED: 100 points (doesn't count against readiness)
 * - IN_PROGRESS: 50 points
 * - PENDING: 0 points
 * - BLOCKED: 0 points
 */
export async function calculateImplementationReadiness(
  merchantId: string,
): Promise<ImplementationReadinessResult> {
  // Fetch all PSP implementations for the merchant
  const pspImplementations = await db
    .select()
    .from(merchantPspImplementation)
    .where(eq(merchantPspImplementation.merchant_id, merchantId));

  // Fetch all payment method implementations for the merchant
  const pmImplementations = await db
    .select()
    .from(merchantPaymentMethodImplementation)
    .where(eq(merchantPaymentMethodImplementation.merchant_id, merchantId));

  // Calculate PSP stats
  const pspStats = {
    total: pspImplementations.length,
    live: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    notRequired: 0,
  };

  const pspSummaries: PspImplementationSummary[] = [];
  const blockingPsps: string[] = [];

  for (const impl of pspImplementations) {
    pspSummaries.push({
      processorId: impl.processor_id,
      status: impl.status,
      platformSupported: impl.platform_supported,
      blockedReason: impl.blocked_reason,
      notRequiredReason: impl.not_required_reason,
    });

    switch (impl.status) {
      case "LIVE":
        pspStats.live++;
        break;
      case "IN_PROGRESS":
        pspStats.inProgress++;
        blockingPsps.push(impl.processor_id);
        break;
      case "PENDING":
        pspStats.pending++;
        blockingPsps.push(impl.processor_id);
        break;
      case "BLOCKED":
        pspStats.blocked++;
        blockingPsps.push(impl.processor_id);
        break;
      case "NOT_REQUIRED":
        pspStats.notRequired++;
        break;
    }
  }

  // Calculate payment method stats
  const pmStats = {
    total: pmImplementations.length,
    live: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    notRequired: 0,
  };

  const pmSummaries: PaymentMethodImplementationSummary[] = [];
  const blockingPaymentMethods: string[] = [];

  for (const impl of pmImplementations) {
    pmSummaries.push({
      paymentMethod: impl.payment_method,
      status: impl.status,
      platformSupported: impl.platform_supported,
      blockedReason: impl.blocked_reason,
      notRequiredReason: impl.not_required_reason,
    });

    switch (impl.status) {
      case "LIVE":
        pmStats.live++;
        break;
      case "IN_PROGRESS":
        pmStats.inProgress++;
        blockingPaymentMethods.push(impl.payment_method);
        break;
      case "PENDING":
        pmStats.pending++;
        blockingPaymentMethods.push(impl.payment_method);
        break;
      case "BLOCKED":
        pmStats.blocked++;
        blockingPaymentMethods.push(impl.payment_method);
        break;
      case "NOT_REQUIRED":
        pmStats.notRequired++;
        break;
    }
  }

  // Calculate overall score
  const totalItems = pspStats.total + pmStats.total;
  if (totalItems === 0) {
    return {
      score: 100,
      pspImplementations: pspSummaries,
      pspStats,
      paymentMethodImplementations: pmSummaries,
      paymentMethodStats: pmStats,
      isComplete: true,
      blockingItems: {
        psps: [],
        paymentMethods: [],
      },
    };
  }

  let totalScore = 0;

  // PSP scoring
  totalScore += pspStats.live * 100;
  totalScore += pspStats.notRequired * 100;
  totalScore += pspStats.inProgress * 50;
  // PENDING and BLOCKED contribute 0

  // Payment method scoring
  totalScore += pmStats.live * 100;
  totalScore += pmStats.notRequired * 100;
  totalScore += pmStats.inProgress * 50;

  const score = Math.round(totalScore / totalItems);

  const isComplete =
    blockingPsps.length === 0 && blockingPaymentMethods.length === 0;

  return {
    score,
    pspImplementations: pspSummaries,
    pspStats,
    paymentMethodImplementations: pmSummaries,
    paymentMethodStats: pmStats,
    isComplete,
    blockingItems: {
      psps: blockingPsps,
      paymentMethods: blockingPaymentMethods,
    },
  };
}

/**
 * Get a human-readable label for an implementation status
 */
export function getImplementationStatusLabel(
  status: ImplementationStatus,
): string {
  const labels: Record<ImplementationStatus, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    LIVE: "Live",
    BLOCKED: "Blocked",
    NOT_REQUIRED: "Not Required",
  };
  return labels[status];
}

/**
 * Get a color class for an implementation status (for UI)
 */
export function getImplementationStatusColor(
  status: ImplementationStatus,
): string {
  const colors: Record<ImplementationStatus, string> = {
    PENDING: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    LIVE: "bg-green-100 text-green-800",
    BLOCKED: "bg-red-100 text-red-800",
    NOT_REQUIRED: "bg-slate-100 text-slate-600",
  };
  return colors[status];
}
