"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Circle,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Save,
  X,
  Download
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/lib/trpc/client";
import { useScopePDF } from "@/lib/pdf/use-scope-pdf";
import type { ScopePDFData } from "@/lib/pdf";

// Types for scope data
interface ScopeData {
  id: string;
  merchant_id: string;
  psps: string[] | null;
  psps_status: string;
  countries: string[] | null;
  countries_status: string;
  payment_methods: string[] | null;
  payment_methods_status: string;
  expected_volume: string | null;
  expected_volume_status: string;
  expected_approval_rate: string | null;
  expected_approval_rate_status: string;
  restrictions: string[] | null;
  restrictions_status: string;
  dependencies: string[] | null;
  dependencies_status: string;
  compliance_requirements: string[] | null;
  compliance_status: string;
  expected_go_live_date: Date | null;
  go_live_date_status: string;
  comes_from_mor: boolean;
  deal_closed_by: string | null;
}

interface ScopeEditorProps {
  scope: ScopeData;
  merchantId: string;
  merchantName?: string;
}

// Form state type
interface FormData {
  psps: string[];
  countries: string[];
  payment_methods: string[];
  expected_volume: string;
  expected_approval_rate: string;
  restrictions: string[];
  dependencies: string[];
  compliance_requirements: string[];
  expected_go_live_date: string;
  comes_from_mor: boolean;
  deal_closed_by: string;
}

// Critical fields required to move to IMPLEMENTING
const CRITICAL_FIELDS = ["psps", "countries", "payment_methods"] as const;

export function ScopeEditor({ scope, merchantId, merchantName = "Merchant" }: ScopeEditorProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>(scopeToFormData(scope));
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const { generatePDF, isGenerating } = useScopePDF();

  const updateScope = useMutation(
    trpc.scope.updateScope.mutationOptions({
      onSuccess: (data) => {
        if (data.changesCount > 0) {
          toast.success("Scope updated successfully");
          queryClient.invalidateQueries({
            queryKey: trpc.merchants.getById.queryKey(merchantId),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.auditLog.getByMerchantId.queryKey({
              merchantId,
              page: 1,
              pageSize: 20,
            }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.pipeline.getScopeReadiness.queryKey(merchantId),
          });
        } else {
          toast.info("No changes to save");
        }
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(`Failed to update: ${error.message}`);
      },
    }),
  );

  const startEditing = useCallback(() => {
    setFormData(scopeToFormData(scope));
    setTagInputs({});
    setIsEditing(true);
  }, [scope]);

  const cancelEditing = useCallback(() => {
    setFormData(scopeToFormData(scope));
    setTagInputs({});
    setIsEditing(false);
  }, [scope]);

  const handleSave = useCallback(() => {
    // Convert form data back to scope updates
    const updates: Record<string, unknown> = {};

    // Arrays
    updates.psps = formData.psps.length > 0 ? formData.psps : [];
    updates.countries = formData.countries.length > 0 ? formData.countries : [];
    updates.payment_methods =
      formData.payment_methods.length > 0 ? formData.payment_methods : [];
    updates.restrictions =
      formData.restrictions.length > 0 ? formData.restrictions : [];
    updates.dependencies =
      formData.dependencies.length > 0 ? formData.dependencies : [];
    updates.compliance_requirements =
      formData.compliance_requirements.length > 0
        ? formData.compliance_requirements
        : [];

    // Text fields
    updates.expected_volume = formData.expected_volume || null;
    updates.expected_approval_rate = formData.expected_approval_rate || null;
    updates.deal_closed_by = formData.deal_closed_by || null;

    // Date
    updates.expected_go_live_date = formData.expected_go_live_date
      ? new Date(formData.expected_go_live_date)
      : null;

    // Boolean
    updates.comes_from_mor = formData.comes_from_mor;

    updateScope.mutate({
      merchantId,
      scopeId: scope.id,
      userId: "current-user", // TODO: Get from auth context
      updates,
    });
  }, [formData, merchantId, scope.id, updateScope]);

  // Tag input handlers
  const handleTagKeyDown = useCallback(
    (field: keyof FormData, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = tagInputs[field]?.trim();
        if (value && Array.isArray(formData[field])) {
          const currentArray = formData[field] as string[];
          if (!currentArray.includes(value)) {
            setFormData((prev) => ({
              ...prev,
              [field]: [...currentArray, value],
            }));
          }
          setTagInputs((prev) => ({ ...prev, [field]: "" }));
        }
      }
    },
    [formData, tagInputs],
  );

  const addTag = useCallback(
    (field: keyof FormData) => {
      const value = tagInputs[field]?.trim();
      if (value && Array.isArray(formData[field])) {
        const currentArray = formData[field] as string[];
        if (!currentArray.includes(value)) {
          setFormData((prev) => ({
            ...prev,
            [field]: [...currentArray, value],
          }));
        }
        setTagInputs((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [formData, tagInputs],
  );

  const removeTag = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((v) => v !== value),
    }));
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    const pdfData: ScopePDFData = {
      merchantName,
      merchantId,
      generatedDate: new Date(),
      scope: {
        psps: scope.psps || [],
        pspsStatus: scope.psps_status,
        countries: scope.countries || [],
        countriesStatus: scope.countries_status,
        paymentMethods: scope.payment_methods || [],
        paymentMethodsStatus: scope.payment_methods_status,
        expectedVolume: scope.expected_volume,
        expectedVolumeStatus: scope.expected_volume_status,
        expectedApprovalRate: scope.expected_approval_rate,
        expectedApprovalRateStatus: scope.expected_approval_rate_status,
        restrictions: scope.restrictions || [],
        restrictionsStatus: scope.restrictions_status,
        dependencies: scope.dependencies || [],
        dependenciesStatus: scope.dependencies_status,
        complianceRequirements: scope.compliance_requirements || [],
        complianceStatus: scope.compliance_status,
        expectedGoLiveDate: scope.expected_go_live_date ? new Date(scope.expected_go_live_date) : null,
        goLiveDateStatus: scope.go_live_date_status,
        comesFromMor: scope.comes_from_mor,
        dealClosedBy: scope.deal_closed_by,
      },
    };

    await generatePDF(pdfData);
  }, [scope, merchantId, merchantName, generatePDF]);

  // Check missing critical fields for warning
  const missingCriticalFields = CRITICAL_FIELDS.filter((field) => {
    const value = formData[field];
    return !value || (Array.isArray(value) && value.length === 0);
  });

  // VIEW MODE
  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500" />
            Scope In Doc
          </h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Scope
            </Button>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {/* Core Requirements */}
          <FieldSection title="Core Requirements">
            <ViewField
              label="PSPs"
              value={scope.psps}
              status={scope.psps_status}
              isCritical
            />
            <ViewField
              label="Countries"
              value={scope.countries}
              status={scope.countries_status}
              isCritical
            />
            <ViewField
              label="Payment Methods"
              value={scope.payment_methods}
              status={scope.payment_methods_status}
              isCritical
            />
          </FieldSection>

          {/* Metrics */}
          <FieldSection title="Metrics">
            <ViewField
              label="Expected Volume"
              value={scope.expected_volume}
              status={scope.expected_volume_status}
            />
            <ViewField
              label="Expected Approval Rate"
              value={scope.expected_approval_rate}
              status={scope.expected_approval_rate_status}
            />
          </FieldSection>

          {/* Constraints */}
          <FieldSection title="Constraints">
            <ViewField
              label="Restrictions"
              value={scope.restrictions}
              status={scope.restrictions_status}
            />
            <ViewField
              label="Dependencies"
              value={scope.dependencies}
              status={scope.dependencies_status}
            />
            <ViewField
              label="Compliance Requirements"
              value={scope.compliance_requirements}
              status={scope.compliance_status}
            />
          </FieldSection>

          {/* Context */}
          <FieldSection title="Context">
            <ViewField
              label="Expected Go-Live Date"
              value={
                scope.expected_go_live_date
                  ? new Date(scope.expected_go_live_date).toLocaleDateString()
                  : null
              }
              status={scope.go_live_date_status}
            />
            <ViewField
              label="Comes from MOR"
              value={scope.comes_from_mor ? "Yes" : "No"}
              status="COMPLETE"
            />
            <ViewField
              label="Deal Closed By"
              value={scope.deal_closed_by}
              status={scope.deal_closed_by ? "COMPLETE" : "MISSING"}
            />
          </FieldSection>
        </div>
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          Edit Scope
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cancelEditing}
            disabled={updateScope.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateScope.isPending}
          >
            {updateScope.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {/* Core Requirements */}
        <FieldSection title="Core Requirements">
          <TagField
            label="PSPs"
            values={formData.psps}
            inputValue={tagInputs.psps || ""}
            onInputChange={(v) => setTagInputs((p) => ({ ...p, psps: v }))}
            onKeyDown={(e) => handleTagKeyDown("psps", e)}
            onAdd={() => addTag("psps")}
            onRemove={(v) => removeTag("psps", v)}
            placeholder="Add PSP..."
            isCritical
          />
          <TagField
            label="Countries"
            values={formData.countries}
            inputValue={tagInputs.countries || ""}
            onInputChange={(v) => setTagInputs((p) => ({ ...p, countries: v }))}
            onKeyDown={(e) => handleTagKeyDown("countries", e)}
            onAdd={() => addTag("countries")}
            onRemove={(v) => removeTag("countries", v)}
            placeholder="Add country code (e.g. BR, MX)..."
            isCritical
          />
          <TagField
            label="Payment Methods"
            values={formData.payment_methods}
            inputValue={tagInputs.payment_methods || ""}
            onInputChange={(v) =>
              setTagInputs((p) => ({ ...p, payment_methods: v }))
            }
            onKeyDown={(e) => handleTagKeyDown("payment_methods", e)}
            onAdd={() => addTag("payment_methods")}
            onRemove={(v) => removeTag("payment_methods", v)}
            placeholder="Add payment method..."
            isCritical
          />
        </FieldSection>

        {/* Metrics */}
        <FieldSection title="Metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Expected Volume"
              value={formData.expected_volume}
              onChange={(v) =>
                setFormData((p) => ({ ...p, expected_volume: v }))
              }
              placeholder="e.g. $10M/month"
            />
            <TextField
              label="Expected Approval Rate"
              value={formData.expected_approval_rate}
              onChange={(v) =>
                setFormData((p) => ({ ...p, expected_approval_rate: v }))
              }
              placeholder="e.g. 85%"
            />
          </div>
        </FieldSection>

        {/* Constraints */}
        <FieldSection title="Constraints">
          <TagField
            label="Restrictions"
            values={formData.restrictions}
            inputValue={tagInputs.restrictions || ""}
            onInputChange={(v) =>
              setTagInputs((p) => ({ ...p, restrictions: v }))
            }
            onKeyDown={(e) => handleTagKeyDown("restrictions", e)}
            onAdd={() => addTag("restrictions")}
            onRemove={(v) => removeTag("restrictions", v)}
            placeholder="Add restriction..."
          />
          <TagField
            label="Dependencies"
            values={formData.dependencies}
            inputValue={tagInputs.dependencies || ""}
            onInputChange={(v) =>
              setTagInputs((p) => ({ ...p, dependencies: v }))
            }
            onKeyDown={(e) => handleTagKeyDown("dependencies", e)}
            onAdd={() => addTag("dependencies")}
            onRemove={(v) => removeTag("dependencies", v)}
            placeholder="Add dependency..."
          />
          <TagField
            label="Compliance Requirements"
            values={formData.compliance_requirements}
            inputValue={tagInputs.compliance_requirements || ""}
            onInputChange={(v) =>
              setTagInputs((p) => ({ ...p, compliance_requirements: v }))
            }
            onKeyDown={(e) => handleTagKeyDown("compliance_requirements", e)}
            onAdd={() => addTag("compliance_requirements")}
            onRemove={(v) => removeTag("compliance_requirements", v)}
            placeholder="Add requirement..."
          />
        </FieldSection>

        {/* Context */}
        <FieldSection title="Context">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-2">
                Expected Go-Live Date
              </label>
              <Input
                type="date"
                value={formData.expected_go_live_date}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    expected_go_live_date: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-2">
                Comes from MOR
              </label>
              <div className="flex items-center gap-4 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.comes_from_mor === true}
                    onChange={() =>
                      setFormData((p) => ({ ...p, comes_from_mor: true }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.comes_from_mor === false}
                    onChange={() =>
                      setFormData((p) => ({ ...p, comes_from_mor: false }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
            <TextField
              label="Deal Closed By"
              value={formData.deal_closed_by}
              onChange={(v) =>
                setFormData((p) => ({ ...p, deal_closed_by: v }))
              }
              placeholder="Name..."
            />
          </div>
        </FieldSection>

        {/* Validation Warning */}
        {missingCriticalFields.length > 0 && (
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Missing required fields:</span>{" "}
              {missingCriticalFields
                .map((f) => fieldLabels[f as keyof typeof fieldLabels])
                .join(", ")}
              . You can still save, but these are required to move to
              Implementing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================
// HELPER COMPONENTS
// ===========================================

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-5">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        {title}
      </h4>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ViewField({
  label,
  value,
  status,
  isCritical = false,
}: {
  label: string;
  value: string | string[] | null;
  status: string;
  isCritical?: boolean;
}) {
  const isComplete = status === "COMPLETE";
  const isEmpty =
    !value || (Array.isArray(value) && value.length === 0) || value === "";

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-500">{label}</span>
          {isCritical && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Required
            </Badge>
          )}
        </div>
        <div className="text-sm">
          {isEmpty ? (
            <span className="text-slate-400">-</span>
          ) : Array.isArray(value) ? (
            <div className="flex flex-wrap gap-1">
              {value.map((item) => (
                <span
                  key={item}
                  className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-900">{value}</span>
          )}
        </div>
      </div>
      <div className="ml-4">
        {isComplete ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4 text-slate-300" />
        )}
      </div>
    </div>
  );
}

function TagField({
  label,
  values,
  inputValue,
  onInputChange,
  onKeyDown,
  onAdd,
  onRemove,
  placeholder,
  isCritical = false,
}: {
  label: string;
  values: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
  placeholder: string;
  isCritical?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-medium text-slate-500">{label}</label>
        {isCritical && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Required
          </Badge>
        )}
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {values.map((item) => (
            <span
              key={item}
              className="px-2 py-1 bg-slate-100 rounded text-xs font-medium flex items-center gap-1"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 block mb-2">
        {label}
      </label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ===========================================
// HELPERS
// ===========================================

const fieldLabels = {
  psps: "PSPs",
  countries: "Countries",
  payment_methods: "Payment Methods",
};

function scopeToFormData(scope: ScopeData): FormData {
  return {
    psps: scope.psps || [],
    countries: scope.countries || [],
    payment_methods: scope.payment_methods || [],
    expected_volume: scope.expected_volume || "",
    expected_approval_rate: scope.expected_approval_rate || "",
    restrictions: scope.restrictions || [],
    dependencies: scope.dependencies || [],
    compliance_requirements: scope.compliance_requirements || [],
    expected_go_live_date: scope.expected_go_live_date
      ? new Date(scope.expected_go_live_date).toISOString().split("T")[0]
      : "",
    comes_from_mor: scope.comes_from_mor,
    deal_closed_by: scope.deal_closed_by || "",
  };
}
