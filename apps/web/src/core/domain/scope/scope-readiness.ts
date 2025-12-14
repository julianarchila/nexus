import type { FieldStatus } from "@/core/db/schema";

/**
 * Scope readiness calculator
 *
 * Calculates how complete the merchant's scope document is during the SCOPING phase.
 * This helps determine if a merchant is ready to move to IMPLEMENTING.
 */

// Fields tracked for scope readiness
const SCOPE_FIELDS = [
  "psps",
  "countries",
  "payment_methods",
  "expected_volume",
  "expected_approval_rate",
  "restrictions",
  "dependencies",
  "compliance_requirements",
  "expected_go_live_date",
] as const;

// Critical fields that must have at least PARTIAL status to allow transition
export const CRITICAL_FIELDS = [
  "psps",
  "countries",
  "payment_methods",
] as const;

export type ScopeField = (typeof SCOPE_FIELDS)[number];

export interface FieldReadiness {
  field: ScopeField;
  status: FieldStatus;
  isCritical: boolean;
}

export interface ScopeReadinessResult {
  /** Overall readiness score 0-100 */
  score: number;
  /** Total number of fields tracked */
  totalFields: number;
  /** Fields with COMPLETE status */
  completedFields: number;
  /** Fields with MISSING status */
  missingFields: number;
  /** Detailed status per field */
  fieldStatuses: FieldReadiness[];
  /** Whether all critical fields are COMPLETE */
  criticalFieldsReady: boolean;
  /** List of critical fields that are still MISSING */
  missingCriticalFields: ScopeField[];
}

export interface ScopeData {
  psps_status: FieldStatus;
  countries_status: FieldStatus;
  payment_methods_status: FieldStatus;
  expected_volume_status: FieldStatus;
  expected_approval_rate_status: FieldStatus;
  restrictions_status: FieldStatus;
  dependencies_status: FieldStatus;
  compliance_status: FieldStatus;
  go_live_date_status: FieldStatus;
}

/**
 * Calculate the scope readiness for a merchant's scope document.
 *
 * Scoring:
 * - COMPLETE: 100 points
 * - PARTIAL: 50 points
 * - MISSING: 0 points
 *
 * All fields are weighted equally.
 */
export function calculateScopeReadiness(
  scope: ScopeData,
): ScopeReadinessResult {
  const fieldStatuses: FieldReadiness[] = [
    {
      field: "psps",
      status: scope.psps_status,
      isCritical: true,
    },
    {
      field: "countries",
      status: scope.countries_status,
      isCritical: true,
    },
    {
      field: "payment_methods",
      status: scope.payment_methods_status,
      isCritical: true,
    },
    {
      field: "expected_volume",
      status: scope.expected_volume_status,
      isCritical: false,
    },
    {
      field: "expected_approval_rate",
      status: scope.expected_approval_rate_status,
      isCritical: false,
    },
    {
      field: "restrictions",
      status: scope.restrictions_status,
      isCritical: false,
    },
    {
      field: "dependencies",
      status: scope.dependencies_status,
      isCritical: false,
    },
    {
      field: "compliance_requirements",
      status: scope.compliance_status,
      isCritical: false,
    },
    {
      field: "expected_go_live_date",
      status: scope.go_live_date_status,
      isCritical: false,
    },
  ];

  let totalScore = 0;
  let completedFields = 0;
  let missingFields = 0;

  for (const fieldStatus of fieldStatuses) {
    switch (fieldStatus.status) {
      case "COMPLETE":
        totalScore += 100;
        completedFields++;
        break;
      case "MISSING":
        missingFields++;
        break;
    }
  }

  const totalFields = fieldStatuses.length;
  const score = Math.round(totalScore / totalFields);

  // Check critical fields
  const missingCriticalFields: ScopeField[] = [];
  for (const field of CRITICAL_FIELDS) {
    const fieldData = fieldStatuses.find((f) => f.field === field);
    if (fieldData?.status === "MISSING") {
      missingCriticalFields.push(field);
    }
  }

  return {
    score,
    totalFields,
    completedFields,
    missingFields,
    fieldStatuses,
    criticalFieldsReady: missingCriticalFields.length === 0,
    missingCriticalFields,
  };
}

/**
 * Get a human-readable label for a scope field
 */
export function getScopeFieldLabel(field: ScopeField): string {
  const labels: Record<ScopeField, string> = {
    psps: "Payment Processors (PSPs)",
    countries: "Countries",
    payment_methods: "Payment Methods",
    expected_volume: "Expected Volume",
    expected_approval_rate: "Expected Approval Rate",
    restrictions: "Restrictions",
    dependencies: "Dependencies",
    compliance_requirements: "Compliance Requirements",
    expected_go_live_date: "Expected Go-Live Date",
  };
  return labels[field];
}
