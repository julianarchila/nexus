"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  countryProcessorFeatures,
  paymentProcessors,
} from "@/core/db/schema";
import {
  usePaymentProcessorsQueryOptions,
  QUERY_STALE_TIME,
} from "../data-access/queries";
import type { CapabilityFilters } from "./use-payment-processors-filters";

type PaymentProcessor = typeof paymentProcessors.$inferSelect;
type CountryFeature = typeof countryProcessorFeatures.$inferSelect;

export type DerivedSupport = {
  countries: string[];
  methods: string[];
  supports_local_instruments: boolean;
  supports_payouts: boolean;
  supports_crypto: boolean;
};

const PAGE_SIZE = 10;

function uniqSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function intersect(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.some((v) => setB.has(v));
}

type UsePaymentProcessorsDataParams = {
  page: number;
  search: string;
  selectedCountries: string[];
  selectedMethods: string[];
  capabilities: CapabilityFilters;
};

export function usePaymentProcessorsData({
  page,
  search,
  selectedCountries,
  selectedMethods,
  capabilities,
}: UsePaymentProcessorsDataParams) {
  const queryOptions = usePaymentProcessorsQueryOptions();

  const processorsQuery = useQuery({
    ...queryOptions.processors,
    staleTime: QUERY_STALE_TIME,
  });

  const featuresQuery = useQuery({
    ...queryOptions.countryFeatures,
    staleTime: QUERY_STALE_TIME,
  });

  const allProcessors = processorsQuery.data ?? [];
  const allFeatures = featuresQuery.data ?? [];
  const isLoading = processorsQuery.isLoading || featuresQuery.isLoading;

  // Group features by processor
  const featuresByProcessor = useMemo(() => {
    const map = new Map<string, CountryFeature[]>();
    for (const feature of allFeatures) {
      const arr = map.get(feature.processor_id) ?? [];
      arr.push(feature);
      map.set(feature.processor_id, arr);
    }
    return map;
  }, [allFeatures]);

  // Extract unique countries and methods for filter dropdowns
  const allCountries = useMemo(() => {
    return uniqSorted(allFeatures.map((f) => f.country));
  }, [allFeatures]);

  const allMethods = useMemo(() => {
    const values: string[] = [];
    for (const f of allFeatures) {
      if (Array.isArray(f.supported_methods)) {
        values.push(...f.supported_methods);
      }
    }
    return uniqSorted(values);
  }, [allFeatures]);

  // Compute derived support data per processor
  const derivedByProcessor = useMemo(() => {
    const map = new Map<string, DerivedSupport>();

    for (const processor of allProcessors) {
      const features = featuresByProcessor.get(processor.id) ?? [];
      const countries = uniqSorted(features.map((f) => f.country));
      const relevantFeatures =
        selectedCountries.length > 0
          ? features.filter((f) => selectedCountries.includes(f.country))
          : features;

      const methodValues: string[] = [];
      for (const f of relevantFeatures) {
        if (Array.isArray(f.supported_methods)) {
          methodValues.push(...f.supported_methods);
        }
      }
      const methods = uniqSorted(methodValues);

      const supports_local_instruments = relevantFeatures.some(
        (f) => f.supports_local_instruments,
      );
      const supports_payouts =
        processor.supports_payouts ||
        relevantFeatures.some((f) => f.supports_payouts);
      const supports_crypto =
        processor.supports_crypto ||
        relevantFeatures.some((f) => f.supports_crypto);

      map.set(processor.id, {
        countries,
        methods,
        supports_local_instruments,
        supports_payouts,
        supports_crypto,
      });
    }

    return map;
  }, [allProcessors, featuresByProcessor, selectedCountries]);

  // Apply filters and compute pagination
  const { filteredProcessors, totalPages } = useMemo(() => {
    let filtered = allProcessors;

    // Filter by country
    if (selectedCountries.length > 0) {
      filtered = filtered.filter((p) => {
        const d = derivedByProcessor.get(p.id);
        return d ? intersect(d.countries, selectedCountries) : false;
      });
    }

    // Filter by payment methods
    if (selectedMethods.length > 0) {
      filtered = filtered.filter((p) => {
        const d = derivedByProcessor.get(p.id);
        return d ? intersect(d.methods, selectedMethods) : false;
      });
    }

    // Filter by capabilities
    filtered = filtered.filter((p) => {
      const d = derivedByProcessor.get(p.id);
      if (!d) return false;

      if (capabilities.payouts && !d.supports_payouts) return false;
      if (capabilities.recurring && !p.supports_recurring) return false;
      if (capabilities.refunds && !p.supports_refunds) return false;
      if (capabilities.crypto && !d.supports_crypto) return false;
      if (capabilities.local_instruments && !d.supports_local_instruments)
        return false;

      return true;
    });

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const d = derivedByProcessor.get(p.id);
        const haystack = [
          p.name,
          p.id,
          p.status,
          p.product_manager ?? "",
          ...(d?.countries ?? []),
          ...(d?.methods ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    const total = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    return { filteredProcessors: filtered, totalPages: total };
  }, [
    allProcessors,
    capabilities,
    derivedByProcessor,
    search,
    selectedCountries,
    selectedMethods,
  ]);

  // Paginate results
  const processors = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProcessors.slice(start, start + PAGE_SIZE);
  }, [filteredProcessors, page]);

  return {
    // Query state
    isLoading,

    // Filter options
    allCountries,
    allMethods,

    // Results
    processors,
    filteredProcessors,
    totalPages,
    derivedByProcessor,
  };
}

export type { PaymentProcessor };
