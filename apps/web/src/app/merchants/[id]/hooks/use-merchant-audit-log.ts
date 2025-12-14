"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useTRPC } from "@/lib/trpc/client";

import { AUDIT_LOG_STALE_TIME } from "../data-access/queries";

type ActorType = "AI" | "USER" | "SYSTEM";

/**
 * Hook for paginated audit logs
 * Pattern 2: Server-side pagination for large datasets
 */
export function useMerchantAuditLog(merchantId: string) {
  const [page, setPage] = useState(1);
  const [actorFilter, setActorFilter] = useState<ActorType | undefined>();
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.auditLog.getByMerchantId.queryOptions({
      merchantId,
      page,
      pageSize: 20,
      actorType: actorFilter,
    }),
    staleTime: AUDIT_LOG_STALE_TIME,
    placeholderData: keepPreviousData, // Keep previous page while loading next
  });

  return {
    // Data
    logs: query.data?.data ?? [],
    pagination: query.data?.pagination,

    // State
    isLoading: query.isLoading,
    isFetching: query.isFetching,

    // Controls
    page,
    setPage,
    actorFilter,
    setActorFilter,
  };
}
