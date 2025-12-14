"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Circle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LifecycleStage } from "@/core/db/schema";
import { getScopeFieldLabel } from "@/core/domain/scope/scope-readiness";
import { useTRPC } from "@/lib/trpc/client";

interface StageTransitionModalProps {
  merchantId: string;
  merchantName: string;
  currentStage: LifecycleStage;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for transitioning merchants between pipeline stages.
 * Handles SCOPING → IMPLEMENTING and IMPLEMENTING → LIVE transitions.
 */
export function StageTransitionModal({
  merchantId,
  merchantName,
  currentStage,
  isOpen,
  onClose,
}: StageTransitionModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [userFeedback, setUserFeedback] = useState("");
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<
    Array<{
      type: "PSP_NOT_SUPPORTED" | "PAYMENT_METHOD_NOT_SUPPORTED";
      processor_id?: string;
      payment_method?: string;
      message: string;
    }>
  >([]);

  // Determine target stage
  const targetStage: LifecycleStage | null =
    currentStage === "SCOPING"
      ? "IMPLEMENTING"
      : currentStage === "IMPLEMENTING"
        ? "LIVE"
        : null;

  // Get scope readiness for SCOPING → IMPLEMENTING transitions
  const { data: scopeReadiness, isLoading: scopeReadinessLoading } = useQuery({
    ...trpc.pipeline.getScopeReadiness.queryOptions(merchantId),
    enabled: isOpen && currentStage === "SCOPING",
  });

  // Preview the transition
  const { data: implementingPreview, isLoading: previewingImplementing } =
    useQuery({
      ...trpc.pipeline.previewTransitionToImplementing.queryOptions({
        merchantId,
      }),
      enabled: isOpen && currentStage === "SCOPING",
    });

  const { data: livePreview, isLoading: previewingLive } = useQuery({
    ...trpc.pipeline.previewTransitionToLive.queryOptions(merchantId),
    enabled: isOpen && currentStage === "IMPLEMENTING",
  });

  // Transition mutations
  const transitionToImplementing = useMutation(
    trpc.pipeline.transitionToImplementing.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.merchants.getById.queryKey(merchantId),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.pipeline.getScopeReadiness.queryKey(merchantId),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.implementations.getPspImplementations.queryKey(merchantId),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.implementations.getPaymentMethodImplementations.queryKey(
              merchantId,
            ),
        });
        onClose();
      },
    }),
  );

  const transitionToLive = useMutation(
    trpc.pipeline.transitionToLive.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.merchants.getById.queryKey(merchantId),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.pipeline.getImplementationReadiness.queryKey(merchantId),
        });
        onClose();
      },
    }),
  );

  const preview =
    currentStage === "SCOPING" ? implementingPreview : livePreview;
  const isPreviewing =
    previewingImplementing || previewingLive || scopeReadinessLoading;
  const isTransitioning =
    transitionToImplementing.isPending || transitionToLive.isPending;

  // Handle warning acknowledgment
  const handleAcknowledgeWarning = (
    warning: NonNullable<typeof preview>["warnings"][0],
  ) => {
    const alreadyAcked = acknowledgedWarnings.some(
      (w) =>
        w.type === warning.type &&
        w.processor_id === warning.processor_id &&
        w.payment_method === warning.payment_method,
    );

    if (alreadyAcked) {
      setAcknowledgedWarnings((prev) =>
        prev.filter(
          (w) =>
            !(
              w.type === warning.type &&
              w.processor_id === warning.processor_id &&
              w.payment_method === warning.payment_method
            ),
        ),
      );
    } else {
      setAcknowledgedWarnings((prev) => [...prev, warning]);
    }
  };

  const allWarningsAcknowledged =
    !preview?.warnings.length ||
    preview.warnings.every((w) =>
      acknowledgedWarnings.some(
        (ack) =>
          ack.type === w.type &&
          ack.processor_id === w.processor_id &&
          ack.payment_method === w.payment_method,
      ),
    );

  const canTransition = preview?.canTransition && allWarningsAcknowledged;

  const handleTransition = () => {
    if (currentStage === "SCOPING") {
      transitionToImplementing.mutate({
        merchantId,
        userId: "current-user", // TODO: Get from auth context
        userFeedback: userFeedback || undefined,
        acknowledgedWarnings,
      });
    } else if (currentStage === "IMPLEMENTING") {
      transitionToLive.mutate({
        merchantId,
        userId: "current-user", // TODO: Get from auth context
        userFeedback: userFeedback || undefined,
      });
    }
  };

  if (!targetStage) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Move to {targetStage}
          </DialogTitle>
          <DialogDescription>
            Transition <span className="font-medium">{merchantName}</span> from{" "}
            <Badge variant="outline" className="mx-1">
              {currentStage}
            </Badge>
            <ArrowRight className="inline h-3 w-3 mx-1" />
            <Badge variant="outline" className="mx-1">
              {targetStage}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading state */}
          {isPreviewing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Validating transition...
              </span>
            </div>
          )}

          {/* Scope Readiness Check - only for SCOPING → IMPLEMENTING */}
          {!isPreviewing &&
            currentStage === "SCOPING" &&
            scopeReadiness &&
            scopeReadiness.fieldStatuses && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3 text-sm">
                  Scope Readiness Check
                </h4>
                <div className="space-y-2">
                  {scopeReadiness.fieldStatuses.map((field) => (
                    <div
                      key={field.field}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {field.status === "COMPLETE" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300" />
                        )}
                        <span
                          className={
                            field.isCritical ? "font-medium" : "text-slate-600"
                          }
                        >
                          {getScopeFieldLabel(field.field)}
                        </span>
                        {field.isCritical && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Required
                          </Badge>
                        )}
                      </div>
                      <span
                        className={
                          field.status === "COMPLETE"
                            ? "text-green-600 text-xs"
                            : "text-slate-400 text-xs"
                        }
                      >
                        {field.status === "COMPLETE" ? "Complete" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Errors */}
          {!isPreviewing && preview && preview.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-red-900">
                    Cannot transition - requirements not met
                  </h4>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {preview.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Platform Support Warnings */}
          {!isPreviewing && preview && preview.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <h4 className="font-medium text-amber-900">
                    Platform Support Warnings
                  </h4>
                  <div className="space-y-2">
                    {preview.warnings.map((warning) => {
                      const warningKey = `${warning.type}-${warning.processor_id ?? ""}-${warning.payment_method ?? ""}`;
                      const isAcked = acknowledgedWarnings.some(
                        (w) =>
                          w.type === warning.type &&
                          w.processor_id === warning.processor_id &&
                          w.payment_method === warning.payment_method,
                      );
                      return (
                        <div
                          key={warningKey}
                          className="flex items-start gap-2 text-sm text-amber-800 cursor-pointer"
                        >
                          <input
                            id={warningKey}
                            type="checkbox"
                            checked={isAcked}
                            onChange={() => handleAcknowledgeWarning(warning)}
                            className="mt-0.5"
                          />
                          <label htmlFor={warningKey}>{warning.message}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success - ready to transition */}
          {!isPreviewing &&
            preview &&
            preview.errors.length === 0 &&
            preview.warnings.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-green-900">
                      Ready to transition
                    </h4>
                    <p className="text-sm text-green-700">
                      All requirements are met. You can proceed with the
                      transition.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Optional feedback */}
          {!isPreviewing && preview && preview.canTransition && (
            <div className="space-y-2">
              <label
                htmlFor="transition-notes"
                className="text-sm font-medium text-slate-700"
              >
                Notes (optional)
              </label>
              <textarea
                id="transition-notes"
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                placeholder="Add any notes about this transition..."
                className="w-full px-3 py-2 text-sm border rounded-md min-h-[80px] resize-none"
              />
            </div>
          )}

          {/* Transition error */}
          {(transitionToImplementing.error || transitionToLive.error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                {transitionToImplementing.error?.message ||
                  transitionToLive.error?.message}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isTransitioning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransition}
            disabled={!canTransition || isTransitioning || isPreviewing}
          >
            {isTransitioning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transitioning...
              </>
            ) : (
              <>
                Move to {targetStage}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
