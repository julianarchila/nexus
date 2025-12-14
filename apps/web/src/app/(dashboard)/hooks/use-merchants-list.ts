"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type { LifecycleStage } from "@/core/db/schema";

import {
  MERCHANTS_STALE_TIME,
  useMerchantsQueryOptions,
} from "../data-access/queries";

/**
 * Hook for merchants list with client-side filtering
 * Pattern 1: Small dataset, filter/search on client
 */
export function useMerchantsList() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LifecycleStage | "ALL">("ALL");

  const queryOptions = useMerchantsQueryOptions();

  const merchantsQuery = useQuery({
    ...queryOptions.list,
    staleTime: MERCHANTS_STALE_TIME,
  });

  const allMerchants = merchantsQuery.data ?? [];

  // Client-side filtering (Pattern 1)
  const filteredMerchants = useMemo(() => {
    let filtered = allMerchants;

    if (stageFilter !== "ALL") {
      filtered = filtered.filter((m) => m.lifecycle_stage === stageFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.contact_email.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [allMerchants, stageFilter, search]);

  return {
    // Data
    merchants: filteredMerchants,
    allMerchants,

    // State
    isLoading: merchantsQuery.isLoading,
    isError: merchantsQuery.isError,
    error: merchantsQuery.error,

    // Filter controls
    search,
    setSearch,
    stageFilter,
    setStageFilter,
  };
}
