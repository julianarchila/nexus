"use client";

import { useQuery } from "@tanstack/react-query";

import {
  MERCHANT_STALE_TIME,
  useMerchantQueryOptions,
} from "../data-access/queries";

/**
 * Hook for merchant detail page
 * Fetches merchant profile, scope, and attachments
 */
export function useMerchantDetail(merchantId: string) {
  const queryOptions = useMerchantQueryOptions(merchantId);

  const merchantQuery = useQuery({
    ...queryOptions.merchant,
    staleTime: MERCHANT_STALE_TIME,
  });

  const attachmentsQuery = useQuery({
    ...queryOptions.attachments,
    staleTime: MERCHANT_STALE_TIME,
  });

  return {
    // Data
    merchant: merchantQuery.data?.merchant ?? null,
    scope: merchantQuery.data?.scope ?? null,
    attachments: attachmentsQuery.data ?? [],

    // State
    isLoading: merchantQuery.isLoading,
    isError: merchantQuery.isError,
    error: merchantQuery.error,
  };
}
