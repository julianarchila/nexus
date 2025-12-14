"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ImplementationStatus } from "@/core/db/schema";
import { useTRPC } from "@/lib/trpc/client";

interface ImplementationTrackerProps {
  merchantId: string;
}

const STATUS_OPTIONS: { value: ImplementationStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "LIVE", label: "Live" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "NOT_REQUIRED", label: "Not Required" },
];

const getStatusBadgeVariant = (status: ImplementationStatus) => {
  switch (status) {
    case "LIVE":
      return "success";
    case "IN_PROGRESS":
      return "warning";
    case "BLOCKED":
      return "destructive";
    case "NOT_REQUIRED":
      return "secondary";
    default:
      return "outline";
  }
};

/**
 * Shows and allows editing of PSP and Payment Method implementations for a merchant
 */
export function ImplementationTracker({
  merchantId,
}: ImplementationTrackerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch implementations
  const { data: pspImplementations, isLoading: pspLoading } = useQuery(
    trpc.implementations.getPspImplementations.queryOptions(merchantId),
  );

  const { data: pmImplementations, isLoading: pmLoading } = useQuery(
    trpc.implementations.getPaymentMethodImplementations.queryOptions(
      merchantId,
    ),
  );

  // Mutations
  const updatePspStatus = useMutation(
    trpc.implementations.updatePspImplementationStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            trpc.implementations.getPspImplementations.queryKey(merchantId),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.pipeline.getImplementationReadiness.queryKey(merchantId),
        });
      },
    }),
  );

  const updatePmStatus = useMutation(
    trpc.implementations.updatePaymentMethodImplementationStatus.mutationOptions(
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey:
              trpc.implementations.getPaymentMethodImplementations.queryKey(
                merchantId,
              ),
          });
          queryClient.invalidateQueries({
            queryKey:
              trpc.pipeline.getImplementationReadiness.queryKey(merchantId),
          });
        },
      },
    ),
  );

  const isLoading = pspLoading || pmLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Implementation Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Loading implementations...
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasPspImplementations =
    pspImplementations && pspImplementations.length > 0;
  const hasPmImplementations =
    pmImplementations && pmImplementations.length > 0;

  if (!hasPspImplementations && !hasPmImplementations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Implementation Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No implementations to track yet. Move this merchant to IMPLEMENTING
            stage to create implementation records.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Implementation Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PSP Implementations */}
        {hasPspImplementations && (
          <div>
            <h4 className="text-sm font-medium mb-3">PSP Implementations</h4>
            <div className="border rounded-md divide-y">
              {pspImplementations.map((impl) => (
                <PspImplementationRow
                  key={impl.id}
                  implementation={impl}
                  onStatusChange={(status, reason) => {
                    updatePspStatus.mutate({
                      implementationId: impl.id,
                      status,
                      blockedReason: status === "BLOCKED" ? reason : undefined,
                      notRequiredReason:
                        status === "NOT_REQUIRED" ? reason : undefined,
                    });
                  }}
                  isUpdating={updatePspStatus.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Payment Method Implementations */}
        {hasPmImplementations && (
          <div>
            <h4 className="text-sm font-medium mb-3">
              Payment Method Implementations
            </h4>
            <div className="border rounded-md divide-y">
              {pmImplementations.map((impl) => (
                <PaymentMethodImplementationRow
                  key={impl.id}
                  implementation={impl}
                  onStatusChange={(status, reason) => {
                    updatePmStatus.mutate({
                      implementationId: impl.id,
                      status,
                      blockedReason: status === "BLOCKED" ? reason : undefined,
                      notRequiredReason:
                        status === "NOT_REQUIRED" ? reason : undefined,
                    });
                  }}
                  isUpdating={updatePmStatus.isPending}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// PSP Implementation Row
// ============================================

interface PspImplementationRowProps {
  implementation: {
    id: string;
    processor_id: string;
    status: ImplementationStatus;
    platform_supported: boolean;
    blocked_reason: string | null;
    not_required_reason: string | null;
    started_at: Date | null;
    completed_at: Date | null;
  };
  onStatusChange: (status: ImplementationStatus, reason?: string) => void;
  isUpdating: boolean;
}

function PspImplementationRow({
  implementation,
  onStatusChange,
  isUpdating,
}: PspImplementationRowProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<ImplementationStatus | null>(null);
  const [reason, setReason] = useState("");

  const handleStatusSelect = (status: ImplementationStatus) => {
    if (status === "BLOCKED" || status === "NOT_REQUIRED") {
      setPendingStatus(status);
      setShowReasonInput(true);
    } else {
      onStatusChange(status);
    }
  };

  const handleReasonSubmit = () => {
    if (pendingStatus) {
      onStatusChange(pendingStatus, reason);
      setShowReasonInput(false);
      setPendingStatus(null);
      setReason("");
    }
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{implementation.processor_id}</span>
          {!implementation.platform_supported && (
            <Badge variant="outline" className="text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              New integration
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUpdating}>
              <Badge
                variant={getStatusBadgeVariant(implementation.status)}
                className="mr-2"
              >
                {implementation.status}
              </Badge>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reason display */}
      {implementation.blocked_reason && (
        <p className="text-sm text-red-600 mt-2">
          Blocked: {implementation.blocked_reason}
        </p>
      )}
      {implementation.not_required_reason && (
        <p className="text-sm text-gray-600 mt-2">
          Not required: {implementation.not_required_reason}
        </p>
      )}

      {/* Reason input */}
      {showReasonInput && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Why is this ${pendingStatus === "BLOCKED" ? "blocked" : "not required"}?`}
            className="w-full px-3 py-2 text-sm border rounded-md"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReasonSubmit}>
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowReasonInput(false);
                setPendingStatus(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Payment Method Implementation Row
// ============================================

interface PaymentMethodImplementationRowProps {
  implementation: {
    id: string;
    payment_method: string;
    status: ImplementationStatus;
    platform_supported: boolean;
    blocked_reason: string | null;
    not_required_reason: string | null;
    started_at: Date | null;
    completed_at: Date | null;
  };
  onStatusChange: (status: ImplementationStatus, reason?: string) => void;
  isUpdating: boolean;
}

function PaymentMethodImplementationRow({
  implementation,
  onStatusChange,
  isUpdating,
}: PaymentMethodImplementationRowProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<ImplementationStatus | null>(null);
  const [reason, setReason] = useState("");

  const handleStatusSelect = (status: ImplementationStatus) => {
    if (status === "BLOCKED" || status === "NOT_REQUIRED") {
      setPendingStatus(status);
      setShowReasonInput(true);
    } else {
      onStatusChange(status);
    }
  };

  const handleReasonSubmit = () => {
    if (pendingStatus) {
      onStatusChange(pendingStatus, reason);
      setShowReasonInput(false);
      setPendingStatus(null);
      setReason("");
    }
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{implementation.payment_method}</span>
          {!implementation.platform_supported && (
            <Badge variant="outline" className="text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              New integration
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUpdating}>
              <Badge
                variant={getStatusBadgeVariant(implementation.status)}
                className="mr-2"
              >
                {implementation.status}
              </Badge>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reason display */}
      {implementation.blocked_reason && (
        <p className="text-sm text-red-600 mt-2">
          Blocked: {implementation.blocked_reason}
        </p>
      )}
      {implementation.not_required_reason && (
        <p className="text-sm text-gray-600 mt-2">
          Not required: {implementation.not_required_reason}
        </p>
      )}

      {/* Reason input */}
      {showReasonInput && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Why is this ${pendingStatus === "BLOCKED" ? "blocked" : "not required"}?`}
            className="w-full px-3 py-2 text-sm border rounded-md"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReasonSubmit}>
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowReasonInput(false);
                setPendingStatus(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
