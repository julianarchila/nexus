import { db } from "@/core/db/client";
import { scopeInDoc, type FieldStatus } from "@/core/db/schema";
import { eq } from "drizzle-orm";

/**
 * Merges new array values with existing ones (deduplicates)
 */
function mergeArrayValues(existing: string[], newValues: unknown): string[] {
  if (!Array.isArray(newValues)) return existing;
  return [...new Set([...existing, ...newValues])];
}

/**
 * Determines field status based on whether value exists and is meaningful
 */
function determineFieldStatus(value: unknown): FieldStatus {
  if (value === null || value === undefined) return "MISSING";
  if (Array.isArray(value) && value.length === 0) return "MISSING";
  if (typeof value === "string" && value.trim() === "") return "MISSING";
  return "COMPLETE";
}

/**
 * Calculates if the scope is complete based on critical fields
 */
function calculateIsComplete(scope: {
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

export interface ApplyResult {
  oldValue: unknown;
  newValue: unknown;
  fieldStatus: FieldStatus;
}

/**
 * Applies an extraction to the scope_in_doc table
 * Returns the old and new values for audit logging
 */
export async function applyExtractionToScope(
  merchantId: string,
  scopeId: string,
  field: string,
  value: unknown,
): Promise<ApplyResult> {
  // First, get the current scope
  const [currentScope] = await db
    .select()
    .from(scopeInDoc)
    .where(eq(scopeInDoc.id, scopeId))
    .limit(1);

  if (!currentScope) {
    throw new Error(`Scope not found: ${scopeId}`);
  }

  // Field mapping: convert field names to database columns
  const fieldMapping: Record<string, string> = {
    psps: "psps",
    countries: "countries",
    payment_methods: "payment_methods",
    expected_volume: "expected_volume",
    expected_approval_rate: "expected_approval_rate",
    restrictions: "restrictions",
    dependencies: "dependencies",
    compliance_requirements: "compliance_requirements",
    expected_go_live_date: "expected_go_live_date",
    comes_from_mor: "comes_from_mor",
    deal_closed_by: "deal_closed_by",
  };

  const dbField = fieldMapping[field];
  if (!dbField) {
    throw new Error(`Unknown field: ${field}`);
  }

  // Get current value
  const oldValue = (currentScope as Record<string, unknown>)[dbField];

  // Determine new value based on field type
  let newValue: unknown;
  const arrayFields = [
    "psps",
    "countries",
    "payment_methods",
    "restrictions",
    "dependencies",
    "compliance_requirements",
  ];

  if (arrayFields.includes(field)) {
    // For array fields, merge with existing values
    const existingArray = (oldValue as string[]) ?? [];
    newValue = mergeArrayValues(existingArray, value);
  } else if (field === "expected_go_live_date") {
    // For dates, convert to Date object
    newValue = typeof value === "string" ? new Date(value) : value;
  } else {
    // For scalar fields, overwrite if new value exists
    newValue = value ?? oldValue;
  }

  // Determine field status
  const fieldStatus = determineFieldStatus(newValue);
  const statusField = `${dbField}_status`;

  // Build update object
  const updateData: Record<string, unknown> = {
    [dbField]: newValue,
    [statusField]: fieldStatus,
    updated_at: new Date(),
  };

  // Recalculate is_complete flag
  const updatedStatusFields = {
    psps_status:
      field === "psps"
        ? fieldStatus
        : (currentScope.psps_status as FieldStatus),
    countries_status:
      field === "countries"
        ? fieldStatus
        : (currentScope.countries_status as FieldStatus),
    payment_methods_status:
      field === "payment_methods"
        ? fieldStatus
        : (currentScope.payment_methods_status as FieldStatus),
    expected_volume_status:
      field === "expected_volume"
        ? fieldStatus
        : (currentScope.expected_volume_status as FieldStatus),
  };

  updateData.is_complete = calculateIsComplete(updatedStatusFields);

  // Apply update
  await db.update(scopeInDoc).set(updateData).where(eq(scopeInDoc.id, scopeId));

  return {
    oldValue,
    newValue,
    fieldStatus,
  };
}
