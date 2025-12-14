"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { SourceType } from "@/core/db/schema";

import {
  EVENTS_STALE_TIME,
  useEventSearchQueryOptions,
  useEventsQueryOptions,
} from "../data-access/queries";

// Debounce delay for semantic search (ms)
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook for merchant events with semantic search
 *
 * Behavior:
 * - Empty search: Load all events, filter client-side by source type
 * - Non-empty search: Use semantic search (server-side), ignore source filter
 */
export function useMerchantEvents(merchantId: string) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceType | "ALL">("ALL");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  const isSemanticSearch = debouncedSearch.trim().length > 0;

  // Query options
  const eventsQueryOptions = useEventsQueryOptions(merchantId);
  const searchQueryOptions = useEventSearchQueryOptions(
    merchantId,
    debouncedSearch,
  );

  // All events query (used when no search)
  const eventsQuery = useQuery({
    ...eventsQueryOptions.events,
    staleTime: EVENTS_STALE_TIME,
  });

  // Semantic search query (used when search is active)
  const searchQuery = useQuery({
    ...searchQueryOptions.search,
    staleTime: EVENTS_STALE_TIME,
  });

  const allEvents = eventsQuery.data ?? [];

  // Determine which data to use
  const events = useMemo(() => {
    // If semantic search is active, use search results directly
    if (isSemanticSearch) {
      // Search results include similarity score, map to event format
      return (searchQuery.data ?? []).map((r) => ({
        id: r.id,
        merchant_id: r.merchant_id,
        source_type: r.source_type as SourceType,
        source_id: r.source_id,
        raw_content: r.raw_content,
        metadata: r.metadata,
        processing_status: r.processing_status,
        processed_at: r.processed_at,
        created_at: r.created_at,
        embedding: null, // Not included in search results
        similarity: r.similarity, // Include similarity score
      }));
    }

    // Otherwise, apply client-side source filter
    let filtered = allEvents;

    if (sourceFilter !== "ALL") {
      filtered = filtered.filter((e) => e.source_type === sourceFilter);
    }

    return filtered;
  }, [isSemanticSearch, searchQuery.data, allEvents, sourceFilter]);

  // Loading state: show loading when search is pending
  const isLoading = isSemanticSearch
    ? searchQuery.isLoading || (search !== debouncedSearch && search.length > 0)
    : eventsQuery.isLoading;

  // Error state
  const isError = isSemanticSearch ? searchQuery.isError : eventsQuery.isError;
  const error = isSemanticSearch ? searchQuery.error : eventsQuery.error;

  return {
    // Data
    events,
    allEvents,

    // State
    isLoading,
    isError,
    error,
    isSemanticSearch,

    // Filter controls
    search,
    setSearch,
    sourceFilter,
    setSourceFilter,
  };
}
