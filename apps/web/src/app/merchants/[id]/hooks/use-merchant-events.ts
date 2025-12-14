"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type { SourceType } from "@/core/db/schema";

import {
  EVENTS_STALE_TIME,
  useEventsQueryOptions,
} from "../data-access/queries";

/**
 * Hook for merchant events with client-side filtering
 * Pattern 1: Small dataset, filter/search on client
 */
export function useMerchantEvents(merchantId: string) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceType | "ALL">("ALL");

  const queryOptions = useEventsQueryOptions(merchantId);

  const eventsQuery = useQuery({
    ...queryOptions.events,
    staleTime: EVENTS_STALE_TIME,
  });

  const allEvents = eventsQuery.data ?? [];

  // Client-side filtering (Pattern 1)
  const filteredEvents = useMemo(() => {
    let filtered = allEvents;

    // Filter by source type
    if (sourceFilter !== "ALL") {
      filtered = filtered.filter((e) => e.source_type === sourceFilter);
    }

    // Search in raw_content and metadata fields
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((e) => {
        // Search in raw content
        if (e.raw_content.toLowerCase().includes(q)) return true;

        // Search in metadata fields
        const metadata = e.metadata as Record<string, unknown> | null;
        if (metadata) {
          // Check common metadata fields: subject (email), title (meeting)
          if (
            typeof metadata.subject === "string" &&
            metadata.subject.toLowerCase().includes(q)
          )
            return true;
          if (
            typeof metadata.title === "string" &&
            metadata.title.toLowerCase().includes(q)
          )
            return true;
          if (
            typeof metadata.from === "string" &&
            metadata.from.toLowerCase().includes(q)
          )
            return true;
        }

        return false;
      });
    }

    return filtered;
  }, [allEvents, sourceFilter, search]);

  return {
    // Data
    events: filteredEvents,
    allEvents,

    // State
    isLoading: eventsQuery.isLoading,
    isError: eventsQuery.isError,
    error: eventsQuery.error,

    // Filter controls
    search,
    setSearch,
    sourceFilter,
    setSourceFilter,
  };
}
