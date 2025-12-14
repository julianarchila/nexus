"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LifecycleStage } from "@/core/db/schema";
import type { ImplementationReadinessResult } from "@/core/services/implementation-readiness.service";
import {
  getScopeFieldLabel,
  type ScopeReadinessResult,
} from "@/core/domain/scope/scope-readiness";

interface ReadinessIndicatorProps {
  lifecycleStage: LifecycleStage;
  scopeReadiness?: ScopeReadinessResult | null;
  implementationReadiness?: ImplementationReadinessResult | null;
}

/**
 * Shows appropriate readiness metrics based on merchant's lifecycle stage:
 * - SCOPING: Scope readiness (how complete is the requirements spec)
 * - IMPLEMENTING: Implementation readiness (PSP/payment method progress)
 * - LIVE: No readiness shown (completed)
 */
export function ReadinessIndicator({
  lifecycleStage,
  scopeReadiness,
  implementationReadiness,
}: ReadinessIndicatorProps) {
  if (lifecycleStage === "LIVE") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Merchant is Live
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This merchant has completed all implementation steps and is now
            live.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (lifecycleStage === "SCOPING") {
    return <ScopeReadinessView readiness={scopeReadiness} />;
  }

  if (lifecycleStage === "IMPLEMENTING") {
    return <ImplementationReadinessView readiness={implementationReadiness} />;
  }

  return null;
}

// ============================================
// Scope Readiness View (SCOPING stage)
// ============================================

function ScopeReadinessView({
  readiness,
}: {
  readiness?: ScopeReadinessResult | null;
}) {
  if (!readiness) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Scope Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No scope document found for this merchant.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Scope Readiness</CardTitle>
          <span
            className={`text-2xl font-bold ${getScoreColor(readiness.score)}`}
          >
            {readiness.score}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(readiness.score)}`}
            style={{ width: `${readiness.score}%` }}
          />
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground">
          {readiness.completedFields} of {readiness.totalFields} fields complete
        </p>

        {/* Missing critical fields warning */}
        {!readiness.criticalFieldsReady && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Missing required:</span>
                <ul className="mt-1 list-disc list-inside">
                  {readiness.missingCriticalFields.map((field) => (
                    <li key={field}>{getScopeFieldLabel(field)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Implementation Readiness View (IMPLEMENTING stage)
// ============================================

function ImplementationReadinessView({
  readiness,
}: {
  readiness?: ImplementationReadinessResult | null;
}) {
  if (!readiness) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Implementation Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No implementation data found.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Implementation Readiness
          </CardTitle>
          <span
            className={`text-2xl font-bold ${getScoreColor(readiness.score)}`}
          >
            {readiness.score}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(readiness.score)}`}
            style={{ width: `${readiness.score}%` }}
          />
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground">
          {readiness.pspStats.live + readiness.paymentMethodStats.live} of{" "}
          {readiness.pspImplementations.length +
            readiness.paymentMethodImplementations.length}{" "}
          implementations live
        </p>

        {/* Blocking items warning */}
        {!readiness.isComplete && readiness.blockingItems.psps.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start gap-2 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Blocking go-live:</span>
                <ul className="mt-1 list-disc list-inside">
                  {readiness.blockingItems.psps.map((psp) => (
                    <li key={psp}>PSP: {psp}</li>
                  ))}
                  {readiness.blockingItems.paymentMethods.map((pm) => (
                    <li key={pm}>Payment Method: {pm}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
