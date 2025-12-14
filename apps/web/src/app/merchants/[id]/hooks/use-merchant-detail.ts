"use client";

import { useQuery } from "@tanstack/react-query";

import {
  MERCHANT_STALE_TIME,
  useMerchantQueryOptions,
  usePipelineQueryOptions,
} from "../data-access/queries";

/**
 * Hook for merchant detail page
 * Fetches merchant profile, scope, attachments, and pipeline readiness
 */
export function useMerchantDetail(merchantId: string) {
  const queryOptions = useMerchantQueryOptions(merchantId);
  const pipelineOptions = usePipelineQueryOptions(merchantId);

  const merchantQuery = useQuery({
    ...queryOptions.merchant,
    staleTime: MERCHANT_STALE_TIME,
  });

  const attachmentsQuery = useQuery({
    ...queryOptions.attachments,
    staleTime: MERCHANT_STALE_TIME,
  });

  // Fetch scope readiness only when in SCOPING stage
  const scopeReadinessQuery = useQuery({
    ...pipelineOptions.scopeReadiness,
    staleTime: MERCHANT_STALE_TIME,
    enabled: merchantQuery.data?.merchant?.lifecycle_stage === "SCOPING",
  });

  // Fetch implementation readiness only when in IMPLEMENTING stage
  const implementationReadinessQuery = useQuery({
    ...pipelineOptions.implementationReadiness,
    staleTime: MERCHANT_STALE_TIME,
    enabled: merchantQuery.data?.merchant?.lifecycle_stage === "IMPLEMENTING",
  });

  return {
    // Data
    merchant: merchantQuery.data?.merchant ?? null,
    scope: merchantQuery.data?.scope ?? null,
    attachments: attachmentsQuery.data ?? [],
    scopeReadiness: scopeReadinessQuery.data ?? null,
    implementationReadiness: implementationReadinessQuery.data ?? null,

    // State
    isLoading: merchantQuery.isLoading,
    isError: merchantQuery.isError,
    error: merchantQuery.error,
  };
}
