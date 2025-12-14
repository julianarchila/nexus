import type { FieldStatus } from "@/core/db/schema";

/**
 * Merges new array values with existing ones (deduplicates)
 */
export function mergeArrayValues(
  existing: string[],
  newValues: unknown,
): string[] {
  if (!Array.isArray(newValues)) return existing;
  return [...new Set([...existing, ...newValues])];
}

/**
 * Determines field status based on whether value exists and is meaningful
 */
export function determineFieldStatus(value: unknown): FieldStatus {
  if (value === null || value === undefined) return "MISSING";
  if (Array.isArray(value) && value.length === 0) return "MISSING";
  if (typeof value === "string" && value.trim() === "") return "MISSING";
  return "COMPLETE";
}

/**
 * Calculates if the scope is complete based on critical fields
 */
export function calculateIsComplete(scope: {
  psps_status: FieldStatus;
  countries_status: FieldStatus;
  payment_methods_status: FieldStatus;
  expected_volume_status: FieldStatus;
}): boolean {
  // At minimum, PSPs, countries, and payment methods should be COMPLETE or PARTIAL
  const criticalFields = [
    scope.psps_status,
    scope.countries_status,
    scope.payment_methods_status,
  ];

  return criticalFields.every((status) => status !== "MISSING");
}
